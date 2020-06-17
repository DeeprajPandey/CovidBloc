package io.github.edufolly.flutterbluetoothserialexample;
import android.os.Bundle;
import io.flutter.app.FlutterActivity;
import io.flutter.plugins.GeneratedPluginRegistrant;

import java.util.UUID;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.util.Set;

import io.flutter.plugin.common.MethodChannel.MethodCallHandler;
import io.flutter.plugin.common.MethodChannel;
import io.flutter.plugin.common.MethodCall; 
import io.flutter.plugin.common.MethodChannel.Result; 
import android.app.Activity; 
import android.content.Intent; 

import android.app.AlertDialog;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.DialogInterface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;




public class MainActivity extends FlutterActivity {
  private static final String CHANNEL = "samples.flutter.dev/bluetooth";
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    GeneratedPluginRegistrant.registerWith(this);
    new MethodChannel(getFlutterView(), CHANNEL).setMethodCallHandler(
         new MethodCallHandler() {
           //@Override 
            public void onMethodCall(MethodCall call,Result result) { //
              BluetoothDevice device=call.argument("device");
               if (call.method.equals("connectToDevice")) { 
                  connectToDevice(call,result,device); 
               } else { 
                  result.notImplemented();
                  //System.out.println("Not Implemented");
               }
            }
         }
      ); 
  }

  private void connectToDevice(MethodCall call,Result result,BluetoothDevice device) { //Result result,
    //Activity activity = this;
    if (device != null) {
          new Thread(new ConnectThread(device)).start();
          result.success("Connection Started");
      }
      else{
        result.error("No device found","Error",null);
        //System.out.println("No device found");
      }
  }
}




