// react realated imports
import React, { useEffect, useRef, useState, useContext } from "react";
import { Button, Switch,Text, useWindowDimensions, View, StatusBar } from "react-native";
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

    return (
        <>
                <View style={{
                    height:40,
                    //flex: 0.1,
                    position: "absolute",
                    top:0,
                    left:0,
                    flexDirection: "row",
                    padding: 0,
                    backgroundColor: '#00FF0000',
                    zIndex:2, 
                }}>
                    <Button style={{width:"100%", height:"100%"}}
                        title="Connect"
                        enabled
                        onPress={createRoomClient}
                    />                   
                </View>
                <View style={{
                    height:"30%",
                    //flex: 0.1,
                    position: "absolute",
                    top:"10%",
                    bottom:0,
                    //flexDirection: "row",
                    padding: 2,
                    backgroundColor: '#00FF0000',
                    zIndex:2, 
                }}>                   
                    <Text style={debugIsEnabled?{width:"100%", height:"100%", color:"white"}:{color:"#00000000"}}>{debugTest}</Text>
                    <Text style={debugIsEnabled?{width:"100%", height:"100%", color:"white"}:{color:"#00000000"}}>
                            {state.localstream == "empty" ? "Local Stream ID: empty" : "Local Stream ID: " + state.localstream.toURL()} {"\n"}
                            {state.remotestream == "empty" ? "Remote Stream ID: empty" : "Remote Stream ID: " + state.remotestream.toURL()}
                    </Text>
                    { state.connected ? <RoomClient></RoomClient> : <Text style={{width:"100%", height:"100%", color:"white"}}>Room disconnected...</Text> }
                    <Text style={{width:"100%", height:"100%", color:"white"}}>{state.chat_array}</Text>
                </View>
                <View style={{
                    height:40,
                    //flex: 0.1,
                    position: "absolute",
                    bottom:0,
                    left:0,
                    flexDirection: "row",
                    padding: 2,
                    backgroundColor: '#00FF0000',
                    zIndex:2, 
                }}>
                    <Button style={{width:"100%", height:"100%"}}
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
                    </View>
                <View style={{
                    flex:1,
                    flexDirection: "row",
                    height: "100%",
                    padding: 2,
                    backgroundColor: '#000000' 
                }}>
                <RTCView
                    style={{ width: "100%", height: "100%", backgroundColor: '#000000', zIndex:0 }}
                    mirror={true}
                    objectFit={'contain'}
                    streamURL={state.remotestream == "empty" ? "" : state.remotestream.toURL()}
                    zOrder={0}>
                </RTCView>
                <RTCView
                    style={{ position: "absolute", right: 0, bottom: 0, width: "30%", height: "30%", backgroundColor: '#00000000', zIndex:1 }}
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
