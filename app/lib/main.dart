import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart'; // by doing this all the screens exported will get imported in one go
import 'package:provider/provider.dart';
import './keyGen.dart';
//import 'package:android_alarm_manager/android_alarm_manager.dart';

// final ExposureNotification e = new ExposureNotification();
// Future<void>callback() async {
//     print('Alarm fired!');
//     await e.scheduler();
//     // Get the previous cached count and increment it.

//   }

void main() {
  //WidgetsFlutterBinding.ensureInitialized();
  // print('Initialising alarm manager');
  // AndroidAlarmManager.initialize();
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.

  @override
  Widget build(BuildContext context) {
    var exposure = new ExposureNotification();
    return ChangeNotifierProvider<ExposureNotification>(
        create: (_) => exposure,
        child: MaterialApp(
          title: 'CovidBloc User Application',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            primarySwatch: Colors.blue,
            scaffoldBackgroundColor: Colors.white, //bg color white
            visualDensity: VisualDensity.adaptivePlatformDensity,
          ),
          home: BottomNavScreen(exp: exposure),
        ));
  }
}
