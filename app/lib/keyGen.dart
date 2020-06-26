// A Dart port of the Exposure Notification API. The class has
// a custom implementation of all the functionalities of the API.
//
// 2020. Ashoka University Computer Science.

import 'dart:async';
import 'dart:convert' show utf8;
import "dart:typed_data";

import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';
import 'package:encrypt/encrypt.dart';

class ExposureNotification {
  /// Secret Keys
  SecretKey _temporaryExposureKey;
  SecretKey _rpiKey; // RollingProximityIdentifierKey
  SecretKey _aemKey; // AssociatedEncryptedMetadataKey

  int _eNIntervalNumber;
  List<int> rollingProximityIdentifier; // to be broadcasted
  List<int> associatedEncryptedMetadata; // additional metadata

  List<String> contactRpis = [
    '65a3940ff9343e6b0afb27ac1d30059b',
    'f241cadcbb65dcc8a45c1d882a6871c1',
    'a5c195f57dc71dd5ef0047ec29ab590d',
    '5fbc80fc28cded25a1c6f03244921dcc',
    '4b9a9ef328d45fedf45f99cb08a9aee4',
    'e01e6ed198be1c1572260f60c7b53fa0',
    '932e02169bbfa1cfe31c02f84a5234c6',
    '0ea3354ac2ef09ccc01ba42c75b0c4c1',
    '7ac430efe6432860047f00e1b438b84a'
  ];
  // Fetched from the server periodically
  List<String> diagnosisKeys = [
    '3ea0716b1ec754e85ca4e91d81bdb019',
    'd529f8371571ce5069e3e227d4f3a3c2',
    'c1248a8fceb814c7f20f659bc5f67b47',
    '47ab81977cf0b2d637395a3ae52f3942',
    '08e26ee695685e2062bdb0bec0afceb8',
    '2c3b4cad354cf9ba828f4d4039e17e30',
    '2018619fe1ca21541616fde56a9e02a1',
    '23b5053f108580ecedccee133ae032e3',
    'b75b3034b9cf09f0d31f0ef02d4f494e'
  ];

  ExposureNotification() {
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
    const tenMins = const Duration(seconds: 5);

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
  /// @return      the 10-min interval index (0-143)
  int _getIntervalNumber({DateTime timestamp}) {
    var lastMidnight =
        new DateTime(timestamp.year, timestamp.month, timestamp.day);

    // Get the Unix time for that day's midnight and current time
    var currentUnix =
        ((timestamp.toUtc().millisecondsSinceEpoch) / 1000).floor();
    var lastMidnightUnix =
        ((lastMidnight.toUtc().millisecondsSinceEpoch) / 1000).floor();

    // This is how long it has been since the day started
    var diff = currentUnix - lastMidnightUnix;

    // Calculate the current 10-min interval number in the day
    return (diff / 600).floor();
  }

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
  /// @return rpi   hex encoding of the rolling proximity ID
  Future<String> _rpiGen() async {
    // Create a mutable list to store PaddedData
    List<int> paddedData = new List.generate(6, (index) => 0, growable: true);
    // PaddedData starts with the bytes for thisstring
    List.copyRange(paddedData, 0, utf8.encode('EN-RPI')); // [0,5]

    // add 0's from [6, 15], we will leave the 0's from 6-11 for interval id
    for (var i = 0; i < 10; i++) {
      paddedData.add(0);
    }

    // Add the little endian representation of ENINT to the end of RPI
    List.copyRange(paddedData, 12, this._intToBytes(this._eNIntervalNumber));

    var key = Key(await this._rpiKey.extract());
    var cipher = Encrypter(AES(key, mode: AESMode.ecb, padding: null));
    List<int> rpi = cipher.encryptBytes(paddedData, iv: null).bytes;

    print('(_repiGen) RPI Bytes: ${rpi.length}');
    // print('RPI Bytes: ${hex.decode(hex.encode(rpi))}');
    // print('RPI Hex: ${hex.encode(rpi)}');
    this.rollingProximityIdentifier = rpi;
    print('(_rpiGen) Updated RPI');
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
    // It's after 00:00, get a new daily key
    if (currInterval == 0 || firstRun) {
      this._temporaryExposureKey = this._dailyKeygen();
      print(
          '(_scheduler) Updated TempExpKey: ${hex.encode(await this._temporaryExposureKey.extract())}');
    }
    this._eNIntervalNumber = currInterval;
    print('(_scheduler) Updated ENIntervalNum: $currInterval');

    this._rpiKey = await this
        ._secondaryKeygen(_temporaryExposureKey, stringData: 'EN-RPIK');
    print('(_scheduler) Updated RPI Key');

    // now generate a new RPI
    var rpiHex = await this._rpiGen();
    print('(_scheduler) RPI Hex: $rpiHex');

    this._aemKey = await this
        ._secondaryKeygen(_temporaryExposureKey, stringData: 'CT-AEMK');
    print('(_scheduler) Updated AEM Key');
    // print('AEM Key: ${hex.encode(await aemKey.extract())}');

    // Issue: AEM needs RPI as IV but RPI is 32 Bytes however nonce limit for AES_CTR is 16 Bytes
    var aemHex = await this._aemGen();
    print('(scheduler) AEM Hex: $aemHex');

    print('\n');
  }
}

// Using only for debug
void main() async {
  new ExposureNotification();
}
