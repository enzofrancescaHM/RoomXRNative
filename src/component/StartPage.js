import React, { useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, Button,Image, Text, TouchableOpacity, View, StatusBar, Alert, Switch } from "react-native";
import { Skia,useImage, } from "@shopify/react-native-skia";
import { Context } from '../global/Store';
import usb from 'react-native-usb';

import Orientation from 'react-native-orientation-locker';
import { useWindowDimensions } from "react-native";
import {
  runSpring,
  mix,
  Blur,
  Canvas,
  Circle,
  Fill,
  Group,
  LinearGradient,
  rect,
  useFont,
  vec,
  useTouchHandler,
  useValue,
  fitRects,
  rect2rect,
  useComputedValue,
  useLoop,
} from "@shopify/react-native-skia";

import AsyncStorage from '@react-native-async-storage/async-storage';

import { Title } from "./neumorph/Title";
import { Control } from "./neumorph/Control";
import { Mode } from "./neumorph/Mode";
import { Snow } from "./neumorph/icons/Snow";
//import { Button } from "./Button";

const width = 400;
const height = 200;
const src = rect(0, 0, width, height);

export function StartPage({navigation}){

    const [state, dispatch] = useContext(Context);

    const window = useWindowDimensions();
    const dst = rect(0, 0, window.width, window.height);
    const rects = fitRects("cover", src, dst);
    const transform = rect2rect(rects.src, rects.dst);
    const translateY = useValue(0);
    const offsetY = useValue(0);
    const t = useLoop({ duration: 3000 });
    const x = useComputedValue(() => mix(t.current, 0, 180), [t]);
    const progress = useComputedValue(() => x.current / 192, [x]);
    const font = useFont(require("../fonts/Comfortaa-Bold.ttf"), 17);

    const [usbIsEnabled, setUsbIsEnabled] = useState(false);
    const imageConnect = require("../images/connect.png");
    if (!imageConnect) {
      //return null;
    }

    const getData = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@net_Config')
        return jsonValue != null ? JSON.parse(jsonValue) : null;
      } catch(e) {
        // error reading value
        console.log("error reading value!");
      }
    }

    const getUserValue = async () => {
      try {
        var myuser = await AsyncStorage.getItem('user');
        console.log("fresh user: " + myuser);
        dispatch({ type: 'SET_PEER_NAME', payload:myuser});          
        return myuser;
      } catch(e) {
        // read error
        console.log("user read error!")
      }
    
      console.log('user Done.')
    }

    const getRoomValue = async () => {
      try {
        var myRoom = await AsyncStorage.getItem('room');
        console.log("fresh room: " + myRoom);
        dispatch({ type: 'SET_ROOM', payload:myRoom});
      } catch(e) {
        // read error
        console.log("room read error!")
      }
    
      console.log('room Done.')
    }
    const getRootValue = async () => {
      try {
        var myRoot = await AsyncStorage.getItem('root');
        console.log("fresh root: " + myRoot);
        dispatch({ type: 'SET_ROOT', payload:myRoot});
      } catch(e) {
        // read error
        console.log("root read error!")
      }
    
      console.log('root Done.')
    }


    const onTouch = useTouchHandler({
        onStart: (pt) => {
          offsetY.current = translateY.current - pt.y;
        },
        onActive: (pt) => {
          translateY.current = offsetY.current + pt.y;
        },
        onEnd: () => {
          runSpring(translateY, 0);
        },
      });
    
    function connectgo(){
        // check if all the needed parameters are set
        if( state.root_address == "empty" ||
            state.room_id == "empty" ||
            state.peer_name == "empty"){
              console.log("uh-oh, something missing!");
              Alert.alert(
                "Warning",
                "App not properly configured, please read the QRCODE provided",
                [
                  { text: "OK", onPress: () => console.log("OK Pressed") }
                ]
              );

        }
        else{
          navigation.replace('MainPage');
        }
        
    }

    function scannergo(){
      navigation.replace('ScannerPage');
    }

    function toggleUsb(){
        setUsbIsEnabled(previousState => !previousState);        
        dispatch({ type: 'SET_USBCAMERA', payload:usbIsEnabled});
    }


    useEffect(function componentDidMount() {
        console.log("%c StartPage componetDidMount", "color:green;");
         // read config from persistent memory
         //var dec = getData();
        const user = getUserValue();
        const room = getRoomValue();
        const root = getRootValue();

        StatusBar.setHidden(true, 'none');
        Orientation.lockToLandscapeLeft();

        // do this at the start of the app
        requireUSBPermissions();

       
        /*console.log("user:" + JSON.stringify(user));
        if (user != null && room != null && root != null &&
            typeof user !== 'undefined' &&
            typeof root !== 'undefined' &&
            typeof room !== 'undefined')
        {
          // store in the volatile app memory
          dispatch({ type: 'SET_PEER_NAME', payload:user});          
          dispatch({ type: 'SET_ROOT', payload:root});
          dispatch({ type: 'SET_ROOM', payload:room});  
        }
        else{
          dispatch({ type: 'SET_PEER_NAME', payload:"empty"});          
          dispatch({ type: 'SET_ROOT', payload:"empty"});
          dispatch({ type: 'SET_ROOM', payload:"empty"});  
        }*/


        return function componentWillUnmount() {
            //console.log("%c MainPage componetWillUnmount", "color:red")
        }
    }, [])

    async function requireUSBPermissions(){

        // Manage USB Permission on any device
        usb.getUsbDevices(async mydevices => {
            console.log("mydevices: " + mydevices);
            var empObj = JSON.parse(mydevices);
            for (const item of empObj.objects) { // we use a for instead of a for each because the latter does not support await
                console.log("myvid: " + item.vid + " mypid: " + item.pid);
                await usb.connect(item.vid, item.pid)
                .then((data) => console.log("data: " + data))
                .catch((error) => console.error("error: " + error));
              }
        });  

    }

    const styles = StyleSheet.create({
        headerContainer: {
            height:40,
            position: "absolute",
            top:0,
            left:0,
            flexDirection: "row",
            padding: 0,
            backgroundColor: '#00FF0000',
            zIndex:2, 
        },
        bottomContainer: {
            height:40,
            position: "absolute",
            bottom:10,
            left:10,
            flexDirection: "row",
            padding: 2,
            backgroundColor: '#00FF0000',
            zIndex:2, 
        },
        buttonFacebookStyle: {
            //flexDirection: 'row',
            position: "absolute",
            bottom:10,
            left: window.width - 220,
            right:"auto",
            //alignItems: 'center',
            backgroundColor: '#485a96',
            borderWidth: 0.5,
            borderColor: '#fff',
            width:190,
            height: 40,
            borderRadius: 5,
            margin: -5,
          },
          buttonImageIconStyle: {
            padding: 10,
            margin: 5,
            height: 25,
            width: 25,
            resizeMode: 'stretch',
          },
          buttonTextStyle: {
            color: '#fff',
            marginTop: -32,
            marginLeft: 42,
          },
          buttonIconSeparatorStyle: {
            backgroundColor: '#fff',
            marginLeft:36,
            marginTop:-35,
            width: 1,
            height: 40,
          },
          labelUsbTextStyle: {
            color: '#fff',
            marginTop: 7,
            marginLeft: 20,
            marginRight:5,
          },
       
      });
    
    return (
        <>
        <Canvas style={{ flex: 1 }} mode="continuous" onTouch={onTouch}>
            <Group transform={transform}>
                <Group>
                <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, height)}
                    colors={["#2A2D32", "#212326", "#131313"]}
                />
                <Fill />
                </Group>
                <Group>
                <Blur blur={30} />
                <Circle
                    color="#56CCF2"
                    opacity={0.2}
                    cx={window.width}
                    cy={window.height}
                    r={150}
                />
                </Group>
                 <Title title="RoomXR PRO" user={state.peer_name}/>
                 {/* <Button x={50} y={100} width={50} height={50} pressed={0}>
                 </Button>   */} 
                {/*<ProgressBar progress={progress} />*/}
               {/*  <Control
                x={0}
                y={100}
                label="Ac"
                active={true}
                progress={progress}
                //font={font}
                >
                <Snow />
                </Control> 
                <Mode translateY={translateY} /> */}
            </Group>
        </Canvas>
        <View style={styles.bottomContainer}>
        <Button 
            title="Scanner"
            enabled
            onPress={scannergo}
        />
        {/*
        <Button 
            title="Test Chat"
            enabled
            onPress={testChat}
        /> 
        <Button 
            title="Room"
            enabled
            onPress={}
        />*/}
        <Text style={styles.labelUsbTextStyle}>
           {"Version: " + state.app_ver}
        </Text>
        <Text style={styles.labelUsbTextStyle}>
          USB Glasses
        </Text>
         <Switch
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={usbIsEnabled ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleUsb}
            value={usbIsEnabled}
        />
        <TouchableOpacity
            style={styles.buttonFacebookStyle}
            activeOpacity={0.5}
            onPress={connectgo}>
            <Image
               source={imageConnect}
                style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            <Text style={styles.buttonTextStyle}>Connect to Platform</Text>
        </TouchableOpacity>                
    </View>
    </>
    )

}



