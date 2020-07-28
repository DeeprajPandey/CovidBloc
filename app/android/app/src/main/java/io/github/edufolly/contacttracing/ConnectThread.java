//package io.github.edufolly.flutterbluetoothserialexample;
package io.github.edufolly.contacttracing;
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

public class ConnectThread extends Thread {
  private BluetoothSocket socket;
  private final BluetoothDevice mmDevice;
  private volatile String exchanged_key; //Volatile keyword is used to modify the value of a variable by different threads
//   BluetoothAdapter mBluetoothAdapter = null;
//   mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();

    // public void mkmsg(String str) {
    //     //handler junk, because thread can't update screen!
    //     Message msg = new Message();
    //     Bundle b = new Bundle();
    //     b.putString("msg", str);
    //     msg.setData(b);
    //     handler.sendMessage(msg);
    // }

  public ConnectThread(BluetoothDevice device) {
    mmDevice = device;
    BluetoothSocket tmp = null;
    
    // Get a BluetoothSocket for a connection with the
    // given BluetoothDevice
    try {
          tmp = device.createRfcommSocketToServiceRecord(MainActivity.MY_UUID);
        } catch (IOException e) {
          System.out.println("Client connection failed: " + e.getMessage() + "\n");
        }
          socket = tmp;
    }
            
    public void run() {
      //System.out.println("Client running\n");
      // Always cancel discovery because it will slow down a connection
      //mBluetoothAdapter.cancelDiscovery();
      // Make a connection to the BluetoothSocket
      try {
            // This is a blocking call and will only return on a
            // successful connection or an exception
            socket.connect();
          } catch (IOException e) {
              System.out.println("Connect failed\n");
              try {
                    socket.close();
                    socket = null;
                  } catch (IOException e2) {
                      System.out.println("unable to close() socket during connection failure: " + e2.getMessage() + "\n");
                      socket = null;
                  }
          // Start the service over to restart listening mode   
          }
          // If a connection was accepted
      if (socket != null) {
        System.out.println("Connection made\n");
        System.out.println("Remote device address: " + socket.getRemoteDevice().getAddress() + "\n");
      //Note this is copied from the TCPdemo code.
        try {
            PrintWriter socket_out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(socket.getOutputStream())), true);
            System.out.println("Attempting to send message ...\n");
            socket_out.println("Hello from Bluetooth Client!");
            socket_out.flush();
            System.out.println("Message sent...\n");        

            System.out.println("Attempting to receive a message ...\n");
            BufferedReader socket_in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            exchanged_key = socket_in.readLine();
            System.out.println("received a message:\n" + exchanged_key + "\n");
            

            System.out.println("We are done, closing connection\n");
            } catch (Exception e) {
                  System.out.println("Error happened sending/receiving\n");

            } finally {
                    try {
                        socket.close();
                    } catch (IOException e) {
                        System.out.println("Unable to close socket" + e.getMessage() + "\n");
                    }
            }
          } else {
              System.out.println("Made connection, but socket is null\n");
          }
          System.out.println("Client ending \n");
      return ;
    }        

    public String getKey(){
      return exchanged_key;
    }

       

    public void cancel() {
      try {
            socket.close();
          } catch (IOException e) {
              System.out.println("close() of connect socket failed: " + e.getMessage() + "\n");
            }
    }
    
}