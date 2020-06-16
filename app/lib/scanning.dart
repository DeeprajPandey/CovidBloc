import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:app/bluetooth_state.dart';
import 'package:app/control_pannel.dart';
import 'package:provider/provider.dart';
import 'package:progress_indicators/progress_indicators.dart';

/// Simple page stating that we are scanning for devices.
class ScanningPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
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
    return StreamBuilder(
          stream: Provider.of<Bluetooth>(context).scanForDevices(),
          builder: (context, snapshot) {
          if (snapshot.hasData)
            return Scaffold(
              appBar: appBar, 
              body: Container(
              color:Colors.grey[100],
              child: AvailableDevices(snapshot.data),
            )
          );
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
                      'Scanning for bluetooth devices',
                      style:TextStyle(
                        fontSize:18.0,
                        color:Colors.white,
                      )),
                    FadingText('...'),
                  ],
                ),
              ],
            ),
          )
          );
        });
  }
}

class FailedToConnect extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        Text('Unable to connect to the peripheral Bluetooth device.'),
        RaisedButton.icon(
          label: Text('Try again'),
          icon: Icon(Icons.refresh),
          onPressed: () => null,
        ),
        RaisedButton(
            child: Text('Look for another device.'),
            onPressed: () =>
                Provider.of<Bluetooth>(context).setMode(BleAppState.searching))
      ],
    );
  }
}

class ConnectedSuccessfully extends StatelessWidget{
  //function to exchange data

  Widget build(BuildContext context){
    return Scaffold(
      body:Text('Connected'),
    );
    
  }
}
