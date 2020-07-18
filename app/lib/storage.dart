import 'package:path_provider/path_provider.dart';
import 'dart:async';
import 'dart:io';
import 'dart:convert';
class Storage {

  Future<String> get localPath async {
    final directory = await getApplicationDocumentsDirectory();
    return directory.path;
  }

  Future<File> get localFile async {
    final path = await localPath;
    return File('$path/TempKey.json');
  }

  Future<List> readKeys() async {
    try {
      final file = await localFile;
      // Read the file
      List contents = await file.readAsLines();
      return contents;

    } catch (e) {
      // If encountering an error, return 0
      print(e.message);
      return null;
    }
  }

  Future<File> writeKey(String tempKeyHex, String ival) async {
    final file = await localFile;
     Map tempKey = {
      'hexkey':tempKeyHex,
      'i': ival
    };
    final val = (json.encode(tempKey));
    // Write the file
    return file.writeAsString('$val\n',mode: FileMode.append, encoding: utf8,flush: false);
  }

  Future<void> delete() async {
    final path = await localPath;
    final dir = Directory(path);
    dir.deleteSync(recursive: true);
    print('file deleted');

  }
    

}