// react realated imports
import React, { useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, Alert, Image, Text, TouchableOpacity, View, StatusBar, ScrollView, BackHandler } from "react-native";
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



export function MainPage({ navigation, route }) {
    
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

                            console.log("****** TAKE PICTURE DISABLING CAMERA ******");
                            setIsActive(false);
                
                            console.log("Photo Detail: H: " + file.height + " W: " + file.width);
                            console.log("Photo Path: " + file.path);

                            dispatch({ type: 'SET_PICTUREFILENAME', payload: file.path });    
                        
                            var mytm0 = setInterval(function run(){
        
                                console.log("****** TAKE PICTURE RESUMING PRODUCER ******");
                                dispatch({ type: 'SET_RESUMEPRODUCER', payload: true });    
                                clearInterval(mytm0);
                    
                            },1500)


                            clearInterval(mytm2);
                
                        },1500)


                        clearInterval(mytm);
            
                    },1500)
                        
                 
                    // make all this as one shot
                    dispatch({ type: 'SET_TAKEPICTURE', payload: 'false' });
                }
        
        }
        takepic();
    }, [state.takepicture])

   

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

        //console.log('00 ----> init Socket.IO');
        //console.log("[main page] first connect...socket id: " + socket.id);
        //console.log('00.1 ----> registerGlobals');
        //registerGlobals();
        //console.log('01 ----> init Enumerate Devices');
        //await initEnumerateAudioDevices();
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
            //mediaDevices.showLoopBackCamera(false);
            //mediaDevices.showPointer("false,50,50");
            mediaDevices.showTextMessage("command_clearchat"); // this clears also the chat on the glasses
        }
        // TEST
        //mediaDevices.showPointer("false,200,150");
    }

    function toggleDisplay(){

        if(keysLocked)
        return;


        if(displayVisible)
        {
            setDisplayVisible(false);
            mediaDevices.showDisplay(false);
        }
        else
        {
            setDisplayVisible(true);
            mediaDevices.showDisplay(true);
        }

    }

    function toggleLoopBack(){
        if(keysLocked)
            return;


        if(loopVisible)
        {
            setLoopVisible(false);
            mediaDevices.showLoopBackCamera(false);
        }
        else
        {
            setLoopVisible(true);
            mediaDevices.showLoopBackCamera(true);
        }

    }

    function toggleVideos(){
        if(keysLocked)
            return;

        if(videosVisible)
        {
            setVideosVisible(false);
        }
        else
        {
            setVideosVisible(true);
        }
    }

   /*  async function initEnumerateAudioDevices() {
        if (isEnumerateAudioDevices) return;
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
    } */

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

 /*    function enumerateAudioDevices(stream) {
        console.log('02 ----> Get Audio Devices');
        mediaDevices
            .enumerateDevices()
            .then((devices) =>
                devices.forEach((device) => {
                    let el = null;
                    if ('audioinput' === device.kind) {
                        //el = microphoneSelect;
                        //RoomClient.DEVICES_COUNT.audio++;
                    } else if ('audiooutput' === device.kind) {
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
                //speakerSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);
            });
    } */

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
        //let qs = new URLSearchParams(window.location.search);
        //let audio = qs.get('audio');
        //let video = qs.get('video');
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
            top: state.real_height / 4,
        },
        textLobbyOff: {
            color: "#00000000",
            fontSize: state.real_height / 10,
            position: "absolute",
            left: 20,
            top: state.real_height / 4,
        },
        textDebugOn: {
            color: "white"
        },
        textDebugOff: {
            color: "#00000000"
        },
        scrollView: {
            position: "absolute",
            left: 15,
            top: state.real_height / 10,
            height: state.real_height /*/ divider * 2*/,
            width: state.real_width -40/*/ 2*/,
            backgroundColor: '#00000088',
            //backgroundColor: "#00000022",
            //marginLeft: 10,            
        },
        debugContainer: {
            height: "80%",
            position: "absolute",
            top: "10%",
            bottom: 0,
            flexDirection: "column",
            padding: 2,
            backgroundColor: '#00FF0000',
            zIndex: 2,
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
        bottomContainer: {
            height: 40,
            width: state.real_width,
            position: "absolute",
            bottom: 0,
            left: 0,
            flexDirection: "row",
            padding: 2,
            backgroundColor: '#00FF0000',
            zIndex: 2,
        },
        mainArea: {
            flex: 1,
            flexDirection: "row",
            height: "100%",
            padding: 2,
            backgroundColor: '#000000'
        },
        localStream: {
            width: "100%",
            height: "100%",
            backgroundColor: '#000000',
            zIndex: 0
        },
        remoteStream: {
            position: "absolute",
            right: 0,
            bottom: 0,
            width: "30%",
            height: "30%",
            backgroundColor: '#00000000',
            zIndex: 1
        },
    
        guest1Stream: {
            position: "absolute",
            right: 0,
            top: 0,
            width: "30%",
            height: "30%",
            backgroundColor: '#FF000000',
            zIndex: 1
        },
        guest2Stream: {
            position: "absolute",
            right: 0,
            top: "33%",
            width: "30%",
            height: "30%",
            backgroundColor: '#FF000000',
            zIndex: 1
        },
        whiteBoard: {
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: '#FF000000',
            border: '#FF0000',
            zIndex: 1
        },
        buttonGPlusStyle: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#dc4e41',
            borderWidth: 0.5,
            borderColor: '#fff',
            height: 40,
            borderRadius: 5,
            margin: 5,
        },
        mainContainer: {
            flex: 1,
            flexDirection: "column",
            height: "100%",
            padding: 2,
            backgroundColor: '#000000',
            alignItems: 'center'
        },
        buttonUserStyle: {
            backgroundColor: '#485a9600',
            borderWidth: 0.0,
            width: "100%",
            height: "100%",
            borderRadius: borderrds,
            flex: 1,
            flexDirection: "row",
            
        },
        buttonUserStyleSel: {
            backgroundColor: '#485a96FF',
            borderWidth: 0.0,
            width: "100%",
            height: "100%",
            borderRadius: borderrds,
            flex: 1,
            flexDirection: "row",
            
        },
        buttonImageIconStyle: {
            height: state.real_height / divider - 5,
            width: state.real_height / divider - 5,
            resizeMode: 'stretch',
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "auto",
            marginBottom: "auto"

        },
        buttonTextStyle: {
            color: '#fff',
            fontSize: state.real_height / 10,
            marginLeft: "auto",
            marginRight: "auto",
            textAlign: "center",
        },
        buttonIconSeparatorStyle: {
            backgroundColor: '#fff',
            width: 1,
            height: state.real_height / divider,
        },
        buttonContainerTop: {
            position: "absolute",
            top: 20,
            left: 20,
            borderRadius: borderrds,
            width:  state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
      
        buttonContainerTopLock: {
            position: "absolute",
            top: 20,
            left: 20 +  state.real_height / divider + 20,
            borderRadius: borderrds,
            width:  state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerTopSwipe: {
            position: "absolute",
            top: 16,
            left: 20 + state.real_height / divider + 40 + state.real_height / divider,
            borderRadius: borderrds,
            width:  state.real_height / divider + 180,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerSwitchCamera: {
            position: "absolute",
            bottom: 20,
            left: 20,
            borderRadius: borderrds,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerShowQRCode: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + 30,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerCleanChat: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + state.real_height / divider + 40,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerDisplay: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + state.real_height / divider + state.real_height / divider + 50,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerLoopBack: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + 60,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerLowerVolume: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + 70,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerRaiseVolume: {
            position: "absolute",
            bottom: 20,
            borderRadius: borderrds,
            left: state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + state.real_height / divider + 80,
            width: state.real_height / divider,
            height: state.real_height / divider,
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },

        qrcode:{
            position: "absolute",
            bottom: state.real_height / divider + 40,
            left: state.real_height / 2.5 + 60,
            width: state.real_width,
            height: state.real_height / 2.5,
            backgroundColor: '000',
            zIndex: 100,
            zOrder: 100,
        },
        buttonContainerToggleVideos: {
            position: "absolute",
            bottom: 0,
            right: 0,
            width: "30%",
            height: "30%",
            backgroundColor: buttonbck,
            zIndex: 100,
            zOrder: 100,
        },
        buttonToggleStyle: {
            backgroundColor: '#485a9600',
            borderWidth: 0.0,
            width: "100%",
            height: "100%",
            borderRadius: 5,
            flex: 1,
            flexDirection: "row",
        },
     




    });

    return (
        <>
            <KeepAwake />
         
            <View focusable={false} style={styles.debugContainer}>
              

                <Text focusable={false} style={debugIsEnabled ? styles.textDebugOn : styles.textDebugOff}>
                    {debugTest}
                </Text>

                {state.connected ? <RoomClient></RoomClient> : <Text style={styles.textDebugOn}>Room disconnected...</Text>}
                {(state.chat_array.length > 0) &&
                    <ScrollView
                        focusable={false}
                        style={styles.scrollView}
                        ref={scrollViewRef}
                        onContentSizeChange={(contentWidth, contentHeight) => {
                            scrollViewRef.current.scrollToEnd({ animated: true });
                        }}>
                        <Text style={styles.chatText}>{state.chat_array}</Text>
                    </ScrollView>
                }
                <Text focusable={false} style={state.lobby ? styles.textLobbyOn : styles.textLobbyOff}>
                    {"You are in the Lobby, waiting for approval..."}
                </Text>

            </View>
            <View focusable={false} style={styles.mainArea}>
                {(device != null ) &&
                    <Camera
                    ref={mycam}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={isActive}
                    photo={true}
                    />
                }
                
                
                
                <RTCView
                    focusable={false}
                    style={styles.localStream}
                    mirror={state.screenstream == "empty" ? false : true}
                    objectFit={'contain'}
                    streamURL={state.localstream == "empty" ? "" : state.localstream.toURL()}
                    zOrder={0}>
                </RTCView>
                <RoomBoard
                    containerStyle={styles.whiteBoard}>
                </RoomBoard>
                {(state.remotestream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}
                        style={styles.remoteStream}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.remotestream == "empty" ? "" : state.remotestream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }
                {(state.guest1stream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}    
                        style={styles.guest1Stream}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.guest1stream == "empty" ? "" : state.guest1stream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }
                {(state.guest2stream != "empty" && videosVisible) &&
                    <RTCView
                        focusable={false}    
                        style={styles.guest2Stream}
                        mirror={false}
                        objectFit={'contain'}
                        streamURL={state.guest2stream == "empty" ? "" : state.guest2stream.toURL()}
                        zOrder={1}>
                    </RTCView>
                }

            </View>
            
            <View style={styles.buttonContainerTop}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={invokeDisconnect}>
                    <Image
                        source={imageBack}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
            </View>

      


       <View style={styles.buttonContainerTopLock}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={toggleLock}>
                    <Image
                        source={keysLocked ? imageLock : imageUnlock}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
            </View>
            
            
            

           <View style={styles.buttonContainerTopSwipe}>
                            {keysLocked?<SwipeButton
                                
                                onSwipeSuccess={swipeAction}
                                railBackgroundColor="#a493d6"
                                thumbIconBackgroundColor="#FFFFFF"
                                title="Unlock"
                            /> : ""}
                        </View> 
            
            
            {(!state.usbcamera)&&<View style={styles.buttonContainerSwitchCamera}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={switchCamera}>
                    <Image
                        source={imageFlip}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
            </View>}

            <View style={styles.buttonContainerShowQRCode}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={addUSer}>
                    <Image
                        source={imageUser}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
                
            </View>

          <View style={styles.buttonContainerCleanChat}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={cleanChat}>
                    <Image
                        source={imageClean}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
                
            </View>

           <View style={styles.qrcode}>
                {qrVisible?<QRCode 
                        //QR code value
                        value={qrvalue ? qrvalue : 'NA'}
                        //size of QR Code
                        size={state.real_height / 2.5}
                />:""}
            </View>


            {(state.usbcamera)&&<View style={styles.buttonContainerDisplay}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={toggleDisplay}>
                    <Image
                        source={displayVisible ? imageARON : imageAR}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
            </View>}
            {(state.usbcamera)&&<View style={styles.buttonContainerLoopBack}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={toggleLoopBack}>
                    <Image
                        source={loopVisible ? imageLoopON : imageLoop}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
            </View>}

          <View style={styles.buttonContainerLowerVolume}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={lowerVolume}>
                    <Image
                        source={imageVolumeDown}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>
                
            </View>

            <View style={styles.buttonContainerRaiseVolume}>
                <TouchableOpacity
                    style={styles.buttonUserStyle}
                    activeOpacity={0.9}
                    onPress={raiseVolume}>
                    <Image
                        source={imageVolumeUp}
                        style={styles.buttonImageIconStyle}
                    />
                </TouchableOpacity>                
            </View> 


           <View style={styles.buttonContainerToggleVideos}>
                <TouchableOpacity
                    style={styles.buttonToggleStyle}
                    activeOpacity={0.9}
                    onPress={toggleVideos}>
                    {/* <Image
                        source={imageClean}
                        style={styles.buttonImageIconStyle}
                    /> */}
                </TouchableOpacity>
                
            </View>

        </>
    )
}