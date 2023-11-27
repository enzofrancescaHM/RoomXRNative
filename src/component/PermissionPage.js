//import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useState, useContext } from 'react';
import { ImageRequireSource, Linking, StatusBar, TouchableOpacity} from 'react-native';
import { StyleSheet, View, Text, Image, Button } from 'react-native';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';
import { CONTENT_SPACING, SAFE_AREA_PADDING } from '../global/constants';
import { Context } from '../global/Store';
import Orientation from 'react-native-orientation-locker';
import DeviceInfo from 'react-native-device-info';
//import type { Routes } from './Routes';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const BANNER_IMAGE = require('../images/11.png');

//type Props = NativeStackScreenProps<Routes, 'PermissionsPage'>;
export function PermissionsPage({ navigation }) {
  const [cameraPermissionStatus, setCameraPermissionStatus] = useState('not-determined');
  const [microphonePermissionStatus, setMicrophonePermissionStatus] = useState('not-determined');
  const [state, dispatch] = useContext(Context);

  const requestMicrophonePermission = useCallback(async () => {
    console.log('Requesting microphone permission...');
    const permission = await Camera.requestMicrophonePermission();
    console.log(`Microphone permission status: ${permission}`);

    if (permission === 'denied') await Linking.openSettings();
    setMicrophonePermissionStatus(permission);
  }, []);

  const requestCameraPermission = useCallback(async () => {
    console.log('Requesting camera permission...');
    const permission = await Camera.requestCameraPermission();
    console.log(`Camera permission status: ${permission}`);

    if (permission === 'denied') await Linking.openSettings();
    setCameraPermissionStatus(permission);
  }, []);

  const requestBladePermission = useCallback(async () => {

    
    console.log("REquesting blade permissions");
    console.log("cameraperm: " + cameraPermissionStatus);
    console.log("micperm: " + microphonePermissionStatus);


    if(cameraPermissionStatus !== 'authorized')
    {
      console.log('Requesting camera permission...');
      const permission = await Camera.requestCameraPermission();
      console.log(`Camera permission status: ${permission}`);
  
      if (permission === 'denied') await Linking.openSettings();
      setCameraPermissionStatus(permission);
    }

    if(cameraPermissionStatus === 'authorized' && microphonePermissionStatus !== 'authorized') 
    {
      console.log('Requesting microphone permission...');
      const permission = await Camera.requestMicrophonePermission();
      console.log(`Microphone permission status: ${permission}`);
  
      if (permission === 'denied') await Linking.openSettings();
      setMicrophonePermissionStatus(permission);
    }

    
   
  }, []);


  useEffect(function componentDidMount() {
    console.log("%c Permission Page componetDidMount", "color:green;");

    StatusBar.setHidden(true, 'none');
    Orientation.lockToLandscapeLeft();

    let brand = DeviceInfo.getBrand();
    console.log("brand: " + brand);
    dispatch({ type: 'SET_DEVICEBRAND', payload: brand });

    DeviceInfo.getDevice().then((device) => {
        console.log("device:" + device);
        dispatch({ type: 'SET_DEVICENAME', payload: device });
    });

    DeviceInfo.getHardware().then(hardware => {
        console.log("hard:" + hardware);
    });

    DeviceInfo.getProduct().then((product) => {
        console.log("prod:" + product);
    });

}, [])

  useEffect(() => {
    if (cameraPermissionStatus === 'authorized' && microphonePermissionStatus === 'authorized') 
    { dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' }); navigation.replace('SplashPage');}
  }, [cameraPermissionStatus, microphonePermissionStatus, navigation]);

  const styles = StyleSheet.create({
    welcome: {
      fontSize: 38,
      fontWeight: 'bold',
      maxWidth: '80%',
      color: '#444444'
    },
    banner: {
      position: 'absolute',
      opacity: 0.4,
      bottom: 0,
      right: 0,
    },
    container: {
      flex: 1,
      backgroundColor: 'white',
      ...SAFE_AREA_PADDING,
    },
    permissionsContainer: {
      marginTop: CONTENT_SPACING * 2,
    },
    permissionsContainerBlade:{
      marginTop: 50,
      height: 150,
      width: 150
    },
    permissionText: {
      fontSize: 17,
      color: '#666666'
    },
    hyperlink: {
      color: '#007aff',
      fontWeight: 'bold',
    },
    bold: {
      color: '#000000',
      fontWeight: 'bold',
    },
    buttonFacebookStyle: {
      backgroundColor: 'green',
      borderWidth: 0.5,
      borderColor: '#fff',
      width: 50,
      height: 50,
      borderRadius: 5,
      margin: 5,
      // flex: 1,
      // flexDirection: "row",
    },
    buttonTextStyle: {
      color: '#fff',
      fontSize: 20,
      marginLeft: "auto",
      marginRight: "auto",
      marginTop: "auto",
      marginBottom: "auto",
      textAlign: "center",
    },
    bladeContainer:{
      flex: 1,
      flexDirection: "column",
      justifyContent: 'space-between',
      padding: 2,
      backgroundColor: '#000000',
      alignItems: 'center'
    },
    bladeButtonView:{
      flex: 1,
      flexDirection: "row",
      justifyContent: 'space-between',
     // height: 100,
      width:"100%",
     padding: 2,
     backgroundColor: '#111111',
     alignItems: 'center'
   },
   labelTitle: {
    color: '#fff',
    marginTop: 0,
    marginBottom:0,
    fontSize: state.real_height / 8,
    textAlign: "center",
  },
  labelUser: {
    color: '#aaa',
    marginTop: 0,
    fontSize: state.real_height / 32,
    textAlign: "center",
    // marginBottom: state.real_height / 10,
  },
  });

  return (
    <>
    {(state.device_name == "blade2") && <View style={styles.bladeContainer}>
      
         <View style={styles.bladeButtonView}>
        <Button
          onPress={requestCameraPermission}
          title="Grant Cam"
          color="#111111"
          accessibilityLabel="Learn more about this purple button"
        />

         <Button
          onPress={requestMicrophonePermission}
          title="Grant Mic"
          color="#111111"
          accessibilityLabel="Learn more about this purple button"
        />
        </View>
        <Text style={styles.labelTitle}>Permissions</Text>
        <Text style={styles.labelUser}>RoomXR PRO need Permissions to access:</Text>
        <Text style={styles.labelUser}>- Internal VideoCamera</Text>
        <Text style={styles.labelUser}>- System Microphone</Text>
        <Text style={styles.labelUser}>Please select the two buttons above and grant permissions in order to the app to work correctly</Text>

    </View>}

    {(state.device_name != "blade2") && <View style={styles.container}>
     <Image source={BANNER_IMAGE} style={styles.banner} />
      <Text style={styles.welcome}>Welcome to{'\n'}RoomXR PRO.</Text>
      <View style={styles.permissionsContainer}>
        {cameraPermissionStatus !== 'authorized' && (
          <Text style={styles.permissionText}>
            App needs <Text style={styles.bold}>Camera permission</Text>.{' '}
            <Text style={styles.hyperlink} onPress={requestCameraPermission}>
              Grant
            </Text>
          </Text>
        )}
         {cameraPermissionStatus == 'authorized' && (
          <Text style={styles.permissionText}>
            Camera permission already granted!
          </Text>
        )}
        {microphonePermissionStatus !== 'authorized' && (
          <Text style={styles.permissionText}>
            App needs <Text style={styles.bold}>Microphone permission</Text>.{' '}
            <Text style={styles.hyperlink} onPress={requestMicrophonePermission}>
              Grant
            </Text>
          </Text>
        )}
        {microphonePermissionStatus == 'authorized' && (
          <Text style={styles.permissionText}>
            microphone permission already granted!
          </Text>
        )}

      </View>
    </View>}
    </>
  );
}

