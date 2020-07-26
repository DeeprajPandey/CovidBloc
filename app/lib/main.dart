import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart'; // by doing this all the screens exported will get imported in one go
import 'package:provider/provider.dart';
import './keyGen.dart';
// import 'package:workmanager/workmanager.dart';
// import 'package:dio/dio.dart';
// import 'dart:collection';
// import 'package:contact_tracing/storage.dart';

// const simplePeriodicTask = "checkExposure";
// ExposureNotification e;
// BaseOptions options = new BaseOptions(
//   baseUrl: "http://192.168.0.152:6000/",
// );

// Dio dio=new Dio(options);
// Storage s = new Storage();

// void callbackDispatcher() {
//   Workmanager.executeTask((task, inputData) async {
//   switch (task) {
//     case simplePeriodicTask:
//       print("$simplePeriodicTask was executed");
//       Response response;
//         try {
//           response  = await dio.post("/keys",
//           data: {
//               "currentIval": (e.iVal).toString(),
//               "firstCall": false,
//           });
//         } catch (e) {
//           print(e.message);
//         }
      
      
//       HashMap contactRPI = await s.readRPIs();
//       if (contactRPI!=null && response.data!=null) {
//         await e.checkExposure(response.data,contactRPI);
//       }
//       else {
//         e.expDone();
//       }
//       break;
//   }

//   return Future.value(true);
  
// });
// }

void main() {
  // WidgetsFlutterBinding.ensureInitialized();
  //  print('Initialising Work Manager');
  //   Workmanager.initialize(
  //     callbackDispatcher, 
  //     isInDebugMode: true,
  //   );
  // print('Calling Work Manager');   
  //   Workmanager.registerPeriodicTask(
  //     "1",
  //     "checkExposure", 
  //     initialDelay: Duration(seconds: 30),
  //     frequency: Duration(minutes: 15));
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  // This widget is the root of your application.

  @override
  Widget build(BuildContext context) {
  var e = new ExposureNotification();
    return ChangeNotifierProvider<ExposureNotification>(
      create: (_)=> e,
      child: MaterialApp(
      title: 'Flutter Contact Tracing Users Dashboard',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.blue,
        scaffoldBackgroundColor: Colors.white, //bg color white
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: BottomNavScreen(exp:e),
      
    )
    );
  }
}
