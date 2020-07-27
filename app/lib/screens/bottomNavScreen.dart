
import 'package:flutter/material.dart';
import 'package:contact_tracing/screens/screens.dart';
import '../keyGen.dart';


class BottomNavScreen extends StatefulWidget{
  
  final ExposureNotification exp;

  const BottomNavScreen({
    @required this.exp,
  }):assert(exp!=null);

  @override
  BottomNavScreenState createState() => BottomNavScreenState(exp:exp);

}

class BottomNavScreenState extends State<BottomNavScreen>{
  final ExposureNotification exp;

   BottomNavScreenState({
    @required this.exp
  }):assert(exp!=null);
  
  int _currentIndex= 0; //initialise screen index (0 will show homeScreen and so on)

  @override
  Widget build(BuildContext context){
    final List _screens=[
    HomeScreen(e:exp), //home screen
    BluetoothScreen(e:exp) //info screen (bluetooth part)
  ];
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(()=>_currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.grey[50],
        showSelectedLabels: false,
        showUnselectedLabels: false,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.grey,
        elevation: 0.0,
        items: [Icons.home,Icons.bluetooth]
        .asMap()
        .map(
          (key, value) => MapEntry(key, BottomNavigationBarItem(
            title:Text(''),
            icon: Container(
              padding: const EdgeInsets.symmetric(vertical: 6.0, horizontal: 16.0,),
              decoration: BoxDecoration(
              color: _currentIndex == key ? Colors.blue[600] : Colors.transparent, //to show highlighted icon in bottom in blue
              borderRadius: BorderRadius.circular(20.0),
              ),  
              child: Icon(value),
            )
          )
          )
          ).values.toList(),
      ),
    );
  }

}