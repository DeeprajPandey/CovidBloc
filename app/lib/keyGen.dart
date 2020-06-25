// import 'package:laksadart/laksadart.dart';
// import 'dart:math';
import 'dart:convert' show utf8;
import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';
import "dart:typed_data";
import 'dart:async';

class KeyGeneration {
  int getIntervalNumber() {
    //current local time
    var now = new DateTime.now();
    //print(now);

    //midnight local time
    var lastMidnight = new DateTime(now.year, now.month, now.day);
    //print(lastMidnight);

    // current unix timestamp
    var currentUnix = ((now.toUtc().millisecondsSinceEpoch) / 1000).floor();

    // midnight unix timestamp
    var lastMidnightUnix =
        ((lastMidnight.toUtc().millisecondsSinceEpoch) / 1000).floor();

    //difference between the two UNIX timestamps
    var diff = currentUnix - lastMidnightUnix;

    //calculating interval number
    var i = (diff / 600).floor();
    return i;
  }

  //call this function at 12am always
  SecretKey temporaryKeyGen() {
    // //generating a 16 byte cryptographically secure random number
    // int bitLength=128;//in bits
    // DartRandom rn = new DartRandom(new Random.secure());
    // var key= rn.nextBigInteger(bitLength);
    // return key;
    var key = SecretKey.randomBytes(16);
    return key;
  }

  //call this function as the temp key is generated at 12am
  Future<SecretKey> genRPIK(SecretKey tempKey) async {
    var encoded = utf8.encode('EN-RPIK');
    final hkdf = Hkdf(Hmac(sha256));
    final rpik = await hkdf.deriveKey(tempKey,
        nonce: null, info: encoded, outputLength: 16);
    return rpik;
  }

  Uint8List intToBytes(int val) =>
      Uint8List(4)..buffer.asByteData().setInt32(0, val, Endian.little);
}

void main() async {
  KeyGeneration g = new KeyGeneration();

  //SHOULD HAPPEN AT 12AM EVERYDAY
  SecretKey tempKey = g.temporaryKeyGen();
  var rpiKey = await g.genRPIK(tempKey);
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
  final int eNIntervalNumber = g.getIntervalNumber();
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
}
