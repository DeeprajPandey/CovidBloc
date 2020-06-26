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
  /// Calculate and return the index of the 10-min interval during
  /// a day that the given time lies in.
  ///
  /// ENIntervalNumber in Docs.
  ///
  /// @param timestamp  the current time of which we need the interval number
  /// @return      the 10-min interval index (0-143)
  int getIntervalNumber({DateTime timestamp}) {
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

  /// Generate the daily key every day at 00:00 that generates
  /// that day's keys. Called temporary exposure key in Doc.
  ///
  /// TemporaryExposureKey in Docs.
  ///
  /// @return       16-byte cryptographically secure key
  SecretKey temporaryExpKeygen() {
    return SecretKey.randomBytes(16);
  }

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
  Future<SecretKey> secondaryKeygen(SecretKey dailyKey,
      {String stringData}) async {
    var encodedData = utf8.encode(stringData);
    var hkdf = Hkdf(Hmac(sha256));
    var key = await hkdf.deriveKey(dailyKey,
        nonce: null, info: encodedData, outputLength: 16);
    return key;
  }

  /// Return the ByteData (List<int>) representation of an integer.
  /// 
  /// @param  val         number to be represented in bytes
  /// @return Uint8List   number in byte form
  Uint8List intToBytes(int val) =>
      Uint8List(4)..buffer.asByteData().setInt32(0, val, Endian.little);
}

// Using only for debug
void main() async {
  ExposureNotification g = new ExposureNotification();

  //SHOULD HAPPEN AT 12AM EVERYDAY
  SecretKey tempKey = g.temporaryExpKeygen();
  var rpiKey = await g.secondaryKeygen(tempKey, stringData: 'EN-RPIK');
  // print('Daily Key: ${hex.encode(await tempKey.extract())}');
  // print('RPI Key: ${hex.encode(await rpiKey.extract())}');

  // Create a mutable list to store the data
  List<int> paddedData = new List.generate(6, (index) => 0, growable: true);
  List.copyRange(paddedData, 0, utf8.encode('EN-RPI')); // [0,5]
  // add 0's from [6, 15], we will leave the 0's from 6-11
  for (var i = 0; i < 10; i++) {
    paddedData.add(0);
  }
  // get the current interval number (b/w 0-143)
  final int eNIntervalNumber =
      g.getIntervalNumber(timestamp: new DateTime.now());
  print('Current interval number: $eNIntervalNumber');

  // Add the little endian representation of ENINT to the end of RPI
  List.copyRange(paddedData, 12, g.intToBytes(eNIntervalNumber));

  // nonce is required by the lib function, we will concat rpi to this
  var nonce = aesGcm.newNonce();
  final rollingProximityIdentifier =
      await aesGcm.encrypt(paddedData, secretKey: rpiKey, nonce: nonce);
  // TODO: concat nonce to beginning of RPI

  print('RPI Hex: ${hex.encode(rollingProximityIdentifier)}');
  // print('RPI Bytes: $rollingProximityIdentifier');
  // print('RPI Bytes: ${hex.decode(hex.encode(rollingProximityIdentifier))}');

  var aemKey = g.secondaryKeygen(tempKey, stringData: 'CT-AEMK');
}
