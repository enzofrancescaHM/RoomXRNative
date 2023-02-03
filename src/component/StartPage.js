import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Image, Text, TouchableOpacity, View, StatusBar, Alert, Switch } from "react-native";
import { Context } from '../global/Store';
import usb from 'react-native-usb';
import Orientation from 'react-native-orientation-locker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediaDevices, registerGlobals } from "react-native-webrtc";


export function StartPage({ navigation }) {

  const [state, dispatch] = useContext(Context);
  const [usbIsEnabled, setUsbIsEnabled] = useState(false);
  const imageConnect = require("../images/connect.png");
  const imageQRCode = require("../images/qrcode.png");
  var timeoutHandle;

  let isEnumerateAudioDevices = false;

  const getUserValue = async () => {
    try {
      var myuser = await AsyncStorage.getItem('user');
      console.log("fresh user: " + myuser);
      dispatch({ type: 'SET_PEER_NAME', payload: myuser });
      return myuser;
    } catch (e) {
      // read error
      console.log("user read error!")
    }

    console.log('user Done.')
  }

  const getRoomValue = async () => {
    try {
      var myRoom = await AsyncStorage.getItem('room');
      console.log("fresh room: " + myRoom);
      dispatch({ type: 'SET_ROOM', payload: myRoom });
    } catch (e) {
      // read error
      console.log("room read error!")
    }

    console.log('room Done.')
  }
  const getRootValue = async () => {
    try {
      var myRoot = await AsyncStorage.getItem('root');
      console.log("fresh root: " + myRoot);
      dispatch({ type: 'SET_ROOT', payload: myRoot });
    } catch (e) {
      // read error
      console.log("root read error!")
    }

    console.log('root Done.')
  }

  function connectgo() {
    // check if all the needed parameters are set
    if (state.root_address == "empty" ||
      state.room_id == "empty" ||
      state.peer_name == "empty" ||
      state.root_address == null ||
      state.room_id == null ||
      state.peer_name == null
      ) {
      console.log("uh-oh, something missing!");
      Alert.alert(
        "Warning",
        "App not properly configured, please read the QRCODE provided",
        [
          { text: "OK", onPress: () => console.log("OK Pressed") }
        ]
      );

    }
    else {
      navigation.replace('MainPage');
    }

  }

  function scannergo() {
    navigation.replace('ScannerPage');
  }

  useEffect(() => {
    console.log(usbIsEnabled);
    dispatch({ type: 'SET_USBCAMERA', payload: usbIsEnabled });
    if(usbIsEnabled == true)
    {
      console.log("useeffect requirepermissions");
      requireUSBPermissions();
    }
  }, [usbIsEnabled])

  function toggleUsb() {
    console.log("toggle..");
    setUsbIsEnabled(previousState => !previousState);

  }


  useEffect(function componentDidMount() {
    console.log("%c StartPage componetDidMount", "color:green;");
    // read config from persistent memory        
    const user = getUserValue();
    const room = getRoomValue();
    const root = getRootValue();

    console.log('00.1 ----> registerGlobals');
    registerGlobals();
    console.log('01 ----> init Enumerate Devices');
    initEnumerateAudioDevices();

    timeoutHandle = setTimeout(() => {

      StatusBar.setHidden(true, 'none');
      Orientation.lockToLandscapeLeft();

      // do this at the start of the app
      console.log("before require permissions");
      // require only if USB is selected...
      if(usbIsEnabled == true)
      {
        console.log("component mount usb permission");
        requireUSBPermissions();
      }
        

    }, 500);

    return function componentWillUnmount() {
      clearTimeout(timeoutHandle);
      //usb.disconnect();
      console.log("%c MainPage componetWillUnmount", "color:red")
    }
  }, [])

  async function requireUSBPermissions() {
    
    //return;
    console.log("requiring permissions...")

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

  async function initEnumerateAudioDevices() {
    if (isEnumerateAudioDevices) 
    {
      console.log("isenumerateaudiodevices = true");
      return;
    }
    dispatch({ type: 'SET_MIC_COUNT', payload: 0 });
    dispatch({ type: 'SET_SPEAKER_COUNT', payload: 0 });
    dispatch({ type: 'CLEAR_MICS', payload: "" });
    dispatch({ type: 'CLEAR_SPEAKERS', payload: "" });


    // start the audio monitor in order to monitor the changes in audio peripherals
    // i.e. whenever a bluetooth set is added or removed
    mediaDevices.startMediaDevicesEventMonitor();

    // allow the audio
    await mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            enumerateAudioDevices(stream);
            dispatch({ type: 'SET_IS_AUDIO_ALLOWED', payload: true });
            //isAudioAllowed = true;
        })
        .catch(() => {
            //isAudioAllowed = false;
            dispatch({ type: 'SET_IS_AUDIO_ALLOWED', payload: false });
        });
  }

  function enumerateAudioDevices(stream) {
    console.log('02 ----> Get Audio Devices');


    let miccount = 0;
    let speakcount = 0;

    mediaDevices
        .enumerateDevices()
        .then((devices) =>
            devices.forEach((device) => {
                console.log("audio device: ") 
                console.log(device);
                let el = null;
                if ('audioinput' === device.kind  || 'audio' === device.kind) {
                  miccount++;
                  
                  dispatch({ type: 'ADD_MIC', payload: device.deviceId});
                    //el = microphoneSelect;
                    //RoomClient.DEVICES_COUNT.audio++;
                } else if ('audiooutput' === device.kind) {
                  //dispatch({ type: 'SET_SPEAKER_COUNT', payload: state.speakerCount + 1 });
                  speakcount++;
                  dispatch({ type: 'ADD_SPEAKER', payload: device.deviceId});
                    //el = speakerSelect;
                    //RoomClient.DEVICES_COUNT.speaker++;
                }
                if (!el) return;
                //addChild(device, el);
            }),
        )
        .then(() => {
            stopTracks(stream);
            isEnumerateAudioDevices = true;
            dispatch({ type: 'SET_MIC_COUNT', payload: miccount });
            dispatch({ type: 'SET_SPEAKER_COUNT', payload: speakcount });

            //speakerSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);
        });
  }

  function stopTracks(stream) {
    stream.getTracks().forEach((track) => {
        track.stop();
    });
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
    headerContainer: {
      height: 40,
      position: "absolute",
      top: 0,
      left: 0,
      flexDirection: "row",
      padding: 0,
      backgroundColor: '#00FF0000',
      zIndex: 2,
    },
    bottomContainer: {
      height: 80,
      position: "absolute",
      bottom: state.real_height / 15,
      left: 10,
      flexDirection: "row",
      padding: 2,
      backgroundColor: '#00000000',
      zIndex: 2,
    },
    buttonsContainer: {
      flex: 1,
      flexDirection: "row",

    },
    buttonScannerStyle: {
      backgroundColor: '#485a96',
      borderWidth: 0.5,
      borderColor: '#fff',
      width: state.real_width / 2.5,
      height: state.real_height / 5,
      borderRadius: 5,
      margin: 5,
      flex: 1,
      flexDirection: "row",
    },
    buttonFacebookStyle: {
      backgroundColor: 'green',
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
    labelUsbTextStyle: {
      fontSize: state.real_height / 16,
      color: '#fff',
      marginTop: 7,
      marginLeft: 20,
      marginRight: 5,
    },
    switchusb: {
      marginTop: -20,
      marginLeft: 20,
      marginRight: 5,
    },
    labelTitle: {
      color: '#fff',
      marginTop: 0,
      fontSize: state.real_height / 7,
      textAlign: "center",
    },
    labelUser: {
      color: '#aaa',
      marginTop: 0,
      fontSize: state.real_height / 14,
      textAlign: "center",
      marginBottom: state.real_height / 10,
    },
    labelVersion: {
      fontSize: state.real_height / 16,
      color: '#aaa',
      marginTop: 7,
      marginLeft: 20,
      marginRight: 5,
    },
  });

  return (
    <>
      <View style={styles.mainContainer}>
        <Text style={styles.labelTitle}>RoomXR PRO</Text>
        <Text style={styles.labelUser}>user: {state.peer_name}</Text>
        {/* <Text style={styles.labelUser}>audio mic: {state.peer_name}</Text> */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.buttonScannerStyle}
            activeOpacity={0.5}
            onPress={scannergo}>
            <Image
              source={imageQRCode}
              style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            <Text style={styles.buttonTextStyle}>Config</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonFacebookStyle}
            activeOpacity={0.5}
            onPress={connectgo}>
            <Image
              source={imageConnect}
              style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            <Text style={styles.buttonTextStyle}>Connect</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bottomContainer}>
          <Text style={styles.labelVersion}>
            {"Version: " + state.app_ver}
          </Text>
          <Text style={styles.labelUsbTextStyle}>
            {(usbIsEnabled == true) ? "USB CAMERA ON" : "USB CAMERA OFF"}
          </Text>
          <Switch style={styles.switchusb}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={usbIsEnabled ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleUsb}
            value={usbIsEnabled}
          />

        </View>
      </View>

    </>
  )

}



