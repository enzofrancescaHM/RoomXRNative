import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { Button, StyleSheet, Text, Image, View } from 'react-native';
import { useCameraDevices } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, useFrameProcessor } from 'vision-camera-code-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable } from 'react-native';
// local project imports
import Store, {Context} from '../global/Store';

export function ScannerPage({navigation}){

  const devices = useCameraDevices();
  const device = devices.back;
  const [state, dispatch] = useContext(Context);

  const imageConnect = require("../images/back.png");

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });


  const setUserValue = async (value) => {
    try {
      console.log("writing: " + value);

      await AsyncStorage.setItem('user', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("user write error!");
    }
  
    console.log('user write done.');
  }

  const setRootValue = async (value) => {
    try {
      await AsyncStorage.setItem('root', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("root write error!");
    }
  
    console.log('root write done.');
  }
  const setRoomValue = async (value) => {
    try {
      await AsyncStorage.setItem('room', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("room write error!");
    }
  
    console.log('room write done.');
  }

  
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    
    console.log(barcodes);
    barcodes.map((barcode, idx) => (
      getBarcode(barcode.displayValue, idx)
    ));
  }, [barcodes]);

  function onPressFunction(){
    // come back to start page
    navigation.replace('StartPage');    
  }
  /**
   * Evaluate barcode read by the camera in order to
   * extrapolate config info such as room address and 
   * username
   * @param {*} barcodevalue 
   */
  async function getBarcode(barcodevalue, idx){

        console.log("idx: " + idx);
        if(idx == 0)
        {
          // stop reading barcodes
          setIsActive(false);
          // Sanity check, assure that this is a valid qrcode
          if(barcodevalue.includes('user') && barcodevalue.includes('room') && barcodevalue.includes('base'))
          {          
            console.log("barcode correct: " + barcodevalue );
            // build json object
            var dec = (JSON.parse(barcodevalue)); 

            console.log("user: " + dec.user + " base: " + dec.base + " room: " + dec.room );
            // store it in the persistent app memory
            await setUserValue(JSON.stringify(dec.user));
            await setRoomValue(JSON.stringify(dec.room));
            await setRootValue(JSON.stringify(dec.base));

            // store in the volatile app memory
            await dispatch({ type: 'SET_PEER_NAME', payload:dec.user});          
            await dispatch({ type: 'SET_ROOT', payload:dec.base});
            await dispatch({ type: 'SET_ROOM', payload:dec.room});  
            // come back to start page
            navigation.replace('StartPage');        
          }
          else{
            console.log("barcode incorrect!");
          }
      }
  }  

  const styles = StyleSheet.create({
    mainContainer:{
      flex:1,
          flexDirection: "column",
          height: "100%",
          padding: 2,
          backgroundColor: '#000000',
          //alignContent:"center", 
          //justifyContent: 'center',
          alignItems: 'center'
    },
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
          bottom:state.real_height / 15,
          left:10,
          flexDirection: "row",
          padding: 2,
          backgroundColor: '#00000000',
          zIndex:2, 
      },
      buttonsContainer:{
        flex:1,
        flexDirection:"row",
        height:50,
      },
      buttonFacebookStyle: {
          position: "absolute",
          //bottom:window.height/2 - 40,
          //left: "auto",
          //right:"auto",
          
          backgroundColor: '#ffffff33',
          borderWidth: 0.5,
          borderColor: '#fff',
          width:state.real_width / 2.5,
          height: state.real_height / 5,
          borderRadius: 5,
          margin: 5,
          flex:1,
          flexDirection:"row",
        },
        buttonImageIconStyle: {
          //padding: 20,
          //margin: 5,
          height: state.real_height / 5,
          width: state.real_height / 5,
          resizeMode: 'stretch',
        },
        buttonTextStyle: {
          color: '#fff',
          fontSize: state.real_height / 10,
          //marginTop: -32,
          marginLeft: "auto",
          marginRight:"auto",
          marginTop:"auto",
          marginBottom: "auto",
          textAlign:"center",
        },
        buttonIconSeparatorStyle: {
          backgroundColor: '#fff',
          //marginLeft:36,
          //marginTop:-35,
          width: 1,
          height: state.real_height / 5,
        },
        labelUsbTextStyle: {
          fontSize:state.real_height / 16,
          color: '#fff',
          marginTop: 7,
          marginLeft: 20,
          marginRight:5,
        },
        labelTitle:{
          color: '#fff',
          marginTop: 0,
          fontSize:state.real_height / 7,
          textAlign:"center",
        },
        labelUser:{
          color: '#aaa',
          marginTop: 0,
          fontSize:state.real_height / 14,
          textAlign:"center",
          marginBottom:state.real_height /10,
        },
        labelVersion: {
          fontSize:state.real_height / 16,
          color: '#aaa',
          marginTop: 7,
          marginLeft: 20,
          marginRight:5,
        },

     
    });

  return (
    device != null &&
     (
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        {
          <Pressable onPress={onPressFunction} style={styles.buttonFacebookStyle}>
            <View style={styles.buttonsContainer}>
            <Image
               source={imageConnect}
                style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            <Text style={styles.buttonTextStyle}>Back</Text>
            </View>
          </Pressable>
        /*  {barcodes.map((barcode, idx) => (
                getBarcode(barcode.displayValue)
           <Text key={idx} style={styles.barcodeTextURL}>
            {barcode.displayValue}
          </Text>
 
        ))} */}
       </>
    )
  );
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});