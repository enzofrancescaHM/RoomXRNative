// react realated imports
import React, { useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, Button, Switch,Text, useWindowDimensions, View, StatusBar, ScrollView } from "react-native";
import { RTCView, mediaDevices, registerGlobals } from "react-native-webrtc";
//import usb from 'react-native-usb';

// mediasoup import
import * as mediasoupClient from "mediasoup-client";

// local project imports
import Store, {Context} from '../global/Store';
import {SocketContext} from '../global/socket';
import RoomClient from "./RoomClient";


function MainPage() {
    const mounted = useRef()
    const [count, setCount] = useState(0)
    const [debugTest, setDebugTest] = useState("---");
    const [rc, setRc] = useState(null);
    const [debugLine, setDebugLine] = useState("this is the debug line... ;)")
    const [state, dispatch] = useContext(Context);
    const socket = useContext(SocketContext);
    const [debugIsEnabled, setDebugIsEnabled] = useState(false);
    const toggleDebug = () => setDebugIsEnabled(previousState => !previousState);
    const testChat = () => dispatch({ type: 'ADD_CHAT_MESSAGE', payload:"Messaggio di prova\n"});
    const scrollViewRef = useRef();

    // ####################################################
    // DYNAMIC SETTINGS
    // ####################################################
    let isEnumerateAudioDevices = false;
    let isEnumerateVideoDevices = false;
    //let isMobileDevice = true;

    useEffect(function componentDidMount() {
        console.log("%c MainPage componetDidMount", "color:green;");
        
        StatusBar.setHidden(true, 'none');

        dispatch({type: 'SET_MEDIASOUPCLIENT', payload: mediasoupClient});
        return function componentWillUnmount() {
            console.log("%c MainPage componetWillUnmount", "color:red")
        }
    }, [])

    useEffect(function componentDidMountAndCompontDidUpdate() {
        console.log("%c MainPage componentDidMountAndCompontDidUpdate", "color:teal;")
    })

    useEffect(function ComponentDidUpdateForCount() {
        console.log("%c MainPage CompontDidUpdateForCount", "color:blue;")
    }, [count])

    useEffect(function runComponentDidUpdate() {
        if (!isComponetMounted()) {
            return
        }
        (function componentDidUpdate() {
            StatusBar.setHidden(true, 'none');
            console.log("%c MainPage CompontDidUpdateForAnyVariable", "color:orange;")
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

    async function createRoomClient() {
        //TEST, REQUEST USB PERMISSION        
        //usb.connect(0, 0)
        //.then((data) => console.log(data))
        //.catch((error) => console.error(error));

        console.log('00 ----> init Socket.IO');
        console.log("[main page] first connect...socket id: " + socket.id);
        console.log('00.1 ----> registerGlobals');
        registerGlobals();
        console.log('01 ----> init Enumerate Devices');
        await initEnumerateAudioDevices();
        await initEnumerateVideoDevices();
        checkMedia();
        console.log('04 ----> Who are you');        
        dispatch({type: 'SET_CONNECTED', payload: true});        
    }

    function switchCamera(){        
        state.localstream.getVideoTracks().forEach((track) => {
            console.log('sc',track);
            track._switchCamera();
        })
    }

    async function initEnumerateAudioDevices() {
        if (isEnumerateAudioDevices) return;
        // allow the audio
        await mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                enumerateAudioDevices(stream);
                dispatch({type: 'SET_IS_AUDIO_ALLOWED', payload: true});
                //isAudioAllowed = true;
            })
            .catch(() => {
                //isAudioAllowed = false;
                dispatch({type: 'SET_IS_AUDIO_ALLOWED', payload: false});
            });
    }

    async function initEnumerateVideoDevices() {
        if (isEnumerateVideoDevices) return;
        // allow the video
        await mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                enumerateVideoDevices(stream);
                dispatch({type: 'SET_IS_VIDEO_ALLOWED', payload: true});
                //isVideoAllowed = true;
            })
            .catch(() => {
                dispatch({type: 'SET_IS_VIDEO_ALLOWED', payload: false});
                //isVideoAllowed = false;
            });
    }

    function enumerateAudioDevices(stream) {
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
        //let qs = new URLSearchParams(window.location.search);
        //let audio = qs.get('audio');
        //let video = qs.get('video');
        let audio = '1';
        let video = '1';
        if (audio) {
            audio = audio.toLowerCase();
            let queryPeerAudio = audio === '1' || audio === 'true';
            if (queryPeerAudio != null) 
            dispatch({type: 'SET_IS_AUDIO_ALLOWED', payload: queryPeerAudio});//isAudioAllowed = queryPeerAudio;
        }
        if (video) {
            video = video.toLowerCase();
            let queryPeerVideo = video === '1' || video === 'true';
            if (queryPeerVideo != null) 
            dispatch({type: 'SET_IS_VIDEO_ALLOWED', payload: queryPeerVideo});//isVideoAllowed = queryPeerVideo;
        }
    }

    const styles = StyleSheet.create({
        textDebugOn: {
            color:"white"
        },
        textDebugOff: {
            color:"#00000000"
        },
        scrollView: {
          backgroundColor: '#FF000000',
          marginLeft: 20,
        },
        debugContainer: {
            height:"80%",
            position: "absolute",
            top:"10%",
            bottom:0,
            flexDirection: "column",
            padding: 2,
            backgroundColor: '#00FF0000',
            zIndex:2, 
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
            bottom:0,
            left:0,
            flexDirection: "row",
            padding: 2,
            backgroundColor: '#00FF0000',
            zIndex:2, 
        },
        mainArea: {
            flex:1,
            flexDirection: "row",
            height: "100%",
            padding: 2,
            backgroundColor: '#000000' 
        },
        remoteStream: {
            width: "100%", 
            height: "100%", 
            backgroundColor: '#000000', 
            zIndex:0
        },
        localStream: { 
            position: "absolute", 
            right: 0, 
            bottom: 0, 
            width: "30%", 
            height: "30%", 
            backgroundColor: '#00000000', 
            zIndex:1 
        },
      });

    return (
        <>
                <View style={styles.headerContainer}>
                    <Button
                        title="Connect"
                        enabled
                        onPress={createRoomClient}
                    />                   
                </View>
                <View style={styles.debugContainer}>                   
                    <Text style={ debugIsEnabled ? styles.textDebugOn : styles.textDebugOff }>
                        {debugTest}
                    </Text>
                    <Text style={ debugIsEnabled ? styles.textDebugOn : styles.textDebugOff }>
                            {state.localstream == "empty" ? "Local Stream ID: empty" : "Local Stream ID: " + state.localstream.toURL()} {"\n"}
                            {state.remotestream == "empty" ? "Remote Stream ID: empty" : "Remote Stream ID: " + state.remotestream.toURL()}
                    </Text>
                    { state.connected ? <RoomClient></RoomClient> : <Text style={styles.textDebugOn}>Room disconnected...</Text> }
                    <ScrollView 
                        style={styles.scrollView}
                        ref={scrollViewRef}
                        onContentSizeChange={(contentWidth, contentHeight)=>{        
                        scrollViewRef.current.scrollToEnd({animated: true});}}>
                        <Text style={styles.textDebugOn}>{state.chat_array}</Text>
                    </ScrollView>
                </View>
                <View style={styles.bottomContainer}>
                    <Button 
                        title="Switch"
                        enabled
                        onPress={switchCamera}
                    />
                    <Switch
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={debugIsEnabled ? "#f5dd4b" : "#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleDebug}
                        value={debugIsEnabled}
                    />
                    <Button 
                        title="TestChat"
                        enabled
                        onPress={testChat}
                    />
                </View>
                <View style={styles.mainArea}>
                <RTCView
                    style={styles.remoteStream}
                    mirror={true}
                    objectFit={'contain'}
                    streamURL={state.remotestream == "empty" ? "" : state.remotestream.toURL()}
                    zOrder={0}>
                </RTCView>
                <RTCView
                    style={styles.localStream}
                    mirror={false}
                    objectFit={'contain'}
                    streamURL={state.localstream == "empty" ? "" : state.localstream.toURL()}
                    zOrder={1}>
                </RTCView>
                </View>
            
        </>
    )
}




export default MainPage;
