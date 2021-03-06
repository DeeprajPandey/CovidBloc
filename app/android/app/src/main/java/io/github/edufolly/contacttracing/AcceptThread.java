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
import android.bluetooth.BluetoothServerSocket;
import android.content.DialogInterface;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import androidx.annotation.NonNull;

public class AcceptThread extends Thread {
        // The local server socket
        private final BluetoothServerSocket mmServerSocket;
        BluetoothAdapter mBluetoothAdapter = null;
        private volatile Boolean running;
        private volatile String rpi; 

        public AcceptThread() {
            this.running = true;
            mBluetoothAdapter = BluetoothAdapter.getDefaultAdapter();
            BluetoothServerSocket tmp = null;
            // Create a new listening server socket
            try {
                tmp = mBluetoothAdapter.listenUsingRfcommWithServiceRecord(MainActivity.NAME, MainActivity.MY_UUID);
            } catch (IOException e) {
                System.out.println("Failed to start server\n");
            }
            mmServerSocket = tmp;
        }

        public void run() {
            System.out.println("RPI is "+ this.rpi);
            while(running) {
                System.out.println("waiting on accept");
                BluetoothSocket socket = null;
                try {
                    // This is a blocking call and will only return on a
                    // successful connection or an exception
                    socket = mmServerSocket.accept();
                } catch (IOException e) {
                    System.out.println("Failed to accept\n");
                    this.running=false;
                }

                // If a connection was accepted
                if (socket != null) {
                    System.out.println("Connection made\n");
                    System.out.println("Remote device address: " + socket.getRemoteDevice().getAddress() + "\n");
                    //Note this is copied from the TCPdemo code.
                    try {
                        System.out.println("Attempting to receive a message ...\n");
                        BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                        String str = in.readLine();
                        System.out.println("received a message:\n" + str + "\n");

                        PrintWriter out = new PrintWriter(new BufferedWriter(new OutputStreamWriter(socket.getOutputStream())), true);
                        System.out.println("Attempting to send message ...\n");
                        if(this.rpi!=null){
                            out.println(this.rpi);
                            out.flush();
                        }
                        else {
                            out.println("Hi from Bluetooth Demo Server");
                            out.flush();
                        }
                        System.out.println("Message sent...\n");

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
                    this.running=false;
                    
                }
                
                // if (Thread.interrupted()) {
                //     return;
                // }   
            }
            // System.out.println("Server ending \n");
        }

        public void setRPI(String rollingProximityIdentifier)
        {
            this.rpi = rollingProximityIdentifier;
            System.out.println("From setRPI " + rpi);
        }

        public void setRunning()
        {
            this.running=true;
        }

        public void cancel() {
            this.running = false;
            try {
                mmServerSocket.close();
            } catch (IOException e) {
                System.out.println( "close() of connect socket failed: "+e.getMessage() +"\n");
            }
            
        }
    }
