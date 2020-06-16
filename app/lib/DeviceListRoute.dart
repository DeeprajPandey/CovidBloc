import 'package:flutter/material.dart'; 

import 'package:flutter_blue/flutter_blue.dart';
import 'package:app/DevicesListElement.dart';

enum BleAppState {
  searching,
  connected,
  invalid,
  failedToConnect,
}

class DeviceListRoute extends StatefulWidget{
  @override
  const DeviceListRoute();
  
  DeviceListRouteState createState() => DeviceListRouteState();
}

class DeviceListRouteState extends State<DeviceListRoute>{

  FlutterBlue flutterBlue = FlutterBlue.instance;
  final _scannedDevices=<BluetoothDevice>[];
  final _deviceList= <DevicesListElement>[];
  BleAppState _currentState = BleAppState.searching;

  @override
  void initState(){
    super.initState();
    // if (flutterBlue.isAvailable != null) {
    //   if (flutterBlue.isScanning.first!= null) {
          _scannedDevices.clear();
          flutterBlue.startScan(timeout: Duration(seconds: 4));
          flutterBlue.scanResults.listen((results) {
          for (ScanResult r in results) {
           _scannedDevices.add(r.device);
        }
    });
    flutterBlue.stopScan();
    //   }
    // }
    // else{
    //   setMode(BleAppState.invalid);
    // }  
    }

    void setMode(BleAppState newState) {
    _currentState = newState;
  }
  
 Widget build(BuildContext context){
  for (var i = 0; i < _scannedDevices.length; i++) {
      if (_scannedDevices[i].name.length>0){
        _deviceList.add(DevicesListElement(
       deviceName : _scannedDevices[i].name,
        ));
    } 
  }

  final listView = Container(
        color:Colors.grey[100],
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
          fontSize:18.0,
          color: Colors.black,
      ),
    ),
  );
   
  return Scaffold(
    appBar: appBar,
    body: listView,
  );

 }
 BleAppState get currentState => _currentState;
}