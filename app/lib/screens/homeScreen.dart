import 'package:contact_tracing/config/Styles.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../keyGen.dart';
import '../storage.dart';
import 'package:badges/badges.dart';
import 'package:provider/provider.dart';
import 'dart:collection';
import 'package:intl/intl.dart'; // for date format

//import 'dart:io';
//import 'package:contact_tracing/widgets/widgets.dart';
//import 'dart:convert';
// import 'package:path_provider/path_provider.dart';
// import 'package:flutter/services.dart';
// import 'package:cryptography/cryptography.dart';



class HomeScreen extends StatefulWidget {
  final ExposureNotification e;
  
  const HomeScreen({
    @required this.e,
  }):assert(e!=null);

  @override
  _HomeScreenState createState() => _HomeScreenState(e:e);
}

class _HomeScreenState extends State<HomeScreen> {
  final ExposureNotification e;

  _HomeScreenState({
    @required this.e,
  }):assert(e!=null);

  final prevention = [
    {'assets/images/distance.png': 'Maintain Social\n Distancing'},
    {'assets/images/wash_hands.png': 'Clean your\nhands often'},
    {'assets/images/mask.png': 'Wear a\nfacemask'},
  
  ];
    
  //new Dio with a BaseOptions instance.
  static BaseOptions options = new BaseOptions(
      baseUrl: "http://192.168.0.152:6400/",
  );
  //print(response.data.toString());

  Dio dio=new Dio(options);
  final Storage s = new Storage();

  
  

  Future<void> _sendKeys(BuildContext context, final approvalID, final medID) async{
    //s.delete(); //to delete file
    List dailyKeys=[];
    int currIval;
    
    try {
      dailyKeys = await s.readKeys();
      print(dailyKeys);
      if(dailyKeys==null) {
        return _validationPopUp(context,'Error',"No daily keys found");
      }

      currIval= e.iVal;
      if(currIval==null) { 
        return _validationPopUp(context,'Error',"Current i value not retrieved");
      }

      Response response = await dio.post("/pushkeys", 
      data: {
        "approvalID": approvalID, 
        "medID": medID,
        "ival": currIval.toString(),
        "dailyKeys": dailyKeys,
      });

      _validationPopUp(context,'Successful',response.data.toString());

    } catch(e) {
      _validationPopUp(context,'Error',e.message);
    }

  }

  Future<List> _showPopUp(BuildContext context) async {
    TextEditingController approvalController = TextEditingController();
    TextEditingController medController = TextEditingController();
    final credentials = [];
    return showDialog(
      context:context,
      barrierDismissible: false, // user must tap button!
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Enter the Credentials'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              TextFormField(
                decoration: InputDecoration(icon: Icon(Icons.perm_identity),labelText: 'Approval ID'),
                controller: approvalController,
                ), 
              TextFormField(
                decoration: InputDecoration(icon: Icon(Icons.local_hospital),labelText: 'Medical ID'),
                controller: medController,
              ),
            ],
          ),
          actions: <Widget>[
            FlatButton(
              child: Text('Submit'),
              onPressed: () {
                credentials.add(approvalController.text.toString());
                credentials.add(medController.text.toString());
                Navigator.of(context).pop(credentials);
              },
            ),
          ],
        );
      },
    );
}

 List<Widget> extractTimestamps(HashMap exposed){
  List timestamps= new List();
  exposed.forEach((k, v) => timestamps.add(DateFormat('dd-MM hh:mm').format(v)));
  return timestamps.map((x){
      return Padding(
        padding: EdgeInsets.all(5.0),
        child: Row(children: <Widget>[
          Icon(Icons.access_time),
          Text(x)
        ]),
      );
    }).toList();
  }

