import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart'; // by doing this all the screens exported will get imported in one go
import './keyGen.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    var e = new ExposureNotification();
    return MaterialApp(
      title: 'Flutter Contact Tracing Users Dashboard',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white, //bg color white
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: BottomNavScreen(exp:e),
    );
  }
}
