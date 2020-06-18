import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_bluetooth_serial/flutter_bluetooth_serial.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import './BluetoothDeviceListEntry.dart';
import 'package:progress_indicators/progress_indicators.dart';
import 'package:flutter/services.dart';

class SelectBondedDevicePage extends StatefulWidget {
  /// If true, on page start there is performed discovery upon the bonded devices.
  /// Then, if they are not avaliable, they would be disabled from the selection.
  final bool checkAvailability;

  const SelectBondedDevicePage({this.checkAvailability = true});

  @override
  _SelectBondedDevicePage createState() => new _SelectBondedDevicePage();
}

enum _DeviceAvailability {
  no,
  maybe,
  yes,
}

class _DeviceWithAvailability extends BluetoothDevice {
  BluetoothDevice device;
  _DeviceAvailability availability;
  int rssi;

  _DeviceWithAvailability(this.device, this.availability, [this.rssi]);
}

class _SelectBondedDevicePage extends State<SelectBondedDevicePage> {
  List<_DeviceWithAvailability> devices = List<_DeviceWithAvailability>();
  static const platform = const MethodChannel('samples.flutter.dev/bluetooth');
  // Availability
  StreamSubscription<BluetoothDiscoveryResult> _discoveryStreamSubscription;
  bool _isDiscovering;

  _SelectBondedDevicePage();

  @override
  void initState() {
    super.initState();

    _isDiscovering = widget.checkAvailability;

    if (_isDiscovering) {
      _startDiscovery();
    }

    // Setup a list of the bonded devices
    FlutterBluetoothSerial.instance
        .getBondedDevices()
        .then((List<BluetoothDevice> bondedDevices) {
      setState(() {
        devices = bondedDevices
            .map(
              (device) => _DeviceWithAvailability(
                device,
                widget.checkAvailability
                    ? _DeviceAvailability.maybe
                    : _DeviceAvailability.yes,
              ),
            )
            .toList();
      });
    });
  }

  void _restartDiscovery() {
    setState(() {
      _isDiscovering = true;
    });

    _startDiscovery();
  }

  void _startDiscovery() {
    _discoveryStreamSubscription =
        FlutterBluetoothSerial.instance.startDiscovery().listen((r) {
      setState(() {
        Iterator i = devices.iterator;
        while (i.moveNext()) {
          var _device = i.current;
          if (_device.device == r.device) {
            _device.availability = _DeviceAvailability.yes;
            _device.rssi = r.rssi;
          }
        }
      });
    });

    _discoveryStreamSubscription.onDone(() {
      setState(() {
        _isDiscovering = false;
      });
    });
  }

  @override
  void dispose() {
    // Avoid memory leak (`setState` after dispose) and cancel discovery
    _discoveryStreamSubscription?.cancel();

    super.dispose();
  }

  Future<void> _connectToDevice(BluetoothDevice dev) async {
    String connStatus;
    try {
      connStatus =
          await platform.invokeMethod('customConnectToDevice', {"address": dev.address});
      // print("Successful to establish connection");
    } on PlatformException catch (e) {
      print("Failed to establish connection: '${e.message}'");
      connStatus = "Connection failed";
    }
    print("Connection status to ${dev.address}: $connStatus\n");
  }

  @override
  Widget build(BuildContext context) {
    List<BluetoothDeviceListEntry> list = devices
        .map((_device) => BluetoothDeviceListEntry(
              device: _device.device,
              rssi: _device.rssi,
              enabled: _device.availability == _DeviceAvailability.yes,
              onTap: () {
                _connectToDevice(_device.device);
                //Navigator.of(context).pop(_device.device);
              },
            ))
        .toList();

    if(_isDiscovering){
    return Scaffold(
      body: Container(
      color:Colors.blue,
      child:Column(
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
                  'Finding all paired bluetooth devices',
                  style:TextStyle(
                  fontSize:18.0,
                  color:Colors.white,
                  )
                ),
            FadingText('...'),
            ],
        ),
      ],
    ),
    )
    );
    }

    else{
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
      body: ListView(children:list)
      );
    }
  }
}
