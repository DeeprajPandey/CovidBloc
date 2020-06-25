import 'package:flutter/material.dart';

import './MainPage.dart';
//final navigatorKey = GlobalKey<NavigatorState>();
void main() => runApp(new ExampleApplication());

class ExampleApplication extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: MainPage());
      
  }
}