void _showTimestamps(BuildContext context,HashMap exposed) async{
    showDialog(
      context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            titlePadding: EdgeInsets.all(10.0),
            contentPadding: EdgeInsets.all(0.0),
            title: Text("Exposed Timestamps"),
            content: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Divider(
                    height: 1.0,
                    color: Colors.grey,
                  ),

                  Flexible(
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.start,
                        children: extractTimestamps(exposed)
                      ),
                    ),
                  ),

                  Divider(
                    color: Colors.grey,
                    height: 1.0,
                  ),
                  Padding(
                    padding: EdgeInsets.only(left: 10.0, right: 10.0, top: 2.0, bottom: 5.0),
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: FlatButton(
                            color: Styles.primaryColor,
                            textColor: Colors.white,
                            shape: OutlineInputBorder(
                                borderRadius: BorderRadius.only(bottomLeft: Radius.circular(4.0), topLeft: Radius.circular(4.0))),
                            child: Text("OK"),
                            onPressed: () {
                              Navigator.pop(context);
                            },
                          ),
                        ),
                      ],
                    ),
                  )
                ]
            ),
          );
        }
    );
  }

  Future<void> _validationPopUp(BuildContext context,String title,String msg) async{
    return showDialog(
    context:context,
    barrierDismissible: false, // user must tap button!
    builder: (BuildContext context) {
      return AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
              Text(msg,
              textAlign: TextAlign.center,
              ),
            ],
          ),
        actions: <Widget>[
          FlatButton(
            child: Text('OK'),
            onPressed: () {
              Navigator.of(context).pop();
            },
          ),
        ],
      );
    },
  );
}

  bool check=false;

  @override
  Widget build(BuildContext context) {
    // final counter = context.select<ExposureNotification,int>(
    //   (exp) => exp.counter
    // );
    final exposed= Provider.of<ExposureNotification>(context).exposedTimestamps;
    if(exposed.length>0) {
      check=true;
    }
    final screenHeight = MediaQuery.of(context).size.height;
    return Scaffold(
      appBar: AppBar(
      backgroundColor: Styles.primaryColor,
      elevation: 0.0,
      leading: IconButton(
        icon: const Icon(Icons.menu),
        iconSize: 28.0,
        onPressed: () {},
      ),
      actions: <Widget>[
        Badge(
          position: BadgePosition.topRight(top: 0, right: 3),
          showBadge: check,
          badgeContent: Text(
            (exposed.length).toString(),
            ),
          child: IconButton(
            icon: const Icon(Icons.notifications_none),
            iconSize: 28.0,
            onPressed: () {
              if(exposed.length>0) {
              _showTimestamps(context,exposed);
              }
              else {
                _validationPopUp(context, 'You are Safe', 'You havent come across anyone who has tested postive');
              }
            },
          ),
        )
      ],
    ),
      body: CustomScrollView(
        physics: ClampingScrollPhysics(),
        slivers: <Widget>[
          _buildHeader(context,screenHeight),
          _buildPreventionTips(screenHeight),
          _buildStaySafe(screenHeight),
        ],
      ),
    );
  }

  SliverToBoxAdapter _buildHeader(BuildContext context,double screenHeight) {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.all(20.0),
        decoration: BoxDecoration(
          color: Styles.primaryColor,
          borderRadius: BorderRadius.only(
            bottomLeft: Radius.circular(40.0),
            bottomRight: Radius.circular(40.0),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: <Widget>[
                Text(
                  'COVID-19',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 25.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: screenHeight * 0.03),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Are you Infected?',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 22.0,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: screenHeight * 0.01),
                Text(
                  'Please add your keys using the id sent to you by your medical official',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 15.0,
                  ),
                ),
                SizedBox(height: screenHeight * 0.03),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: <Widget>[
                    FlatButton.icon(
                      padding: const EdgeInsets.symmetric(
                        vertical: 10.0,
                        horizontal: 20.0,
                      ),
                      onPressed: () {
                        _showPopUp(context).then((val) {
                          if(val[0]!='' && val[1]!='') {
                            print('Credentials recieved');
                            _sendKeys(context, val[0], val[1]);
                          }
                          else
                            _validationPopUp(context,'Error','Invalid Credentials'); 
                        });
                      },
                      color: Colors.red,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30.0),
                      ),
                      icon: const Icon(
                        Icons.vpn_key,
                        color: Colors.white,
                      ),
                      label: Text(
                        'Upload Keys',
                        style: Styles.buttonTextStyle,
                      ),
                      textColor: Colors.white,
                    ),
                  ],
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  SliverToBoxAdapter _buildPreventionTips(double screenHeight) {
    return SliverToBoxAdapter(
      child: Container(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Prevention Tips',
              style: const TextStyle(
                fontSize: 22.0,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 20.0),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: prevention
                  .map((e) => Column(
                        children: <Widget>[
                          Image.asset(
                            e.keys.first,
                            height: screenHeight * 0.12,
                          ),
                          SizedBox(height: screenHeight * 0.015),
                          Text(
                            e.values.first,
                            style: const TextStyle(
                              fontSize: 10.0,
                              fontWeight: FontWeight.w500,
                            ),
                            textAlign: TextAlign.center,
                          )
                        ],
                      ))
                  .toList(),
            ),
          ],
        ),
      ),
    );
  }

  SliverToBoxAdapter _buildStaySafe(double screenHeight) {
    return SliverToBoxAdapter(
      child: Container(
        margin: const EdgeInsets.symmetric(
          vertical: 10.0,
          horizontal: 20.0,
        ),
        padding: const EdgeInsets.all(10.0),
        height: screenHeight * 0.15,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF22aed1), Color(0xFF0AAB67)],
          ),
          borderRadius: BorderRadius.circular(20.0),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: <Widget>[
            Image.asset('assets/images/own_test.png'),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Text(
                  'Do not Panic!',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18.0,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: screenHeight * 0.01),
                Text(
                  'Keep yourself and your\nloved ones safe.',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12.0,
                  ),
                  maxLines: 2,
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}