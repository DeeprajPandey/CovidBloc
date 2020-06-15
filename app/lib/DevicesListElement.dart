import 'package:flutter/material.dart';


class DevicesListElement extends StatelessWidget{
  final String deviceName;
  
  const DevicesListElement({
    @required this.deviceName,
  }):assert(deviceName!=null);

  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: Container(
        height:50.0,
        child:Padding(
            padding: EdgeInsets.all(6.0),
            child:Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children:[
                Padding(
                padding: EdgeInsets.all(8.0),
                child: Icon(
                    Icons.stay_current_portrait,
                    size:18.0,
                  ),
              ),
                Center(
                child:Text(
                  deviceName,
                  style:TextStyle(
                    fontSize:24.0,
                    color:Colors.black,
                    ),
                ),
              ),
              ],
          ),
          ),
        ),
    );
        
        
  }
}
