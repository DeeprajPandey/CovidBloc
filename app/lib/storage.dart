import 'package:path_provider/path_provider.dart';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
import 'dart:collection';
class Storage {

  Future<String> get localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  Future<File> localFile(String filename) async {
    final path = await localPath;
    //return File('$path/TempKey.json');
    return File('$path/$filename');
  }

  Future<List> readKeys() async {
    try {
      final file = await localFile('TempKey.json');
      // Read the file
      List contents = await file.readAsLines(); //list of strings
      final keys = [];
      //to ensure latest 14 keys are put up
      final length = contents.length;
      var start=0; 
      if (length>14) {
        start = length - 14;
      }
      for (var i=start;i<length;i++) {
        final jsonObj = json.decode(contents[i]);
        keys.add(jsonObj);
      }
      return keys;  //returning list of json objects

    } catch (e) {
      // If encountering an error, return 0
      //print(e.message);
      return null;
    }
  }

  Future<File> writeKey(String tempKeyHex, String ival) async {
    final file = await localFile('TempKey.json');
     Map tempKey = {
      'hexkey':tempKeyHex,
      'i': ival
    };
    final val = (json.encode(tempKey));
    //print(val[0]);
    // Write the file
    return file.writeAsString('$val\n',mode: FileMode.append, encoding: utf8,flush: true);
  }

  Future<void> delete() async {
    final path = await localPath;
    final dir = Directory(path);
    dir.deleteSync(recursive: true);
    print('file deleted');

  }

  Future<String> writeRPI(String exchangedRpi) async {
    final file = await localFile('ExchangedRPI.txt');
    List rpis=null;
    try {
      rpis= await file.readAsLines();
    } catch(e) {
      print("File not read");
    }
    if(rpis!=null) {
      if(rpis.contains(exchangedRpi)!=true) {
        await file.writeAsString('$exchangedRpi\n',mode:FileMode.append,encoding: utf8,flush:true);
        return "Done";
      }
      else{ 
        return null;
      }
    }
    else{
      await file.writeAsString('$exchangedRpi\n',mode:FileMode.append,encoding: utf8,flush:true);
      return "Done";
    }
    
  }

  Future<HashMap> readRPIs() async {
    try{
      final file = await localFile('ExchangedRPI.txt');
      List rpis = await file.readAsLines();
      HashMap contactRPIS =HashMap();
      for (var hexString in rpis) {
        contactRPIS.putIfAbsent(hexString, () => 1);
      }
      return contactRPIS;
    } catch(e) {
      return null;
    }
    
    
  }
    

}