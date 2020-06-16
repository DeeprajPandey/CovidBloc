import 'package:flutter/material.dart';
//import 'package:app/DeviceListRoute.dart';
import 'package:app/control_pannel.dart';

void main() {
  runApp(ContractTracingApp());
}

class ContractTracingApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Bluetooth Scanner',
      home: BluetoothPage(),
    );
  }
}