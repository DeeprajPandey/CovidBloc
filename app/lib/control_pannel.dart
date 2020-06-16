import 'package:flutter/material.dart';
import 'package:app/bluetooth_state.dart';
import 'package:app/scanning.dart';
import 'package:provider/provider.dart';
import 'package:flutter_blue/flutter_blue.dart' as blue;

class BluetoothPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
        builder: (_) => Bluetooth(),
        child: Consumer<Bluetooth>(builder:(BuildContext context, Bluetooth bluetoothState, Widget child) {
            switch (bluetoothState.currentState) {
              case BleAppState.invalid:
                return Text('This device does not support bluetooth.');
              case BleAppState.failedToConnect:
                return FailedToConnect();
              case BleAppState.searching:
                return ScanningPage();
              case BleAppState.connected:
                return ConnectedSuccessfully(); 
          }
        }));
  }
}

class AvailableDevices extends StatelessWidget {
  AvailableDevices(this.availableBLEDevices);
  final Map<blue.DeviceIdentifier, blue.ScanResult> availableBLEDevices;
  @override
  Widget build(BuildContext context) {
    return ListView(
        children: availableBLEDevices.values
            .where((result) => result.device.name.length > 0)
            .map<Widget>((result) => ListTile(
                  leading:Icon(Icons.stay_current_portrait),
                  title: Text(result.device.name),
                  subtitle: Text(result.device.id.toString()),
                  onTap: () => Provider.of<Bluetooth>(context)
                      .connectToDevice(result.device),
                ))
            .toList()
              ..add(IconButton(
                icon: Icon(Icons.refresh),
                onPressed: () => Provider.of<Bluetooth>(context)
                    .setMode(BleAppState.searching),
              )));
  }
}