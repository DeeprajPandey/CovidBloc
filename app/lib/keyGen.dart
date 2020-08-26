// A Dart port of the Exposure Notification API. The class has
// a custom implementation of all the functionalities of the API.

import 'dart:async';
import 'dart:collection';
import 'dart:convert' show utf8;
import "dart:typed_data";
import 'package:dio/dio.dart';
import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';
import 'package:encrypt/encrypt.dart' as encrypt;
import './storage.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

//import 'package:cron/cron.dart';
//import 'package:android_alarm_manager/android_alarm_manager.dart';

class ExposureNotification extends ChangeNotifier {
  final _eKRollingPeriod = 144;

  /// Secret Keys
  /// {key: SecretKey, i: uint32_t}
  Map _temporaryExposureKey = {'key': null, 'i': null};

  SecretKey _rpiKey; // RollingProximityIdentifierKey
  SecretKey _aemKey; // AssociatedEncryptedMetadataKey
  // int exposedCounter=0;
  // int get counter => exposedCounter;
  HashMap exposedKeys = new HashMap();
  HashMap get exposedTimestamps => exposedKeys;

  //connection to server
  static BaseOptions options = new BaseOptions(
    baseUrl: "http://192.168.0.152:6400/",
  );

  //Dio object
  Dio dio = new Dio(options);

  //to connect to server thread
  static const platform = const MethodChannel('samples.flutter.dev/bluetooth');

  int _eNIntervalNumber;
  int iVal;
  List<int> rollingProximityIdentifier = null; // to be broadcasted
  List<int> associatedEncryptedMetadata; // additional metadata

  //Make a storage class object to write temporary keys to the file
  final Storage s = new Storage();

  ExposureNotification() {
    //updating current temporaryExposureKey map from file.
    s.readKeys().then((keys) {
      if (keys != null) {
        int length = keys.length;
        this._temporaryExposureKey['key'] =
            SecretKey(hex.decode(keys[length - 1]['hexkey']));
        this._temporaryExposureKey['i'] = int.parse(keys[length - 1]['i']);
        print(
            '(constructor) TemporaryExposureKey i value ${this._temporaryExposureKey['i']}');
        print(keys[length - 1]['hexkey']);
      }
    });

    this.iVal = _getIval(timestamp: new DateTime.now());
    this._eNIntervalNumber =
        this._getIntervalNumber(timestamp: new DateTime.now());
    print('(constructor) Intialised ENIntervalNum');

    //print('Running alarm manager');
    //AndroidAlarmManager.periodic(const Duration(minutes: 1), 0, callback);
    const tenMins = const Duration(minutes: 10);
    new Timer.periodic(tenMins, (timer) async => await this.scheduler());

    //   var cron = new Cron();
    //   cron.schedule(new Schedule.parse('*/10 * * * *'), () async {
    //     this.scheduler();
    // });

    print('\n');
  }

  /// Calculate and return the index of the 10-min interval during
  /// a day that the given time lies in.
  ///
  /// ENIntervalNumber in Docs.
  ///
  /// @param timestamp  the current time of which we need the interval number
  /// @return      the 10-min interval
  int _getIntervalNumber({DateTime timestamp}) {
    // Get the Unix time for that day's midnight and current time
    var currentUnix =
        ((timestamp.toUtc().millisecondsSinceEpoch) / 1000).floor();

    // Calculate the current 10-min interval number in the day
    return (currentUnix / 600).floor();
  }

  /// This returns the i value that changes every 24 hours
  /// Stored with every TempExpKey.
  int _getIval({DateTime timestamp}) =>
      ((this._getIntervalNumber(timestamp: timestamp) / this._eKRollingPeriod)
              .floor() *
          this._eKRollingPeriod);

  /// Generate the daily temporary exposure key.
  ///
  /// @return       16-byte cryptographically secure key
  SecretKey _dailyKeygen() => SecretKey.randomBytes(16);

  /// Return the ByteData (List<int>) representation of an integer.
  ///
  /// @param  val         number to be represented in bytes
  /// @return Uint8List   number in byte form
  Uint8List _intToBytes(int val) =>
      Uint8List(4)..buffer.asByteData().setInt32(0, val, Endian.little);

  /// Generate the secodary set of keys for the final encryption.
  ///
  /// This utility function can be used to generate the rolling
  /// proximity identifier key and the associated encrypted metadata
  /// key.
  ///
  /// @param  dailyKey    that day's temporary exposure key
  ///         stringData  string that will be encoded during keygen
  ///                     (either EN-RPI or CT-AEMK)
  /// @return key         generated RPI or AEM key
  Future<SecretKey> _secondaryKeygen(SecretKey dailyKey,
      {String stringData}) async {
    var encodedData = utf8.encode(stringData);
    var hkdf = Hkdf(Hmac(sha256));
    var key = await hkdf.deriveKey(dailyKey,
        nonce: null, info: encodedData, outputLength: 16);
    return key;
  }

