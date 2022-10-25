import React, { useEffect, useRef, useState, useContext } from "react";
//import Section from "./Section.native";
import { Button, Text, useWindowDimensions, View } from "react-native";
import { RTCView } from "react-native-webrtc";
import RoomClient from "./RoomClient";
//import SocketIOClient from 'socket.io-client'
import * as mediasoupClient from "mediasoup-client";
import { mediaDevices, registerGlobals } from "react-native-webrtc";
import Store, {Context} from '../global/Store';
import {SocketContext} from '../global/socket';

function MainPage() {
    const mounted = useRef()
    const [count, setCount] = useState(0)
    const [debugTest, setDebugTest] = useState("---");
    const [rc, setRc] = useState(null);
    const [debugLine, setDebugLine] = useState("this is the debug line... ;)")
    const [state, dispatch] = useContext(Context);
    const socket = useContext(SocketContext);

    // ####################################################
    // DYNAMIC SETTINGS
    // ####################################################
    let isEnumerateAudioDevices = false;
    let isEnumerateVideoDevices = false;
    let isMobileDevice = true;

    useEffect(function componentDidMount() {
        console.log("%c MainPage componetDidMount", "color:green;");

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

        console.log('00 ----> init Socket.IO');
        //dispatch({type: 'SET_SOCKET', payload: SocketIOClient("https://roomxr.eu:5001", { transports: ['websocket'] })});
        console.log("[main page] first connect...socket id: " + socket.id);
        console.log('00.1 ----> registerGlobals');
        registerGlobals();
        console.log('01 ----> init Enumerate Devices');
        await initEnumerateAudioDevices();
        await initEnumerateVideoDevices();
        checkMedia();
        console.log('04 ----> Who are you');
        //getPeerInfo();
        dispatch({type: 'SET_CONNECTED', payload: true});
        //joinRoom(state.peer_name, state.room_id);

    }

    function switchCamera(){
        
        state.localstream.getVideoTracks().forEach((track) => {
            console.log('sc',track);
            track._switchCamera();
        })
    }

    function setParticipantsCount(newval) {
        participantsCount = newval;
    }

    function setProducer(newval) {
        producer = newval;
    }

    function getProducer() {
        return producer;
    }

    function getParticipantsCount() {
        return participantsCount;
    }

    function setMyStream(newval) {
        //setMyLocalStream(newval);
        dispatch({type: 'SET_LOCAL_STREAM', payload: newval});
    }

    function setYourStream(newval) {
        //setMyRemoteStream(newval);
        dispatch({type: 'SET_REMOTE_STREAM', payload: newval});
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
        var dText = "...";
        mediaDevices
            .enumerateDevices()
            .then((devices) =>
                devices.forEach((device) => {
                    let el = null;
                    console.log("device: ", device);
                    dText = dText + JSON.stringify(device);
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

    function getPeerInfo() {

        let mypeer_info = {
            user_agent: "android",
            detect_rtc_version: '1.4.1'/*DetectRTC.version*/,
            is_webrtc_supported: true/*DetectRTC.isWebRTCSupported*/,
            is_desktop_device: false,
            is_mobile_device: isMobileDevice,
            is_tablet_device: false,
            is_ipad_pro_device: false,
            os_name: 'Windows'/*DetectRTC.osName*/,
            os_version: '10'/*DetectRTC.osVersion*/,
            browser_name: 'Chrome'/*DetectRTC.browser.name*/,
            browser_version: '104'/*DetectRTC.browser.version*/,
            peer_id: null,
            peer_name: state.peer_name,
            peer_audio: state.isAudioAllowed,
            peer_video: state.isVideoAllowed,
            peer_screen: state.isScreenAllowed,
            peer_hand: false,
        };
      
        return mypeer_info;
    
    }

    function joinRoom(peer_name, room_id) {
        if (rc && rc.isConnected()) {
            console.log('Already connected to a room');
        } else {
            console.log('05 ----> join Room ' + room_id);
            var cicciolo = new RoomClient(
                mediasoupClient,
                socket,
                state.room_id,
                state.peer_name,
                state.peer_geo,
                getPeerInfo(),
                state.isAudioAllowed,
                state.isVideoAllowed,
                state.isScreenAllowed,
                roomIsReady,
                getProducer,
                getParticipantsCount,
                setProducer,
                setParticipantsCount,
                setMyStream,
                setYourStream
            );
            handleRoomClientEvents(cicciolo);
            setRc(cicciolo);

        }
    }

    function roomIsReady() {

    }


    // ####################################################
    // ROOM CLIENT EVENT LISTNERS
    // ####################################################

    function handleRoomClientEvents(newval) {/*
        newval.on(RoomClient.EVENTS.startRec, () => {
            console.log('Room Client start recoding');
            setDebugLine("Room Client start recoding");
            //startRecordingTimer();
        });
        newval.on(RoomClient.EVENTS.pauseRec, () => {
            console.log('Room Client pause recoding');
            setDebugLine("Room Client pause recoding");
        });
        newval.on(RoomClient.EVENTS.resumeRec, () => {
            console.log('Room Client resume recoding');
            setDebugLine("Room Client resume recoding");
        });
        newval.on(RoomClient.EVENTS.stopRec, () => {
            console.log('Room Client stop recoding');
            setDebugLine("Room Client stop recoding");
        });
        newval.on(RoomClient.EVENTS.raiseHand, () => {
            console.log('Room Client raise hand');
            setDebugLine("'Room Client raise hand");
        });
        newval.on(RoomClient.EVENTS.lowerHand, () => {
            console.log('Room Client lower hand');
            setDebugLine("Room Client lower hand");
        });
        newval.on(RoomClient.EVENTS.startAudio, () => {
            console.log('Room Client start audio');
            setDebugLine("Room Client start audio");
        });
        newval.on(RoomClient.EVENTS.pauseAudio, () => {
            console.log('Room Client pause audio');
            setDebugLine("Room Client pause audio");
        });
        newval.on(RoomClient.EVENTS.resumeAudio, () => {
            console.log('Room Client resume audio');
            setDebugLine("Room Client resume audio");
        });
        newval.on(RoomClient.EVENTS.stopAudio, () => {
            console.log('Room Client stop audio');
            setDebugLine("Room Client stop audio");
        });
        newval.on(RoomClient.EVENTS.startVideo, () => {
            console.log('Room Client start video');
            setDebugLine("Room Client start video");
        });
        newval.on(RoomClient.EVENTS.pauseVideo, () => {
            console.log('Room Client pause video');
            setDebugLine("Room Client pause video");
        });
        newval.on(RoomClient.EVENTS.resumeVideo, () => {
            console.log('Room Client resume video');
            setDebugLine("Room Client resume video");
        });
        newval.on(RoomClient.EVENTS.stopVideo, () => {
            console.log('Room Client stop video');
            setDebugLine("Room Client start recoding");
        });
        newval.on(RoomClient.EVENTS.startScreen, () => {
            console.log('Room Client start screen');
            setDebugLine("Room Client stop video");
        });
        newval.on(RoomClient.EVENTS.pauseScreen, () => {
            console.log('Room Client pause screen');
            setDebugLine("Room Client pause screen");
        });
        newval.on(RoomClient.EVENTS.resumeScreen, () => {
            console.log('Room Client resume screen');
            setDebugLine("Room Client resume screen");
        });
        newval.on(RoomClient.EVENTS.stopScreen, () => {
            console.log('Room Client stop screen');
            setDebugLine("Room Client stop screen");
        });
        newval.on(RoomClient.EVENTS.roomLock, () => {
            console.log('Room Client lock room');
            setDebugLine("Room Client lock room");
            isRoomLocked = true;
        });
        newval.on(RoomClient.EVENTS.roomUnlock, () => {
            console.log('Room Client unlock room');
            setDebugLine("Room Client unlock room");
            isRoomLocked = false;
        });
        newval.on(RoomClient.EVENTS.exitRoom, () => {
            console.log('Room Client leave room');
            setDebugLine("Room Client leave room");
        });*/
    }

    return (
        <>
            {/*<Section title="Debug">*/}
                <View style={{
                    flexDirection: "row",
                    width:"100%",
                    //height: 250,
                    padding: 2,
                    backgroundColor: '#00FF00' 
                }}>
                    <Button style={{width:"100%", height:30}}
                        title="GO"
                        enabled
                        onPress={createRoomClient}
                    />
                    <Button style={{width:"100%", height:30}}
                        title="()"
                        enabled
                        onPress={switchCamera}
                    />
                    {/*<Text style={{width:"100%", backgroundColor: '#AAAAAA' }}>
                        {rc == null ? "Room Id: empty" : "Room Id: " + rc.room_id} - {"Debug Messages: " + debugLine} {"\n"}
                        {state.localstream == "empty" ? "Local Stream ID: empty" : "Local Stream ID: " + state.localstream.toURL()} {"\n"}
                        {state.remotestream == "empty" ? "Remote Stream ID: empty" : "Remote Stream ID: " + state.remotestream.toURL()}
                    
                    </Text>*/}
                    <Text>{debugTest}</Text>
                    { state.connected ? <RoomClient></RoomClient> : <Text>not connected yet...</Text> }
                </View>
                <View style={{
                    flexDirection: "row",
                    height: 250,
                    padding: 10,
                    backgroundColor: '#0000FF' 
                }}>
                <RTCView
                    style={{ width: "50%", height: 250, backgroundColor: '#00FF00' }}
                    mirror={true}
                    objectFit={'contain'}
                    streamURL={state.localstream == "empty" ? "" : state.localstream.toURL()}
                    zOrder={0}>
                </RTCView>
                <RTCView
                    style={{ width: "50%", height: 250, backgroundColor: '#ff0000' }}
                    mirror={false}
                    objectFit={'contain'}
                    streamURL={state.remotestream == "empty" ? "" : state.remotestream.toURL()}
                    zOrder={0}>
                </RTCView>
                </View>

           {/*  </Section> */}
           
        </>
    )
}




export default MainPage;
