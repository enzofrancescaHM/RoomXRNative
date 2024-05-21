import React, { useEffect, useState, useContext, useRef } from "react";
import { Button, StyleSheet, Image, Text, TouchableOpacity, View, StatusBar, Alert, Switch, TextInput, TouchableHighlight } from "react-native";
import { Dimensions, Platform, AccessibilityInfo, NativeSyntheticEvent } from 'react-native';
import { Context } from '../global/Store';
import usb from 'react-native-usb';
import Orientation from 'react-native-orientation-locker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mediaDevices, registerGlobals } from "react-native-webrtc";
import * as UpdateAPK from "rn-update-apk";
import StaticSafeAreaInsets from 'react-native-static-safe-area-insets';
import { ExternalKeyboardView } from 'react-native-external-keyboard';




export function StartPage({ navigation }) {

  const [state, dispatch] = useContext(Context);
  const [usbIsEnabled, setUsbIsEnabled] = useState(false);
  const [downloadPerc, setDownloadPerc] = useState("---");
  const imageConnect = require("../images/connect.png");
  const imageQRCode = require("../images/qrcode.png");
  var timeoutHandle;
  var timeoutHandle2;

  const SCR_WIDTH = Dimensions.get('window').width;
  const SCR_HEIGHT = Platform.select({
    android: Dimensions.get('screen').height - StaticSafeAreaInsets.safeAreaInsetsBottom,
    ios: Dimensions.get('window').height,
  });

  

  console.log("WIDTH:");
  console.log(SCR_WIDTH);

  console.log("HEIGHT:");
  console.log(SCR_HEIGHT);

  console.log(state.app_arch);


  let isEnumerateAudioDevices = false;
  let versionURL = "---";

  if (state.app_arch == "arm64-v8a")
    versionURL = "https://holomask.eu/roomxrpro/test-version-arm64-v8a.json";

  if (state.app_arch == "win_x64")
    versionURL = "https://holomask.eu/roomxrpro/test-version-win_x64.json";

  if (state.app_arch == "armeabi-v7a")
    versionURL = "https://holomask.eu/roomxrpro/test-version-armeabi-v7a.json";

  var updater = new UpdateAPK.UpdateAPK({
    iosAppId: "0000000000",
    apkVersionUrl:
      versionURL,
    apkVersionOptions: {
      method: 'GET',
      headers: {}
    },
    apkOptions: {
      headers: {}
    },
    fileProviderAuthority: "com.roomxr.provider",
    needUpdateApp: performUpdate => {
      Alert.alert(
        "Update Available",
        "New version released, do you want to update? ",
        [
          { text: "Cancel", onPress: () => { } },
          { text: "Update", onPress: () => performUpdate(true) }
        ]
      );
    },
    forceUpdateApp: () => {
      console.log("forceUpdateApp callback called");
    },
    notNeedUpdateApp: () => {
      console.log("notNeedUpdateApp callback called");
    },
    downloadApkStart: () => {
      console.log("downloadApkStart callback called");
    },
    downloadApkProgress: progress => {
      console.log(`downloadApkProgress callback called - ${progress}%...`);
      setDownloadPerc(progress);
      // This is your opportunity to provide feedback to users on download progress
      // If you hae a state variable it is trivial to update the UI
      // this.setState({ downloadProgress: progress });
    },

    // This is called prior to the update. If you throw it will abort the update
    downloadApkEnd: () => {
      console.log("downloadApkEnd callback called");
      setDownloadPerc("100");
    },

    // This is called if the fetch of the version or the APK fails, so should be generic
    onError: err => {
      console.log("onError callback called", err);
      setDownloadPerc("ERROR");
      Alert.alert("There was an error", err.message);
    }

  });

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

  // const onFocus = (e) => {
  //   console.log(e.nativeEvent.keyCode);
  //   if (e.nativeEvent.keyCode == "66") {
  //     console.log("pressssssssss");
  //     if (state.button_focus == "qrcode") {
  //       scannergo();
  //     }
  //     else {
  //       connectgo();
  //     }
  //   }

  //   if (state.button_focus == "qrcode") {
  //     //console.log("to connect");  
  //     dispatch({ type: 'SET_BUTTONFOCUS', payload: 'connect' });
  //   }
  //   else {
  //     //console.log("to qrcode");
  //     dispatch({ type: 'SET_BUTTONFOCUS', payload: 'qrcode' });
  //   }

  // };


  const onFocus = (e) => {
    console.log(e.nativeEvent.keyCode);
    console.log(state.button_focus );
    if (e.nativeEvent.keyCode == "66") {
      console.log("pressssssssss");
      if (state.button_focus == "qrcode") {
        //stopTracks(state.localstream);
        scannergo();
      }
      else if(state.button_focus == "connect"){
       connectgo();
      }
    }
    else{
        console.log("change focus...");
        if (state.button_focus == "qrcode") {
            //console.log("to connect");  
            dispatch({ type: 'SET_BUTTONFOCUS', payload: 'connect' });
          }
        else if(state.button_focus == "connect") {
            //console.log("to qrcode");
            dispatch({ type: 'SET_BUTTONFOCUS', payload: 'qrcode' });
          }
          else{
            dispatch({ type: 'SET_BUTTONFOCUS', payload: 'qrcode' });
          }
    }



  };



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
      if(state.device_name == "blade2")
      {
        dispatch({ type: 'SET_CURRENTPAGE', payload: 'MainPageVuzix' });
        navigation.replace('MainPageVuzix');
  
      }
      else
      {
        dispatch({ type: 'SET_CURRENTPAGE', payload: 'MainPage' });
        navigation.replace('MainPage');
  
      }
    }

  }

  function scannergo() {
    dispatch({ type: 'SET_CURRENTPAGE', payload: 'ScannerPage' });
    navigation.replace('ScannerPage');
  }

  useEffect(() => {
    console.log(usbIsEnabled);
    dispatch({ type: 'SET_USBCAMERA', payload: usbIsEnabled });
    if (usbIsEnabled == true) {
      console.log("useeffect requirepermissions");
      requireUSBPermissions();
    }
  }, [usbIsEnabled])





  function toggleUsb() {
    console.log("toggle..");
    setUsbIsEnabled(previousState => !previousState);

  }

  function checkUpd() {
    // debug
    console.log("packagename from updateapk:");
    console.log(UpdateAPK.getInstalledPackageName());
    console.log("versioncode from updateapk:");
    console.log(UpdateAPK.getInstalledVersionCode());
    console.log("versionname from updateapk:");
    console.log(UpdateAPK.getInstalledVersionName());
    console.log("packageinstaller from updateapk:");
    console.log(UpdateAPK.getInstalledPackageInstaller());


    console.log("checking for update");
    updater.checkUpdate();

  }


  useEffect(function componentDidMount() {
    console.log("%c StartPage componetDidMount", "color:green;");
    dispatch({ type: 'SET_BUTTONFOCUS', payload: 'neutral' });

    // at this point I can inject the OS Name with the glasses name
    // so that the desktop version of RoomXR PRO can change some UI accordingly
    if(state.device_name == "blade2")
      dispatch({ type: 'SET_OSNAME', payload: 'Blade2' });

    UpdateAPK.getApps().then(apps => {
      //console.log("Installed Apps: ", JSON.stringify(apps));
      //this.setState({ allApps: apps});
    }).catch(e => console.log("Unable to getApps?", e));

    UpdateAPK.getNonSystemApps().then(apps => {
      console.log("Installed Non-System Apps: ", JSON.stringify(apps));
      //this.setState({ allNonSystemApps: apps});
    }).catch(e => console.log("Unable to getNonSystemApps?", e));


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
      if (usbIsEnabled == true) {
        console.log("component mount usb permission");
        //requireUSBPermissions();
      }


    }, 500);

    timeoutHandle2 = setTimeout(() => {
      checkUpd();
      //console.log(btnRef.current.focus());
    }, 1500);

    return function componentWillUnmount() {
      clearTimeout(timeoutHandle);
      clearTimeout(timeoutHandle2);
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
    if (isEnumerateAudioDevices) {
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
          console.log("device: ")
          console.log(device);
          let el = null;
          if ('audioinput' === device.kind || 'audio' === device.kind) {
            miccount++;

            dispatch({ type: 'ADD_MIC', payload: device.deviceId });
            //el = microphoneSelect;
            //RoomClient.DEVICES_COUNT.audio++;
          } else if ('audiooutput' === device.kind) {
            //dispatch({ type: 'SET_SPEAKER_COUNT', payload: state.speakerCount + 1 });
            speakcount++;
            dispatch({ type: 'ADD_SPEAKER', payload: device.deviceId });
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
    statusContainer: {
      height: 50,
      position: "absolute",
      bottom: 10,
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
      marginTop: 6,
      marginLeft: 20,
      marginRight: 5,
    },
    labelWarning: {
      fontSize: state.real_height / 20,
      color: '#aaa',
      marginTop: -1,
      marginLeft: -5,
      marginRight: 5,
    },
    bladeButtonView: {
      flex: 1,
      flexDirection: "row",
      justifyContent: 'space-between',
      // height: 100,
      width: "100%",
      padding: 2,
      backgroundColor: '#000000',
      alignItems: 'center'
    },
    bladeButtonScanner: {
    },
    bladeButtonConnect: {
    },
    bladeContainer: {
      flex: 1,
      flexDirection: "column",
      justifyContent: 'space-between',
      padding: 2,
      backgroundColor: '#000000',
      alignItems: 'center'
    },
    bottomContainerBlade: {
      height: 50,
      flexDirection: "row",
      padding: 2,
      backgroundColor: '#00000000',
      zIndex: 2,
    },
    statusContainerBlade: {
      height: 50,
      flexDirection: "row",
      padding: 2,
      backgroundColor: '#00000000',
      zIndex: 2,
    },
    button: {
      alignItems: 'center',
      backgroundColor: '#DDDDDD',
      padding: 10,
    },

  });

  return (
    <>
     
     
     { /* caso BLADE 2 */
      (state.device_name == "blade2") && <View focusable={false} style={styles.bladeContainer}>

        <ExternalKeyboardView
          onKeyDownPress={onFocus}
          onKeyUpPress={() => console.log('onKeyUp')}
          canBeFocused>

          <View style={styles.bottomContainerBlade} accessible>
            <Button focusable
              onPress={scannergo}
              title="QRCode"
              color={(state.button_focus == "connect" || state.button_focus == "neutral") ? "#000000" : "#FF0000"}
            />
            <Button focusable
              onPress={connectgo}
              title="Connect"
              color={(state.button_focus == "qrcode" || state.button_focus == "neutral") ? "#000000" : "#FF0000"}
            > 
            </Button>
          </View>

        </ExternalKeyboardView>

        <Text focusable={false} style={styles.labelTitle}>RoomXR PRO</Text>
        <Text focusable={false} style={styles.labelUser}>user: {state.peer_name}, room: {state.room_id}</Text>

        <View focusable={false} style={styles.bottomContainerBlade}>
          <Text focusable={false} style={styles.labelVersion}>
            {"v" + state.app_ver + " (" + state.app_arch + " )"}
          </Text>
        </View>

        <View focusable={false} style={styles.statusContainerBlade}>
          <Text focusable={false} style={styles.labelVersion}>
            {(downloadPerc == "---") ? "" : "download status: " + downloadPerc + "%"}
          </Text>
          {(state.device_name == "blade2" && !(state.root_address != "empty" &&
      state.room_id != "empty" &&
      state.peer_name != "empty" &&
      state.root_address != null &&
      state.room_id != null &&
      state.peer_name != null
    )) && <Text style={styles.labelWarning}>App not configured properly, please read the config QRCODE</Text>}
        </View>

      </View>
    }




      {/* caso Occhiale Normale */
      (state.device_name != "blade2") && <View style={styles.mainContainer} accessible>
        <Text style={styles.labelTitle}>RoomXR PRO</Text>
        <Text style={styles.labelUser}>user: {state.peer_name}, room: {state.room_id}</Text>
        {/* <Text style={styles.labelUser}>audio mic: {state.peer_name}</Text> */}
        <View style={styles.buttonsContainer}>
          {(state.device_name != "blade2") && <TouchableOpacity
            style={styles.buttonScannerStyle}
            activeOpacity={0.5}
            onPress={scannergo}>
            <Image
              source={imageQRCode}
              style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            <Text style={styles.buttonTextStyle}>Config</Text>
          </TouchableOpacity>}
          {(state.device_name != "blade2") && <TouchableOpacity
            style={styles.buttonFacebookStyle}
            activeOpacity={0.5}
            onPress={connectgo}>
            <Image
              source={imageConnect}
              style={styles.buttonImageIconStyle}
            />
            <View style={styles.buttonIconSeparatorStyle} />
            {(state.device_name != "blade2") && <Text style={styles.buttonTextStyle}>Connect</Text>}
          </TouchableOpacity>}
        </View>

        <View style={styles.bottomContainer}>
          <Text style={styles.labelVersion}>
            {"v" + state.app_ver + " (" + state.app_arch + " )"}
          </Text>
          {(state.device_name != "blade2") && <Text style={styles.labelUsbTextStyle}>
            {(usbIsEnabled == true) ? "USB CAMERA ON" : "USB CAMERA OFF"}
          </Text>}
          {(state.device_name != "blade2") && <Switch style={styles.switchusb}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            thumbColor={usbIsEnabled ? "#f5dd4b" : "#f4f3f4"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={toggleUsb}
            value={usbIsEnabled}
          />}

        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.labelVersion}>
            {(downloadPerc == "---") ? "" : "download status: " + downloadPerc + "%"}
          </Text>
        </View>
      </View>
      }

    </>
  )

}



