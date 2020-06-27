// A Dart port of the Exposure Notification API. The class has
// a custom implementation of all the functionalities of the API.
//
// 2020. Ashoka University Computer Science.

import 'dart:async';
import 'dart:collection';
import 'dart:convert' show utf8;
import "dart:typed_data";

import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';
import 'package:encrypt/encrypt.dart';

class ExposureNotification {
  final _eKRollingPeriod = 144;
  /// Secret Keys
  // TODO: before pushing these keys to the server, change key to hex first
  Map _temporaryExposureKey = {'key': null, 'id': null}; // {key: SecretKey, i: uint32_t}
  SecretKey _rpiKey; // RollingProximityIdentifierKey
  SecretKey _aemKey; // AssociatedEncryptedMetadataKey

  int _eNIntervalNumber;
  List<int> rollingProximityIdentifier; // to be broadcasted
  List<int> associatedEncryptedMetadata; // additional metadata

  
  List<String> dummyRPIs = [
    'bb342beb25a89a79ff044a0c8444cfc7',
  ];
  // Fetched from the server periodically
  List<Map> diagnosisKeys = [
    {'key': '3bb405883fcac63130ee90507b71cc26', 'i': 2655425}
  ];
  // Generate a HashMap from the list of RPIs
  HashMap contactRPIs = HashMap();

  ExposureNotification() {
    // This dummy code is how we will add new RPIs to the hashmap
    for (var hexString in this.dummyRPIs) {
      // only add an RPI if it's not already in the hashmap
      this.contactRPIs.putIfAbsent(hexString, () => 1);
    }

    // TODO: First try reading from storage, if empty, run this
    // with firstRun: true
    this._eNIntervalNumber =
        this._getIntervalNumber(timestamp: new DateTime.now());
    print('(constructor) Intialised ENIntervalNum');

    // TODO: Find when the next interval starts and set up one-shot
    // scheduler to do this.
    // var now = new DateTime.now();
    // 15 _getIntervalNumber()
    // 15 +1 -> time - now;

    // const timeToInitiate = const Duration(seconds: 60);
    const tenMins = const Duration(minutes: 10);

    // 3:04
    // new Timer(
    //     timeToInitiate,
    //     () async => await this._scheduler(firstRun: true)); // 3:10

    new Timer.periodic(
        tenMins, (timer) async => await this._scheduler(firstRun: true));

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
  int _getIval({DateTime timestamp}) => ((this._getIntervalNumber(timestamp: timestamp) /this._eKRollingPeriod).floor() * this._eKRollingPeriod);

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

    var key = Key(await localRPIKey.extract());
    var cipher = Encrypter(AES(key, mode: AESMode.ecb, padding: null));
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

    var key = Key(await this._aemKey.extract());
    var cipher = Encrypter(AES(key, mode: AESMode.ctr, padding: 'PKCS7'));
    List<int> aem = cipher
        .encryptBytes(metadata, iv: IV(this.rollingProximityIdentifier))
        .bytes;

    this.associatedEncryptedMetadata = aem;
    print('(_aemGen) AEM Length: ${aem.length}');
    print('(_aemGen) Update AEM');
    return hex.encode(aem);
  }

  /// The driver/scheduler function
  Future<void> _scheduler({bool firstRun = false}) async {
    int currInterval = this._getIntervalNumber(timestamp: new DateTime.now());
    this._eNIntervalNumber = currInterval;
    print('(_scheduler) Updated ENIntervalNum: $currInterval');

    int currIval = this._getIval(timestamp: new DateTime.now());
    
    // If tempKey hasn't been set yet
    // or if it's been more than 24 hours since last keygen (i value must have changed)
    if (this._temporaryExposureKey['i'] == null || this._temporaryExposureKey['i'] != currIval) {
      this._temporaryExposureKey['i'] = currIval;
      this._temporaryExposureKey['key'] = this._dailyKeygen();

      var tempKeyHex = hex.encode(await this._temporaryExposureKey['key'].extract());
      print('(_scheduler) Generated new TempExpKey: $tempKeyHex');
      print('(_scheduler) i: ${this._temporaryExposureKey['i']}');
    }

    this._rpiKey = await this
        ._secondaryKeygen(_temporaryExposureKey['key'], stringData: 'EN-RPIK');
    print('(_scheduler) Updated RPI Key');

    // now generate a new RPI
    var rpiHex = await this._rpiGen(localRPIKey: this._rpiKey, interval: this._eNIntervalNumber);
    print('(_scheduler) RPI Hex: $rpiHex');

    this._aemKey = await this
        ._secondaryKeygen(_temporaryExposureKey['key'], stringData: 'CT-AEMK');
    print('(_scheduler) Updated AEM Key');
    // print('AEM Key: ${hex.encode(await aemKey.extract())}');

    var aemHex = await this._aemGen();
    print('(_scheduler) AEM Hex: $aemHex');

    print('\n');
  }

  /// Check for exposures
  Future<void> checkExposure() async {
    int exposedCtr = 0;
    for (var positiveKey in this.diagnosisKeys) {
      // We received the keys as hex strings. Convert them to bytes and create a SecretKey instance.
      var tempKey = SecretKey(hex.decode(positiveKey['key']));
      var tempIval = positiveKey['i'];
      var tempRPIKey = await this._secondaryKeygen(tempKey, stringData: 'EN-RPIK'); 

      // Generate an RPI for all intervals during the day
      for (var i = tempIval; i < tempIval + 144; i++) {
        var tempRPIHex = await this._rpiGen(localRPIKey: tempRPIKey, interval: i);
        // Now check if we ever came in contact with this rolling proximity identifier
        if (this.contactRPIs.containsKey(tempRPIHex)) {
          exposedCtr++;
        }
      }
    }
    print('\n\nExposed counter: $exposedCtr\n\n'); // should be 5
  }
}

// Using only for debug
void main() async {
  var exp = new ExposureNotification();
  exp.checkExposure();
}
