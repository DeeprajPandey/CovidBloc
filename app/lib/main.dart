//import 'package:contact_tracing/storage.dart';
import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart'; // by doing this all the screens exported will get imported in one go
import 'package:provider/provider.dart';
import './keyGen.dart';
// import 'package:workmanager/workmanager.dart';
// import 'package:dio/dio.dart';
// import 'dart:collection';

// const simplePeriodicTask = "checkExposure";
// //var e = new ExposureNotification();
// BaseOptions options = new BaseOptions(
//   baseUrl: "http://192.168.0.152:6000/",
// );

// Dio dio=new Dio(options);
// Storage s = new Storage();

//  void callbackDispatcher() {
//   Workmanager.executeTask((task, inputData) async {
//     switch (task) {
//       case simplePeriodicTask:
//         print("$simplePeriodicTask was executed");
        
//         //e.scheduler().then((value) => print("Done"));
//         Response response;
//           try {
//             response  = await dio.post("/keys",
//             data: {
//                 "currentIval": (e.iVal).toString(),
//                 "firstCall": false,
//             });
//           } catch (e) {
//             print(e.message);
//           }
        
//         print(response.data);
//         HashMap contactRPI = await s.readRPIs();
//         if (contactRPI==null) {
//             HashMap contactRPIS =HashMap();
//             contactRPIS.putIfAbsent('22f0a9c6c6de2b62706c42c8b54e5e2a', () => 1);
//             e.checkExposure(response.data,contactRPIS);
//           }
//         //e.checkExposure(response.data,contactRPI);
        
//         break;
//     }

//     return Future.value(true);
    
//   });
// }

void main() {
  
  // WidgetsFlutterBinding.ensureInitialized();
  //  print('Initialising Work Manager');
  //   Workmanager.initialize(
  //     callbackDispatcher(), 
  //     isInDebugMode: true,
  //   );
  // print('Calling Work Manager');   
  //   Workmanager.registerPeriodicTask(
  //     "1",
  //     "checkExposure", 
  //     initialDelay: Duration(seconds: 10),
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
