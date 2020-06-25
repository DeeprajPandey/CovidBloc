// import 'package:laksadart/laksadart.dart';
// import 'dart:math';
import 'dart:convert' show utf8;
import 'package:convert/convert.dart';
import 'package:cryptography/cryptography.dart';
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
  SecretKey temporaryKeyGen () {
    // //generating a 16 byte cryptographically secure random number
    // int bitLength=128;//in bits
    // DartRandom rn = new DartRandom(new Random.secure());
    // var key= rn.nextBigInteger(bitLength);
    // return key;
    var key = SecretKey.randomBytes(16);
    return key;
  }

  //call this function as the temp key is generated at 12am 
  Future<SecretKey> genRPIK(SecretKey tempKey) async{
    var encoded = utf8.encode('EN-RPIK');
    final hkdf = Hkdf(Hmac(sha256));
    final rpik = await hkdf.deriveKey(tempKey,nonce:null,info:encoded,outputLength: 16);
    return rpik;

  }
  
}

void main() async {
  KeyGeneration g = new KeyGeneration();

  //SHOULD HAPPEN AT 12AM EVERYDAY
  SecretKey tempKey=g.temporaryKeyGen();
  var rpik= await g.genRPIK(tempKey);
  print(hex.encode(await tempKey.extract()));
  print(hex.encode(await rpik.extract()));

  //AT 10 MIN INTERVALS 
  var i = g.getIntervalNumber();
  print(i);
  

}
