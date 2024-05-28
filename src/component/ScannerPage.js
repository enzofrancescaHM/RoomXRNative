import * as React from 'react';
import { useContext, useState } from 'react';
import { StyleSheet, Text, Image, View,TouchableOpacity, BackHandler } from 'react-native';
import { useCameraDevices } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat} from 'vision-camera-code-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local project imports
import Store, { Context } from '../global/Store';

export function ScannerPage({ navigation }) {

  const devices = useCameraDevices();
  const device = devices.back;
  const [state, dispatch] = useContext(Context);

  const imageBack = require("../images/back.png");

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });


  const setUserValue = async (value) => {
    try {
      console.log("writing: " + value);

      await AsyncStorage.setItem('user', value.replace(/\"/g, ''))
    } catch (e) {
      // save error
      console.log("user write error!");
    }

    console.log('user write done.');
  }

  const setRootValue = async (value) => {
    try {
      await AsyncStorage.setItem('root', value.replace(/\"/g, ''))
    } catch (e) {
      // save error
      console.log("root write error!");
    }

    console.log('root write done.');
  }
  const setRoomValue = async (value) => {
    try {
      await AsyncStorage.setItem('room', value.replace(/\"/g, ''))
    } catch (e) {
      // save error
      console.log("room write error!");
    }

    console.log('room write done.');
  }

  const setSplashValue = async (value) => {
    try {
      await AsyncStorage.setItem('splash', value.replace(/\"/g, ''))
    } catch (e) {
      // save error
      console.log("splash write error!");
    }

    console.log('splash write done.');
  }


  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {

    console.log(barcodes);
    barcodes.map((barcode, idx) => (
      getBarcode(barcode.displayValue, idx)
    ));
  }, [barcodes]);


  React.useEffect(() => {
    const backAction = () => {
        console.log("back!");
          // come back to start page
    dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' });
    navigation.replace('StartPage');
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  function onPressFunction() {
    // come back to start page
    dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' });
    navigation.replace('StartPage');
  }
  /**
   * Evaluate barcode read by the camera in order to
   * extrapolate config info such as room address and 
   * username
   * @param {*} barcodevalue 
   */
  async function getBarcode(barcodevalue, idx) {

    console.log("idx: " + idx);
    if (idx == 0) {
      // stop reading barcodes
      setIsActive(false);
      // Sanity check, assure that this is a valid qrcode
      if (barcodevalue.includes('user') && barcodevalue.includes('room') && barcodevalue.includes('base')) {
        console.log("barcode correct: " + barcodevalue);
        // build json object
        var dec = (JSON.parse(barcodevalue));

        console.log("user: " + dec.user + " base: " + dec.base + " room: " + dec.room);
        // store it in the persistent app memory
        await setUserValue(JSON.stringify(dec.user));
        await setRoomValue(JSON.stringify(dec.room));
        await setRootValue(JSON.stringify(dec.base));
        
        // this is new and no all versions has it...
        if('splash' in dec)
          await setSplashValue(JSON.stringify(dec.splash));

        // store in the volatile app memory
        await dispatch({ type: 'SET_PEER_NAME', payload: dec.user });
        await dispatch({ type: 'SET_ROOT', payload: dec.base });
        await dispatch({ type: 'SET_ROOM', payload: dec.room });

        // this is new and no all versions has it...
        if('splash' in dec)
          await dispatch({ type: 'SET_SPLASH_MESSAGE', payload: dec.splash });
        else
          await dispatch({ type: 'SET_SPLASH_MESSAGE', payload: "Holomask - RoomXR" });
          
        // come back to start page
        dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' });
        navigation.replace('StartPage');
      }
      else {
        console.log("barcode incorrect!");
      }
    }
  }

  const styles = StyleSheet.create({
    mainContainer: {
      flex: 1,
      flexDirection: "column",
      height: "100%",
      padding: 2,
      backgroundColor: '#000000',
      alignItems: 'center'
    },
    buttonFacebookStyle: {
      position: "absolute",
      backgroundColor: '#ffffff33',
      borderWidth: 0.5,
      borderColor: '#fff',
      width: state.real_width / 2.5,
      height: state.real_height / 5,
      borderRadius: 5,
      margin: 5,
      flex: 1,
      flexDirection: "row",
    },
    buttonImageIconStyle: {
      height: state.real_height / 5,
      width: state.real_height / 5,
      resizeMode: 'stretch',
    },
    buttonTextStyle: {
      color: '#fff',
      fontSize: state.real_height / 10,
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "auto",
      marginBottom: "auto",
      textAlign: "center",
    },
    buttonIconSeparatorStyle: {
      backgroundColor: '#fff',
      width: 1,
      height: state.real_height / 5,
    },
    buttonContainerTop:{
      position: "absolute",
      top:20,
      left:20,
      width:state.real_width,
      height: state.real_height / 5,
      backgroundColor:'f00',
      zIndex: 100,
      zOrder:100,
  },
  labelVersion:{
    color:"#fff",
    fontSize:15,
    fontWeight:"bold"
  },
  textContainer:{
    backgroundColor:'#00000066'
  }


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
      
          
      {( (state.device_name == "blade2") )  && <View style={styles.textContainer}>
                <Text style={styles.labelVersion}>Position the QRCode in front of the camera, once read the app will come back. Tap with two fingers on the pad to go back to main page without reading the QRCode</Text>
      </View>}

      {( (state.device_name=="m4000") )  && <View style={styles.textContainer}>
                <Text style={styles.labelVersion}>Position the QRCode in front of the camera, once read the app will come back. Tap with two fingers on the pad or long press any button to go back</Text>
      </View>}
          
          
      {( (state.device_name != "blade2") && (state.device_name != "m4000"))  &&<View style={styles.buttonContainerTop}>
                <TouchableOpacity
                    style={styles.buttonScannerStyle}
                    activeOpacity={0.9}
                    onPress={onPressFunction}>
                    <Image
                    source={imageBack}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>    
          </View>}
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