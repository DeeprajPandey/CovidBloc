import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:progress_indicators/progress_indicators.dart';
import './BluetoothDeviceListEntry.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter/services.dart';
import './keyGen.dart';
import 'package:convert/convert.dart';


class DiscoveryPage extends StatefulWidget {
  /// If true, discovery starts on page start, otherwise user must press action button.
  final bool start;
  final ExposureNotification exp;

  const DiscoveryPage({this.start = true,
  @required this.exp,
  }):assert(exp!=null);

  @override
  DiscoveryPageState createState() => new DiscoveryPageState(exp:exp);
}

class DiscoveryPageState extends State<DiscoveryPage> {
  final ExposureNotification exp;
  static const platform = const MethodChannel('samples.flutter.dev/bluetooth');
  StreamSubscription<BluetoothDiscoveryResult> _streamSubscription;
  List<BluetoothDiscoveryResult> results = List<BluetoothDiscoveryResult>();
  bool isDiscovering;
  // String _statusMsg = 'Waiting for response';

  DiscoveryPageState({@required this.exp,}):assert(exp!=null);

  @override
  void initState() {
    super.initState();

    isDiscovering = widget.start;
    if (isDiscovering) {
      _startDiscovery();
    }
  }

  void _restartDiscovery() {
    setState(() {
      results.clear();
      isDiscovering = true;
    });

    _startDiscovery();
  }

  void _startDiscovery() {
    _streamSubscription =
        FlutterBluetoothSerial.instance.startDiscovery().listen((r) {
      setState(() {
        results.add(r);
      });
    });

    _streamSubscription.onDone(() {
      setState(() {
        isDiscovering = false;
      });
    });
  }


  @override
  void dispose() {
    // Avoid memory leak (`setState` after dispose) and cancel discovery
    _streamSubscription?.cancel();

    super.dispose();
  }

  Future<void> _showKeyinDialogue(BuildContext context,String keyReceived) async {
  return showDialog<void>(
    context:context,
    barrierDismissible: false, // user must tap button!
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text('Exchanged Key'),
        content: SingleChildScrollView(
          child: ListBody(
            children: <Widget>[
              Text(keyReceived),
              Text('Would you like to store this key?'),
            ],
          ),
        ),
        actions: <Widget>[
          FlatButton(
            child: Text('Approve'),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ],
      );
    },
  );
}

  Future<void> connectToDevice(BuildContext context, BluetoothDevice dev) async {
    String exchangedKey;
    List<int> rpi= exp.rollingProximityIdentifier;
    String rollingProximityIdentifier=hex.encode(rpi);
    try {
      exchangedKey =
          await platform.invokeMethod('customConnectToDevice', {"address": dev.address,"message":rollingProximityIdentifier});
    } on PlatformException catch (e) {
      print("Failed to establish connection: '${e.message}'");
    }
    print("From dart: : $exchangedKey\n");
     _showKeyinDialogue(context,exchangedKey);
  }

  @override
  Widget build(BuildContext context) {
    if (isDiscovering) {
      return Scaffold(
        body: Container(
          color: Colors.blue,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.all(10.0),
                child: SpinKitWave(
                    color: Colors.white, type: SpinKitWaveType.end, size: 30),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: <Widget>[
                  Text(
                    'Scanning for bluetooth devices',
                    style: TextStyle(
                      fontSize: 18.0,
                      color: Colors.white,
                    ),
                  ),
                  FadingText('...'),
                ],
              ),
            ],
          ),
        ),
      );
    } else {
      return Scaffold(
        appBar: AppBar(
          title: Text('Available devices'),
          actions: <Widget>[
            IconButton(
              icon: Icon(Icons.replay),
              onPressed: _restartDiscovery,
            )
          ],
        ),
        body: ListView.builder(
          itemCount: results.length,
          itemBuilder: (BuildContext context, index) {
            BluetoothDiscoveryResult result = results[index];
            return BluetoothDeviceListEntry(
              device: result.device,
              rssi: result.rssi,
              onTap: () {
                connectToDevice(context,result.device);
                //Navigator.of(context).pop(result.device);
              },
              
              onLongPress: () async {
                try {
                  bool bonded = false;
                  if (result.device.isBonded) {
                    print('Unbonding from ${result.device.address}...');
                    await FlutterBluetoothSerial.instance
                        .removeDeviceBondWithAddress(result.device.address);
                    print('Unbonding from ${result.device.address} has succed');
                  } else {
                    print('Bonding with ${result.device.address}...');
                    bonded = await FlutterBluetoothSerial.instance
                        .bondDeviceAtAddress(result.device.address);
                    print(
                        'Bonding with ${result.device.address} has ${bonded ? 'succed' : 'failed'}.');
                  }
                  setState(() {
                    results[results.indexOf(result)] = BluetoothDiscoveryResult(
                        device: BluetoothDevice(
                          name: result.device.name ?? '',
                          address: result.device.address,
                          type: result.device.type,
                          bondState: bonded
                              ? BluetoothBondState.bonded
                              : BluetoothBondState.none,
                        ),
                        rssi: result.rssi);
                  });
                } catch (ex) {
                  showDialog(
                    context: context,
                    builder: (BuildContext context) {
                      return AlertDialog(
                        title: const Text('Error occured while bonding'),
                        content: Text("${ex.toString()}"),
                        actions: <Widget>[
                          new FlatButton(
                            child: new Text("Close"),
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                          ),
                        ],
                      );
                    },
                  );
                }
               },
            );
          },
        ),
      );
    }
  }
}
