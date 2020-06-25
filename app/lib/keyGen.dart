// import 'package:laksadart/laksadart.dart';
// import 'dart:math';
// import 'dart:convert';
import 'package:cryptography/cryptography.dart';
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
  void temporaryKeyGen () {
    // //generating a 16 byte cryptographically secure random number
    // int bitLength=128;//in bits
    // DartRandom rn = new DartRandom(new Random.secure());
    // var key= rn.nextBigInteger(bitLength);
    // return key;
    var key = SecretKey.randomBytes(16);
    print(key);
  }

  int genRPIK(BigInt tempKey){
    //var hmacSha256 = new Hmac(sha256, tempKey);


  }
  
}

void main() {
  KeyGeneration g = new KeyGeneration();
  var i = g.getIntervalNumber();
  print(i);
  g.temporaryKeyGen();
  //var temporaryKey= 
  //print(temporaryKey);
  //g.genRPIK(temporaryKey);
  //store i and temporaryKey

}
