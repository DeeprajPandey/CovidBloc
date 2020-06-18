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

import androidx.annotation.NonNull;
//import io.flutter.embedding.android.FlutterActivity;
import io.flutter.embedding.engine.FlutterEngine;
import io.flutter.plugin.common.MethodChannel;

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
  public static final UUID MY_UUID = UUID.fromString("fa87c0d0-afac-11de-8a39-0800200c9a66");
  private static final String CHANNEL = "samples.flutter.dev/bluetooth";
  BluetoothAdapter bluetoothAdapter = null;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    GeneratedPluginRegistrant.registerWith(this);

    new MethodChannel(getFlutterView(), CHANNEL).setMethodCallHandler(
        new MethodCallHandler() {

          @Override
          public void onMethodCall(MethodCall call, Result result) {
            bluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

            if (call.method.equals("customConnectToDevice")) {
              if (!call.hasArgument("address")) {
                result.error("invalid_argument", "argument 'address' not found", null);
              }

              String address;
              try {
                address = call.argument("address");
                if (!BluetoothAdapter.checkBluetoothAddress(address)) {
                  throw new ClassCastException();
                }
              }
              catch (ClassCastException ex) {
                result.error("invalid_argument", "'address' argument is required to be string containing remote MAC address", null);
              }

              String addr = call.argument("address");
              BluetoothDevice device = bluetoothAdapter.getRemoteDevice(addr);

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




