import 'dart:async';
import 'package:contact_tracing/config/Styles.dart';
import 'package:contact_tracing/storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:progress_indicators/progress_indicators.dart';
import 'package:contact_tracing/widgets/widgets.dart';
//import 'package:contact_tracing/screens/screens.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:flutter/services.dart';
import '../keyGen.dart';

class DiscoveryPage extends StatefulWidget {
  /// If true, discovery starts on page start, otherwise user must press action button.
  final bool start;
  final ExposureNotification exp;

  const DiscoveryPage({
    this.start = true,
    @required this.exp,
  }) : assert(exp != null);

  @override
  DiscoveryPageState createState() => new DiscoveryPageState(exp: exp);
}

class DiscoveryPageState extends State<DiscoveryPage> {
  final ExposureNotification exp;
  static const platform = const MethodChannel('samples.flutter.dev/bluetooth');
  StreamSubscription<BluetoothDiscoveryResult> _streamSubscription;
  List<BluetoothDiscoveryResult> results = List<BluetoothDiscoveryResult>();
  bool isDiscovering;
  final Storage s = new Storage();
  // String _statusMsg = 'Waiting for response';

  DiscoveryPageState({
    @required this.exp,
  }) : assert(exp != null);

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

  Future<void> _showKeyinDialogue(
      BuildContext context, String keyReceived, String msg) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // user must tap button!
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Exchanged Key'),
          content: SingleChildScrollView(
            child: ListBody(
              children: <Widget>[
                Text(keyReceived),
                Text(msg),
              ],
            ),
          ),
          actions: <Widget>[
            FlatButton(
              child: Text('OK'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  Future<void> connectToDevice(
      BuildContext context, BluetoothDevice dev) async {
    String exchangedKey;
    //not needed now (both devices connect as client to get the other devices's rpi)

    try {
      exchangedKey = await platform
          .invokeMethod('customConnectToDevice', {"address": dev.address});
    } on PlatformException catch (e) {
      print("Failed to establish connection: '${e.message}'");
      exchangedKey = "No key received";
    }
    print("From dart: : $exchangedKey\n");
    if (exchangedKey == null ||
        exchangedKey == 'Hi from Bluetooth Demo Server') {
      if (exchangedKey == null)
        _showKeyinDialogue(
            context, 'Key not received', 'Try again in some time');
      else
        _showKeyinDialogue(context, 'Key not received',
            'Server is running but unable to get rpi');
    } else {
      final data = await s.writeRPI(exchangedKey);
      print(data);
      if (data != null)
        _showKeyinDialogue(
            context, exchangedKey, 'Stored this key in your local storage');
      else if (data == null)
        _showKeyinDialogue(
            context, exchangedKey, 'Key already in local storage');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isDiscovering) {
      return Scaffold(
        body: Container(
          color: Styles.primaryColor,
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
          backgroundColor: Styles.primaryColor,
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
              //rssi: result.rssi,
              onTap: () {
                connectToDevice(context, result.device);
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
