// A Dart port of the Exposure Notification API. The class has
// a custom implementation of all the functionalities of the API.
//
// 2020. Ashoka University Computer Science.

import 'dart:async';
import 'dart:convert' show utf8;
import "dart:typed_data";

import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';

class ExposureNotification {
  /// Secret Keys
  SecretKey _temporaryExposureKey;
  SecretKey _rpiKey; // RollingProximityIdentifierKey
  SecretKey _aemKey; // AssociatedEncryptedMetadataKey

  int _eNIntervalNumber;
  List<int> rollingProximityIdentifier; // to be broadcasted
  List<int> associatedEncryptedMetadata; // additional metadata

  ExposureNotification() {
    // TODO: First try reading from storage, if empty, run this
    // with firstRun: true
    this._eNIntervalNumber =
        this._getIntervalNumber(timestamp: new DateTime.now());
    print('(constructor) Intialised ENIntervalNum');

    // TODO: Find when the next interval starts and set up one-shot
    // scheduler to do this.
    const tenMins = const Duration(seconds: 10);
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

    // Nonce is required by the lib function, we will concat rpi to this
    var cipher = aesGcm;
    var nonce = Nonce.randomBytes(16);
    List<int> rpi =
        await cipher.encrypt(paddedData, secretKey: this._rpiKey, nonce: nonce);
    // TODO: concat nonce to beginning of RPI (gotcha: AEM needs RPI)

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
    var aes_ctr = CipherWithAppendedMac(aesCtr, Hmac(sha256));

    List<int> aem = await aes_ctr.encrypt(metadata,
        secretKey: this._aemKey, nonce: Nonce(this.rollingProximityIdentifier));
    
    this.associatedEncryptedMetadata = aem;
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
    print('(_scheduler) RPI Hex (w/o nonce): $rpiHex');

    this._aemKey = await this
        ._secondaryKeygen(_temporaryExposureKey, stringData: 'CT-AEMK');
    print('(_scheduler) Updated AEM Key');
    // print('AEM Key: ${hex.encode(await aemKey.extract())}');

    // Issue: AEM needs RPI as IV but RPI is 32 Bytes however nonce limit for AES_CTR is 16 Bytes
    // var aemHex = await this._aemGen();
    // print('[scheduler] AEM Hex: $aemHex');

    print('\n');
  }
}

// Using only for debug
void main() async {
  new ExposureNotification();
}
