import 'dart:async';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart';
//import 'package:contact_tracing/widgets/widgets.dart';
import 'package:contact_tracing/config/styles.dart';
import '../keyGen.dart';
//import 'package:provider/provider.dart';


typedef void Listener(dynamic msg);
typedef void CancelListening();

class BluetoothScreen extends StatefulWidget {
  
  final ExposureNotification e;

  const BluetoothScreen({
    @required this.e,
  }):assert(e!=null);

  @override
  BluetoothScreenState createState() => new BluetoothScreenState(e:e);
}

class BluetoothScreenState extends State<BluetoothScreen> {
  final ExposureNotification e;

  BluetoothScreenState({
    @required this.e,
  }):assert(e!=null);

  BluetoothState _bluetoothState = BluetoothState.UNKNOWN;
  static const platform = const MethodChannel('samples.flutter.dev/bluetooth');
  
  String _address = "...";
  String _name = "...";

  final bool isThreeLine=true;

  
  
  @override
  void initState() {
    // this.e = e;
    super.initState();
    

    // Get current state
    FlutterBluetoothSerial.instance.state.then((state) {
      setState(() {
        _bluetoothState = state;
      });
    });

    Future.doWhile(() async {
      // Wait if adapter not enabled
      if (await FlutterBluetoothSerial.instance.isEnabled) {
        return false;
      }
      await Future.delayed(Duration(milliseconds: 0xDD));
      return true;
    }).then((_) {
      // Update the address field
      FlutterBluetoothSerial.instance.address.then((address) {
        setState(() {
          _address = address;
        });
      });
    });

    FlutterBluetoothSerial.instance.name.then((name) {
      setState(() {
        _name = name;
      });
    });

    // Listen for futher state changes
    FlutterBluetoothSerial.instance
        .onStateChanged()
        .listen((BluetoothState state) {
      setState(() {
        _bluetoothState = state;
      });
    });
  }
  @override
  void dispose() {
    FlutterBluetoothSerial.instance.setPairingRequestHandler(null);
    super.dispose();
  }
  
  
  Future<void> _startServer () async {
    String connStatus;
    try{
      connStatus = await platform.invokeMethod("customStartServer");
    }on PlatformException catch(e){
      print("Failed to establish connection: '${e.message}'");
      connStatus = "Connection failed";
    }

    print("Connection status : $connStatus\n");
  }


  @override
  Widget build(BuildContext context) {
    //_startServer();
    return Scaffold(
      appBar: AppBar(
        title: const Text('Flutter Bluetooth Serial'),
        backgroundColor: Styles.primaryColor, 
      ),
      body: Container(
        child: ListView(
          children: <Widget>[
            Divider(),
            SwitchListTile(
              title: const Text('Enable Bluetooth'),
              value: _bluetoothState.isEnabled,
              onChanged: (bool value) {
                // Do the request and update with the true value then
                future() async {
                  // async lambda seems to not working
                  if (value) {
                    await FlutterBluetoothSerial.instance.requestEnable();
                    await _startServer();
                  }
                  else
                    await FlutterBluetoothSerial.instance.requestDisable();
                }

                future().then((_) {
                  setState(() {});
                });
              },
            ),
            ListTile(
              title: const Text('Bluetooth status'),
              subtitle: Text(_bluetoothState.toString()),
              trailing: RaisedButton(
                child: const Text('Settings'),
                onPressed: () {
                  FlutterBluetoothSerial.instance.openSettings();
                },
              ),
            ),
            ListTile(
              title: const Text('Local Adapter'),
              subtitle: Text('Address: '+ _address + '\n'+'Name: '+ _name),
            ),
        
            Divider(),
            ListTile(title: const Text('Devices discovery and connection')),
            ListTile(
              title: RaisedButton(
                  child: const Text('Scan for Available Devices'),
                  onPressed: () async {
                    final BluetoothDevice selectedDevice =
                        await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) {
                          return DiscoveryPage(exp:e);
                        },
                      ),
                    );

                    if (selectedDevice != null) {
                      print('Discovery -> selected ' + selectedDevice.address);
                    } else {
                      print('Discovery -> no device selected');
                    }
                  }),
            ),
            ListTile(
              title: RaisedButton(
                child: const Text('Connect to a Paired Device'),
                onPressed: () async {
                  final BluetoothDevice selectedDevice =
                      await Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (context) {
                        return SelectBondedDevicePage(checkAvailability: false,exp:e);
                      },
                    ),
                  );

                  if (selectedDevice != null) {
                    print('Connect -> selected ' + selectedDevice.address);
                    //_startChat(context, selectedDevice);
                  } else {
                    print('Connect -> no device selected');
                  }
                },
              ),
            ),
            // ListTile(
            //   title: RaisedButton(
            //     child: const Text('Start Server'),
            //     onPressed: () {
            //       _startServer();
            //     },
            //   ),
            // ),
          ],
        ),
      ),
    );
  }
}