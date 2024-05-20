// react realated imports
import React, { useEffect, useRef, useState, useContext } from "react";
import { Button, StyleSheet, Alert, Image, Text, TouchableOpacity, View, StatusBar, ScrollView, BackHandler } from "react-native";
import { RTCView, mediaDevices} from "react-native-webrtc";
// mediasoup import
import * as mediasoupClient from "mediasoup-client";
// local project imports
import Store, { Context } from '../global/Store';
import RoomClient from "./RoomClient";
import Orientation from 'react-native-orientation-locker';
import { RoomBoard } from "./RoomBoard";
import QRCode from "react-native-qrcode-svg";
import { setNavigator, getCurrentRoute } from "../global/navigtionRef";
import KeepAwake from "@sayem314/react-native-keep-awake";
import SwipeButton from 'rn-swipe-button';
import { Camera } from 'react-native-vision-camera';
import { useCameraDevices } from 'react-native-vision-camera';
import { ExternalKeyboardView } from 'react-native-external-keyboard';


export function MainPageVuzix({ navigation, route }) {
    
    const mounted = useRef()
    const [debugTest, setDebugTest] = useState("---");
    const [rc, setRc] = useState(null);
    const [debugLine, setDebugLine] = useState("this is the debug line... ;)")
    const [state, dispatch] = useContext(Context);
    const [debugIsEnabled, setDebugIsEnabled] = useState(false);
    //const toggleDebug = () => setDebugIsEnabled(previousState => !previousState);
    const scrollViewRef = useRef();

    const [timerID, setTimerID] = useState(1234);

    const imageBack = require("../images/back.png");
    const imageFlip = require("../images/flip.png");
    const imageUser = require("../images/adduser.png");
    const imageClean = require("../images/trash.png");
    const imageAR = require("../images/ar.png");
    const imageLoop = require("../images/loopcamera.png");
    const imageARON = require("../images/arON.png");
    const imageLoopON = require("../images/loopcameraON.png");
    const imageUnlock = require("../images/unlock.png");
    const imageLock = require("../images/lock.png");
    const imageVolumeDown = require("../images/volumedown.png");
    const imageVolumeUp = require("../images/volumeup.png");



    const [qrvalue, setQrvalue] = useState('');
    const [qrVisible, setQrVisible] = useState(false);
    const [displayVisible, setDisplayVisible] = useState(true);
    const [loopVisible, setLoopVisible] = useState(false);
    const [videosVisible, setVideosVisible] = useState(true);
    const [keysLocked, setKeysLocked] = useState(false);

    const devices = useCameraDevices();
    const device = devices.back;
    const mycam = useRef();
    const myRC = useRef();
    const [isActive, setIsActive] = useState(false);


    // ####################################################
    // DYNAMIC SETTINGS
    // ####################################################
    let isEnumerateAudioDevices = false;
    let isEnumerateVideoDevices = false;
    let divider = 7;
    let buttonbck = '#00000019';
    let borderrds = 8;

    useEffect(function componentDidMount() {
        console.log("%c MainPage componetDidMount", "color:green;");

        StatusBar.setHidden(true, 'none');
        Orientation.lockToLandscapeLeft();

       

        dispatch({ type: 'SET_MEDIASOUPCLIENT', payload: mediasoupClient });

        // compose qrcode guest link
        // the format is the following: 
        // https://roomxr.eu:5001/join/holomask-test?name=ciccio&notify=0
        // or, in general: base + /join/ + room + ?name= + user + &notify=0
        setQrvalue(state.root_address + "/join/" + state.room_id + "?name=" + state.peer_name + "&notify=0")

        dispatch({ type: 'SET_BUTTONFOCUS', payload: 'neutral' });

        invokeCreateRoomClient();

        return function componentWillUnmount() {
            console.log("%c MainPage componetWillUnmount", "color:red")
        }
    }, [])

    useEffect(function componentDidMountAndCompontDidUpdate() {
        //console.log("%c MainPage componentDidMountAndCompontDidUpdate", "color:teal;")
    })

    useEffect(function runComponentDidUpdate() {
        if (!isComponetMounted()) {
            return
        }
        (function componentDidUpdate() {
            StatusBar.setHidden(true, 'none');
            //console.log("%c MainPage CompontDidUpdateForAnyVariable", "color:orange;")
        })()
    });

    useEffect(function lastUseEffect() {
        signComponetAsMounted()
    }, [])

    function signComponetAsMounted() {
        mounted.current = true
    }

    function isComponetMounted() {
        if (!mounted.current) return false;
        return true;
    }

    useEffect(() => {
        if(state.ejected == true)
        {
            console.log("disconnected!");
            //const {index, routes} = navigation.dangerouslyGetState();
            //const currentRoute = getCurrentRoute();
            console.log('current screen', state.current_page);
            //console.log(route.name);
            //if (state.current_page == 'MainPage'){
                dispatch({ type: 'SET_EJECTED', payload: 'false' });
                navigation.replace('StartPage');    
            //}
        }
    }, [state.ejected])

    useEffect(() => {
        async function takepic(){
            console.log("ci siamo..." + state.takepicture);
            if(state.takepicture == true)
                {
                    console.log("****** TAKE PICTURE START ******");
                    console.log("****** TAKE PICTURE PAUSING PRODUCER ******");
                    
                    dispatch({ type: 'SET_PAUSEPRODUCER', payload: true });

                    var mytm = setInterval(function run(){
            
                        console.log("****** TAKE PICTURE ACTIVATING CAMERA ******");
                        setIsActive(true);
                        
                        
                        var mytm2 = setInterval(async function run(){
            
                            console.log("****** TAKE PICTURE TAKING REAL PHOTO ******");                            
                                
                            // use camera night vision library to take screenshot
                            var file = await mycam.current.takePhoto();
                            dispatch({ type: 'SET_PICTUREFILENAME', payload: file.path });                                
                            console.log("Photo Detail: H: " + file.height + " W: " + file.width);
                            console.log("Photo Path: " + file.path);
                            dispatch({ type: 'SET_UPLOADPICTURE', payload: true });    

                            console.log("****** TAKE PICTURE DISABLING CAMERA ******");
                            setIsActive(false);
                        
                            var mytm0 = setInterval(function run(){
        
                                console.log("****** TAKE PICTURE RESUMING PRODUCER ******");
                                dispatch({ type: 'SET_RESUMEPRODUCER', payload: true });    
                                clearInterval(mytm0);
                    
                            },1500)


                            clearInterval(mytm2);
                
                        },2000)


                        clearInterval(mytm);
            
                    },2000)
                        
                 
                    // make all this as one shot
                    dispatch({ type: 'SET_TAKEPICTURE', payload: 'false' });
                }
        
        }
        takepic();
    }, [state.takepicture])

    const onFocus = (e) => {
        console.log(e.nativeEvent.keyCode);
        console.log(state.button_focus );
        if (e.nativeEvent.keyCode == "66") {
          console.log("pressssssssss");
          if (state.button_focus == "qrcode") {
            //stopTracks(state.localstream);
            cleanChat();
          }
          else if(state.button_focus == "connect"){
            invokeDisconnect();
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

    useEffect(() => {
        const backAction = () => {
            console.log("back!");
            invokeDisconnect();
          return true;
        };
    
        const backHandler = BackHandler.addEventListener(
          'hardwareBackPress',
          backAction,
        );
    
        return () => backHandler.remove();
      }, []);

    async function invokeDisconnect() {

        if(keysLocked)
            return;

        if(state.usbcamera){
            mediaDevices.showTextMessage("command_disconnect");
        }
        
        dispatch({ type: 'SET_CONNECTED', payload: false });


        dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' });
        navigation.replace('StartPage');

    }

    async function invokeCreateRoomClient() {
        createRoomClient(state.usbcamera);
    }

    async function swipeAction(){       
            console.log("keys unlocked by swipe!");
            setKeysLocked(false);
    }

    async function toggleLock(){
        if (keysLocked)
        {
            return;
            //console.log("keys were locked, now are unlocked");
            //setKeysLocked(false);
        }
        else
        {
            console.log("keys were unlocked, now are locked");
            setKeysLocked(true);
        }
            
    }


    async function createRoomClient(usbcameracase) {

        console.log("STATE: " + state.usbcamera);

        console.log('03 ----> Get Video Devices');

        var dText = "Debug Devices:\n";
        mediaDevices
            .enumerateDevices()
            .then((devices) =>
                devices.forEach((device) => {
                    console.log("device: ", device);
                    dText = dText + "dev: " + JSON.stringify(device) + "\n";
                    setDebugTest(dText);
                    if ('videoinput' === device.kind) {
                    }
                }),
            )

        //await initEnumerateVideoDevices();
        checkMedia();
        console.log('04 ----> Who are you');
        dispatch({ type: 'SET_CONNECTED', payload: true });

        if(state.usbcamera)
        {
            console.log("put heartbeat to usb_init");
            //mediaDevices.heartBeat("supercalifragilistiche");

            // signal also the splash special message
            var mySplash = state.splash_message;
            mediaDevices.showTextMessage("command_splash" + mySplash);

            mediaDevices.showTextMessage("command_setusb");
            
            var mytmr = setInterval(function run(){
                //mediaDevices.showPointer("false,200,150");
                mediaDevices.heartBeat()
                .then((beat) => {
                    if(beat){
                        console.log("heart beat");
                    }
                    else 
                    {
                        clearInterval(mytmr);
                        Alert.alert(
                            "Warning",
                            "Smart Glasses Detached... please check the cable connection",
                            [
                              { text: "OK", onPress: () => invokeDisconnect() }
                            ]
                          );
                        
                    }

                })
                
            },5000)
            
            //setTimerID( ciccio );
            
        }
        else
        {
            console.log("put heartbeat to NOusb_init");
            //mediaDevices.heartBeat("notsupercalifragilistiche");
            mediaDevices.showTextMessage("command_notsetusb");
        }

    }



    function switchCamera() {

        if(keysLocked)
        return;


        // first safe mechanism
        if(state.localstream == "empty")
            return;

        state.localstream.getVideoTracks().forEach((track) => {
            console.log('sc', track);
            track._switchCamera();
        })
    }

    function addUSer() {

        if(keysLocked)
            return;


        //mediaDevices.showPointer("true,200,150");

        if(qrVisible)
            setQrVisible(false);
        else
            setQrVisible(true);
    }


    function raiseVolume(){
        mediaDevices.raiseCallVolume();
    }

    function lowerVolume(){
        mediaDevices.lowerCallVolume();
    }


    function cleanChat(){

        if(keysLocked)
        return;

        dispatch({ type: 'CLEAR_CHAT', payload: true });
        if(state.usbcamera){
            mediaDevices.showTextMessage("command_clearchat"); // this clears also the chat on the glasses
        }
    }

    async function initEnumerateVideoDevices() {
        if (isEnumerateVideoDevices) return;
        // allow the video
        await mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                enumerateVideoDevices(stream);
                dispatch({ type: 'SET_IS_VIDEO_ALLOWED', payload: true });
                //isVideoAllowed = true;
            })
            .catch(() => {
                dispatch({ type: 'SET_IS_VIDEO_ALLOWED', payload: false });
                //isVideoAllowed = false;
            });
    }

    function enumerateVideoDevices(stream) {
        console.log('03 ----> Get Video Devices');
        var dText = "Debug Devices:\n";
        mediaDevices
            .enumerateDevices()
            .then((devices) =>
                devices.forEach((device) => {
                    let el = null;
                    console.log("device: ", device);
                    dText = dText + "dev: " + JSON.stringify(device) + "\n";
                    setDebugTest(dText);
                    if ('videoinput' === device.kind) {
                        //el = videoSelect;
                        //RoomClient.DEVICES_COUNT.video++;
                    }
                    if (!el) return;
                    //addChild(device, el);
                }),
            )
            .then(() => {
                stopTracks(stream);
                isEnumerateVideoDevices = true;
            });
    }

    function stopTracks(stream) {
        stream.getTracks().forEach((track) => {
            track.stop();
        });
    }

    function checkMedia() {
        let audio = '1';
        let video = '1';
        if (audio) {
            audio = audio.toLowerCase();
            let queryPeerAudio = audio === '1' || audio === 'true';
            if (queryPeerAudio != null)
                dispatch({ type: 'SET_IS_AUDIO_ALLOWED', payload: queryPeerAudio });//isAudioAllowed = queryPeerAudio;
        }
        if (video) {
            video = video.toLowerCase();
            let queryPeerVideo = video === '1' || video === 'true';
            if (queryPeerVideo != null)
                dispatch({ type: 'SET_IS_VIDEO_ALLOWED', payload: queryPeerVideo });//isVideoAllowed = queryPeerVideo;
        }
    }

    const styles = StyleSheet.create({
        chatText: {
            color: "white",
            fontSize: state.real_height / 20,
            //backgroundColor: "#00000022",
            //marginLeft: 5,
            padding: 5
        },
        textLobbyOn: {
            color: "white",
            fontSize: state.real_height / 10,
            position: "absolute",
            left: 20,
            top: 100,
        },
        textLobbyOff: {
            color: "#00000000",
            fontSize: state.real_height / 10,
            position: "absolute",
            left: 20,
            top: state.real_height / 4,
        },

        scrollView: {
            position: "absolute",
            left: 15,
            top: 45,
            height: 260,
            width: 290,
            backgroundColor: '#00000088',
            //backgroundColor: "#00000022",
            //marginLeft: 10,            
        },
  
        headerContainer: {
            height: state.real_height / 10,
            width: state.real_width,
            position: "absolute",
            top: 0,
            left: 0,
            flexDirection: "row",
            padding: 0,
            backgroundColor: '#00FF0000',
            zIndex: 2,
        },
    



        mainAreaVuzix: {
            //flex: 1,
            //flexDirection: "row",
            height: "100%",
            padding: 2,
            backgroundColor: '#000000',
            zIndex:0,
        },
        localStreamVuzix: {
            postion: "absolute",
            right:0,
            top:65,
            width: "100%",
            height: 200,
            backgroundColor: '#FFFF0000',
            zIndex: 100
        },
        remoteStreamVuzix: {
            position: "absolute",
            right: 2,
            bottom: 205,
            width: "30%",
            height: "30%",
            backgroundColor: '#00000000',
            zIndex: 201
        },
        guest1StreamVuzix: {
            position: "absolute",
            right: 112,
            bottom: 205,
            width: "30%",
            height: "30%",
            backgroundColor: '#FF000000',
            zIndex: 1
        },
        guest2StreamVuzix: {
            position: "absolute",
            left:2 ,
            bottom: 205,
            width: "30%",
            height: "30%",
            backgroundColor: '#FF000000',
            zIndex: 1
        },
        whiteBoardVuzix: {
            position: "absolute",
            left: 0,
            top: 118,
            width: "100%",
            height: "60%",
            backgroundColor: '#00000000',
            borderColor: '#FFFFFF',
            borderWidth: 0,
            zIndex: 100
        },
 
        buttonContainerTopVuzix: {
            position: "absolute",
            top: 0,
            left: 0,
            //borderRadius: borderrds,
            width:  state.real_height,
            height: 40,
            backgroundColor: "#00FF0000",
            zIndex: 110,
            zOrder: 100,
        },
 
        bottomContainerBlade: {
            height: 40,
            flexDirection: "row",
            padding: 2,
            backgroundColor: '#00000000',
            zIndex: 2,
          },




    });

    return (
        <>
            <KeepAwake />
                
          
            <ExternalKeyboardView style={styles.mainAreaVuzix}
            onKeyDownPress={onFocus}
            onKeyUpPress={() => console.log('onKeyUp')}
            canBeFocused>

                {(state.connected) && <RoomClient></RoomClient>}

                <View style={styles.buttonContainerTopVuzix}>

                    <View focusable={false} style={styles.bottomContainerBlade} accessible>
                        <Button focusable={false}
                        
                        title="Clean"
                        color={(state.button_focus == "connect" || state.button_focus == "neutral") ? "#000000" : "#FF0000"}
                        />
                        <Button focusable={false}
                        
                        title="Exit"
                        color={(state.button_focus == "qrcode" || state.button_focus == "neutral") ? "#000000" : "#FF0000"}
                        > 
                        </Button>
                
                    </View>

                </View>

            

                <RTCView
                    focusable={false}
                    style={styles.localStreamVuzix}
                    mirror={state.screenstream == "empty" ? false : true}
                    objectFit={'contain'}
                    streamURL={state.localstream == "empty" ? "" : state.localstream.toURL()}
                    zOrder={1}>
                </RTCView>

                {(state.remotestream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}
                        style={styles.remoteStreamVuzix}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.remotestream == "empty" ? "" : state.remotestream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }

                {(state.guest1stream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}    
                        style={styles.guest1StreamVuzix}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.guest1stream == "empty" ? "" : state.guest1stream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }
                
                {(state.guest2stream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}    
                        style={styles.guest2StreamVuzix}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.guest2stream == "empty" ? "" : state.guest2stream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }

                {(state.chat_array.length > 0) &&
                    <ScrollView
                        zOrder={200}
                        focusable={false}
                        style={styles.scrollView}
                        ref={scrollViewRef}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            scrollViewRef.current.scrollToEnd({ animated: true });
                        }}>
                        <Text style={styles.chatText}>{state.chat_array}</Text>
                    </ScrollView>
                }

                {(state.path_array.length != 0 ||
                  state.ellipse_array.length != 0 ||
                  state.rect_array.length != 0 ||
                  state.line_array.length != 0 ||
                  state.text_array.length != 0 ||
                  state.image_array.length != 0     
                ) &&                 
                    <RoomBoard
                        containerStyle={styles.whiteBoardVuzix}>
                    </RoomBoard>

                }
             
                {(device != null ) &&
                    <Camera
                    ref={mycam}
                    style={styles.localStreamVuzix}
                    device={device}
                    isActive={isActive}
                    photo={true}
                    zOrder={200}
                    />
                }

                {(state.lobby == true) &&
                <Text focusable={false} style={styles.textLobbyOn}>
                            {"You are in the Lobby, waiting for approval..."}
                </Text>
                }

           </ExternalKeyboardView>
    
        </>
    )
}