  /// Generate the Rolling Proximity Identifier using the RPI Key.
  ///
  /// Called every 10 minutes.
  ///
  /// @param  interval  10-min interval i for which we need the RPI
  /// @return rpi       hex encoding of the rolling proximity ID
  Future<String> _rpiGen({SecretKey localRPIKey, int interval}) async {
    // Create a mutable list to store PaddedData
    List<int> paddedData = new List.generate(6, (index) => 0, growable: true);
    // PaddedData starts with the bytes for thisstring
    List.copyRange(paddedData, 0, utf8.encode('EN-RPI')); // [0,5]

    // add 0's from [6, 15], we will leave the 0's from 6-11 for interval id
    for (var i = 0; i < 10; i++) {
      paddedData.add(0);
    }

    // Add the little endian representation of ENINT to the end of RPI
    List.copyRange(paddedData, 12, this._intToBytes(interval));

    var key = encrypt.Key(await localRPIKey.extract());
    var cipher = encrypt.Encrypter(
        encrypt.AES(key, mode: encrypt.AESMode.ecb, padding: null));
    List<int> rpi = cipher.encryptBytes(paddedData, iv: null).bytes;

    // print('(_repiGen) RPI Bytes: ${rpi.length}');
    // print('RPI Bytes: ${hex.decode(hex.encode(rpi))}');
    // print('RPI Hex: ${hex.encode(rpi)}');
    this.rollingProximityIdentifier = rpi;
    // print('(_rpiGen) Updated RPI');
    return hex.encode(rpi);
  }

  /// Generate the Associated Encrypted Metadata using the AEM Key.
  ///
  /// Called every 10 mins with _rpiGen()
  ///
  /// @return   aem   hexadecimal encoding of aem
  Future<String> _aemGen() async {
    // Use placeholder for msg as specsheet has no info on this
    var metadata = utf8.encode("Metadata");

    var key = encrypt.Key(await this._aemKey.extract());
    var cipher = encrypt.Encrypter(
        encrypt.AES(key, mode: encrypt.AESMode.ctr, padding: 'PKCS7'));
    List<int> aem = cipher
        .encryptBytes(metadata, iv: encrypt.IV(this.rollingProximityIdentifier))
        .bytes;

    this.associatedEncryptedMetadata = aem;
    print('(_aemGen) AEM Length: ${aem.length}');
    print('(_aemGen) Update AEM');
    return hex.encode(aem);
  }

  /// The driver/scheduler function
  Future<void> scheduler() async {
    int currInterval = this._getIntervalNumber(timestamp: new DateTime.now());
    this._eNIntervalNumber = currInterval;
    print('(scheduler) Updated ENIntervalNum: $currInterval');

    int currIval = this._getIval(timestamp: new DateTime.now());
    this.iVal = currIval;

    // If tempKey hasn't been set yet
    // or if it's been more than 24 hours since last keygen (i value must have changed)

    if (this._temporaryExposureKey['i'] == null ||
        this._temporaryExposureKey['i'] != currIval) {
      this._temporaryExposureKey['i'] = currIval;
      this._temporaryExposureKey['key'] = this._dailyKeygen();

      var tempKeyHex =
          hex.encode(await this._temporaryExposureKey['key'].extract());

      await s.writeKey(tempKeyHex, this._temporaryExposureKey['i'].toString());

      print('(scheduler) Generated new TempExpKey: $tempKeyHex');
      print('(scheduler) i: ${this._temporaryExposureKey['i']}');

      //remove once a day
      exposedKeys.removeWhere(
          (key, value) => (DateTime.now().difference(value)).inDays > 14);
    }

    this._rpiKey = await this
        ._secondaryKeygen(_temporaryExposureKey['key'], stringData: 'EN-RPIK');
    print('(scheduler) Updated RPI Key');

    // now generate a new RPI
    var rpiHex = await this
        ._rpiGen(localRPIKey: this._rpiKey, interval: this._eNIntervalNumber);
    print('(scheduler) RPI Hex: $rpiHex');

    try {
      await platform.invokeMethod("messageForServer", {
        "message": rpiHex.toString(),
      });
    } on PlatformException catch (e) {
      print('Unable to send the rpi to android native side');
      print(e.message);
    }

    this._aemKey = await this
        ._secondaryKeygen(_temporaryExposureKey['key'], stringData: 'CT-AEMK');
    print('(scheduler) Updated AEM Key');
    // print('AEM Key: ${hex.encode(await aemKey.extract())}');

    var aemHex = await this._aemGen();
    print('(scheduler) AEM Hex: $aemHex');

    print('(schedular) Checking exposure');
    //fetching data from server
    Response response;
    try {
      response =
          await dio.post("/keys", data: {"currentIval": currIval.toString()});
    } catch (e) {
      print(e.message);
    }

    // Read the hashmap of RPIs saved in local storage
    HashMap contactRPI = await s.readRPIs();
    if (contactRPI != null && response.data != null) {
      checkExposure(response.data, contactRPI);
    }

    print('\n');
  }

  /// Check for exposures
  Future<void> checkExposure(List diagnosisKeys, HashMap contactRPIs) async {
    //int exposedCtr = 0;
    for (var positiveKey in diagnosisKeys) {
      // We received the keys as hex strings. Convert them to bytes and create a SecretKey instance.
      var tempKey = SecretKey(hex.decode(positiveKey['hexkey']));
      var tempIval = int.parse(positiveKey['i']);
      var tempRPIKey =
          await this._secondaryKeygen(tempKey, stringData: 'EN-RPIK');

      // Generate an RPI for all intervals during the day
      for (var i = tempIval; i < tempIval + 144; i++) {
        var tempRPIHex =
            await this._rpiGen(localRPIKey: tempRPIKey, interval: i);
        // Now check if we ever came in contact with this rolling proximity identifier
        if (contactRPIs.containsKey(tempRPIHex)) {
          //find timestamp in indian standart time for this interval
          var date = new DateTime.fromMillisecondsSinceEpoch((i * 600) * 1000);
          exposedKeys.putIfAbsent(positiveKey['hexkey'], () => date);
          break;
          //exposedCtr++;
        }
      }
    }

    notifyListeners();
  }
}

// Using only for debug
// void main() async {
//   var exp = new ExposureNotification();
//   exp.checkExposure();
// }
