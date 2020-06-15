import 'package:flutter/material.dart'; 

import 'package:flutter_blue/flutter_blue.dart';
import 'package:app/DevicesListElement.dart';

class DeviceListRoute extends StatefulWidget{
  @override
  const DeviceListRoute();
  
  DeviceListRouteState createState() => DeviceListRouteState();
}

class DeviceListRouteState extends State<DeviceListRoute>{

  FlutterBlue flutterBlue = FlutterBlue.instance;
  final _scannedDevices=<BluetoothDevice>[];
  final _deviceList= <DevicesListElement>[];

  @override
  void initState(){
    super.initState();
    flutterBlue.startScan(timeout: Duration(seconds: 4));
    flutterBlue.scanResults.listen((results) {
    for (ScanResult r in results) {
        _scannedDevices.add(r.device);
      }
    });
    flutterBlue.stopScan();

    for (var i = 0; i < _scannedDevices.length; i++) {
        _deviceList.add(DevicesListElement(
       deviceName : _scannedDevices[i].name,
        ));
    }
  }

 Widget build(BuildContext context){
  final listView = Container(
        color:Colors.grey,
        child: ListView.builder(
          itemCount: _deviceList.length,
          itemBuilder: (BuildContext context, int index) => _deviceList[index],
      )   
    );

  final appBar= AppBar(
    backgroundColor: Colors.white,
    elevation:1.0,
    title:Text(
      'Available Devices',
       textAlign: TextAlign.center,
          style:TextStyle(
          fontSize:24.0,
          color: Colors.black,
      ),
    ),
  );
   
  return Scaffold(
    appBar: appBar,
    body: listView,
  );

 }
}