import { mediaDevices } from "react-native-webrtc";
import { mediaType, _EVENTS, DEVICES_COUNT } from "../global/constants";
import React, { useEffect, useRef, useState, useContext } from "react";
import { Text, StatusBar } from "react-native";
import Store, { Context } from '../global/Store';
//import { SocketContext } from '../global/socket';
import {setIsAudio, setIsVideo, setIsScreen, getAudioConstraints, getVideoConstraints} from "../global/constraints"
import {getScreenConstraints, getEncoding, getMapKeyByValue, getVideoConstraintsUSB} from "../global/constraints"
import { Skia, useImage } from "@shopify/react-native-skia";
import socketio from "socket.io-client";
let chatMessage = "chatMessage";
let receiveFileInfo = "receiveFileInfo";
let receiveFileDiv = "receiveFileDiv";
let receiveProgress = "receiveProgress";
let sendFileInfo = "sendFileInfo";
let sendFileDiv = "sendFileDiv";
let sendProgress = "sendProgress";
let sendFilePercentage = "sendFilePercentage";
let receiveFilePercentage = "receiveFilePercentage";

function RoomClient() {

    useEffect(function componentDidMount() {
        //console.log("%c [RoomClientComp] componetDidMount", "color:green;");
        StatusBar.setHidden(true, 'none');
        initComp();
        return function componentWillUnmount() {
            console.log("%c [RoomClientComp] componetWillUnmount", "color:red");
            exit(true);

        }
    }, [])

    useEffect(function componentDidMountAndCompontDidUpdate() {
        //console.log("%c [RoomClientComp] componentDidMountAndCompontDidUpdate", "color:teal;")
    })

    useEffect(function runComponentDidUpdate() {
        if (!isComponetMounted()) {
            return
        }
        (function componentDidUpdate() {
            StatusBar.setHidden(true, 'none');
            //console.log("%c [RoomClientComp] CompontDidUpdateForAnyVariable", "color:orange;")
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


    const mounted = useRef();
    const [state, dispatch] = useContext(Context);
    const socket = socketio.connect(state.root_address, { transports: ['websocket'] });


    function initComp() {        
        this.eventListeners = new Map();
        this.peer_info = {
            user_agent: state.user_agent,
            detect_rtc_version: state.detect_rtc_version,
            is_webrtc_supported: state.is_webrtc_supported,
            is_desktop_device: state.is_desktop_device,
            is_mobile_device: state.is_mobile_device,
            is_tablet_device: state.is_tablet_device,
            is_ipad_pro_device: state.is_ipad_pro_device,
            os_name: state.os_name,
            os_version: state.os_version,
            browser_name: state.browser_name,
            browser_version: state.browser_version,
            peer_id: state.peer_id,
            peer_name: state.peer_name,
            peer_audio: state.isAudioAllowed,
            peer_video: state.isVideoAllowed,
            peer_screen: state.isScreenAllowed,
            peer_hand: state.peer_hand,
        }
        this.peer_geo = {};
        this.device = null;
        this.producerTransport = null;
        this.camVideo = false;
        this.camera = 'user';
        this.producerLabel = new Map();
        this.videoProducerId = null;
        this.audioProducerId = null;
        this.consumers = new Map();
        this.producers = new Map();
        this.audioConsumers = new Map();
        this.producerTransport = null;
        this.consumerTransport = null;

        // coherence test
        this.videoConsumerId = "empty";
        this.screenConsumerId = "empty";
        this.guest1ConsumerId = "empty";
        this.guest2ConsumerId = "empty";
        
        this.localVideoStream = null;
        this.remoteVideoStrean = null;
        this.guest1VideoStream = null;
        this.guest2VideoStream = null;
        this.screenVideoStream = null;



        Object.keys(_EVENTS).forEach(
            function (evt) {
                this.eventListeners.set(evt, []);
            }.bind(this),
        );

        socket.request = function request(type, data = {}) {
            return new Promise((resolve, reject) => {
                socket.emit(type, data, (data) => {
                    if (data.error) {
                        reject(data.error);
                    } else {
                        resolve(data);
                    }
                });
            });
        };

        // ####################################################
        // CREATE ROOM AND JOIN
        // ####################################################

        createRoom(state.room_id).then(
            
            async function () {
                
                console.log("[RoomClientComp] internal socketid: " + socket.id);
                
                dispatch({ type: 'SET_PEER_ID', payload: socket.id });
                this.peer_info.peer_id = socket.id;

                let data = {
                    room_id: state.room_id,
                    peer_info: this.peer_info,
                    peer_geo: this.peer_geo,
                };
                
                //console.log(data);
                
                await join(data);
                initSockets();
                //this._isConnected = true;
                //successCallback();
            }.bind(this),
        );
    }

    async function createRoom(room_id) {
        console.log("[RoomClientComp] createroom socket: " + socket);
        console.log("[RoomClientComp] createroom room_id: " + room_id);
        await socket
            .request('createRoom', {
                room_id,
            })
            .catch((err) => {
                console.log('[RoomClientComp] Create room error:', err);
            });
    }

    async function join(data) {
        socket
            .request('join', data)
            .then(
                async function (room) {
                    if (room === 'isLocked') {
                        /*this.event(_EVENTS.roomLock);
                        console.log('00-WARNING ----> Room is Locked, Try to unlock by the password');
                        this.unlockTheRoom();
                        return;*/
                    }
                    console.log("[RoomClientComp] 06b ----> joinrequest");

                    await joinAllowed(room);
                }.bind(this),
            )
            .catch((err) => {
                console.log('[RoomClientComp] Join error:', err);
            });
    }

    async function joinAllowed(room) {
        await handleRoomInfo(room);
        const data = await socket.request('getRouterRtpCapabilities');
        console.log('[RoomClientComp] 06.015 ----> got data');
        this.device = await loadDevice(data);
        //console.log('[RoomClientComp] 07 ----> Get Router Rtp Capabilities codecs: ', this.device.rtpCapabilities.codecs);
        await initTransports(this.device);
        console.log('[RoomClientComp] 07.01 ----> Init Transports done!');
        startLocalMedia();
        //console.log('07.02 ----> Start Local Media done!');
        socket.emit('getProducers');
    }

    

    async function handleRoomInfo(room) {
        let peers = new Map(JSON.parse(room.peers));
        for (let peer of Array.from(peers.keys()).filter((id) => id !== state.peer_id)) {
            let peer_info = peers.get(peer).peer_info;
            // console.log('07 ----> Remote Peer info', peer_info);
            if (!peer_info.peer_video) {
                //await this.setVideoOff(peer_info, true);
            }
        }
        socket.emit('refreshParticipantsCount');
        //console.log('06.2 Participants Count ---->', this.getParticipantsCount());
    }

    async function loadDevice(routerRtpCapabilities) {
        let device;
        try {
            device = new state.mediasoupClient.Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('Browser not supported');
                //this.userLog('error', 'Browser not supported', 'center');
            }
            console.error('Browser not supported: ', error);
            //this.userLog('error', 'Browser not supported: ' + error, 'center');
        }
        await device.load({
            routerRtpCapabilities,
        });
        return device;
    }

    async function initTransports(device) {
        {
            const data = await socket.request('createWebRtcTransport', {
                forceTcp: false,
                rtpCapabilities: device.rtpCapabilities,
            });

            if (data.error) {
                console.error('[RoomClientComp] Create WebRtc Transport for Producer err: ', data.error);
                return;
            }

            this.producerTransport = device.createSendTransport(data);
            this.producerTransport.on(
                'connect',
                async function ({ dtlsParameters }, callback, errback) {
                    socket
                        .request('connectTransport', {
                            dtlsParameters,
                            transport_id: data.id,
                        })
                        .then(callback)
                        .catch(errback);
                }.bind(this),
            );

            this.producerTransport.on(
                'produce',
                async function ({ kind, appData, rtpParameters }, callback, errback) {
                    console.log('Going to produce', {
                        kind: kind,
                        appData: appData,
                        rtpParameters: rtpParameters,
                    });
                    try {
                        const { producer_id } = await socket.request('produce', {
                            producerTransportId: this.producerTransport.id,
                            kind,
                            appData,
                            rtpParameters,
                        });
                        callback({
                            id: producer_id,
                        });
                    } catch (err) {
                        errback(err);
                    }
                }.bind(this),
            );

            this.producerTransport.on(
                'connectionstatechange',
                function (mystate) {
                    switch (mystate) {
                        case 'connecting':
                            break;

                        case 'connected':
                            console.log('[RoomClientComp] Producer Transport connected');
                            break;

                        case 'failed':
                            console.warn('[RoomClientComp] Producer Transport failed');
                            this.producerTransport.close();
                            break;

                        default:
                            break;
                    }
                }.bind(this),
            );
        }

        // ####################################################
        // CONSUMER TRANSPORT
        // ####################################################

        {
            const data = await socket.request('createWebRtcTransport', {
                forceTcp: false,
            });

            if (data.error) {
                console.error('Create WebRtc Transport for Consumer err: ', data.error);
                return;
            }

            this.consumerTransport = device.createRecvTransport(data);
            this.consumerTransport.on(
                'connect',
                function ({ dtlsParameters }, callback, errback) {
                    socket
                        .request('connectTransport', {
                            transport_id: this.consumerTransport.id,
                            dtlsParameters,
                        })
                        .then(callback)
                        .catch(errback);
                }.bind(this),
            );

            this.consumerTransport.on(
                'connectionstatechange',
                async function (state) {
                    switch (state) {
                        case 'connecting':
                            break;

                        case 'connected':
                            console.log('[RoomClientComp] Consumer Transport connected');
                            break;

                        case 'failed':
                            console.warn('[RoomClientComp] Consumer Transport failed');
                            this.consumerTransport.close();
                            break;

                        default:
                            break;
                    }
                }.bind(this),
            );
        }
    }

    // ####################################################
    // TODO DATACHANNEL TRANSPORT
    // ####################################################

    // ####################################################
    // SOCKET ON
    // ####################################################
  
    function initSockets() {
        socket.on(
            'consumerClosed',
            function ({ consumer_id, consumer_kind }) {
                console.log('[RoomClientComp] Closing consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });
                removeConsumer(consumer_id, consumer_kind);
            }.bind(this),
        );

        socket.on(
            'setVideoOff',
            function (data) {
                console.log('[RoomClientComp] Video off:', data);
                //this.setVideoOff(data, true);
            }.bind(this),
        );

        socket.on(
            'removeMe',
            function (data) {
                console.log('[RoomClientComp] Remove me:', data);
                //removeVideoOff(data.peer_id);
                //this.setParticipantsCount(data.peer_counts);
                //adaptAspectRatio(participantsCount);
                //if (isParticipantsListOpen) getRoomParticipants(true);
                /*if (this.getParticipantsCount() == 1) {
                    //setIsPresenter(true);
                    //handleRules(isPresenter);
                    console.log('I am alone in the room, got Presenter Rules');
                }*/
            }.bind(this),
        );

        socket.on(
            'refreshParticipantsCount',
            function (data) {
                console.log('[RoomClientComp] Participants Count:', data);
                //this.setParticipantsCount(data.peer_counts);
                //adaptAspectRatio(participantsCount);
            }.bind(this),
        );

        socket.on(
            'newProducers',
            async function (data) {
                console.log('[RoomClientComp] NewProducers:', data);
                if (data.length > 0) {
                    console.log('[RoomClientComp] New producers', data);
                    for (let { producer_id, peer_name, peer_info, type } of data) {
                        await consume(producer_id, peer_name, peer_info, type);
                    }
                }
            }.bind(this),
        );

        socket.on(
            'message',
            function (data) {
                console.log('[RoomClientComp] New message:', data);
                var localChatArray = data.peer_name + ": " + data.peer_msg + "\n";
                console.log('chatarray: ', localChatArray);
                dispatch({ type: 'ADD_CHAT_MESSAGE',  payload: localChatArray});

                //Univet
                if(state.usbcamera){
                    mediaDevices.showLoopBackCamera(false);
                    mediaDevices.showTextMessage(localChatArray);
                }
                
                //this.showMessage(data);
            }.bind(this),
        );

        socket.on(
            'roomAction',
            function (data) {
                console.log('[RoomClientComp] Room action:', data);
                //this.roomAction(data, false);
            }.bind(this),
        );

        socket.on(
            'roomPassword',
            function (data) {
                console.log('[RoomClientComp] Room password:', data.password);
                //this.roomPassword(data);
            }.bind(this),
        );
        socket.on(
            'roomLobby',
            function (data) {
                console.log('Room lobby:', data);
                //this.roomLobby(data);
            }.bind(this),
        );
        socket.on(
            'peerAction',
            function (data) {
                console.log('[RoomClientComp] Peer action:', data);
                peerAction(data.from_peer_name, data.peer_id, data.action, false, data.broadcast);
            }.bind(this),
        );

        socket.on(
            'updatePeerInfo',
            function (data) {
                console.log('[RoomClientComp] Peer info update:', data);
                //this.updatePeerInfo(data.peer_name, data.peer_id, data.type, data.status, false);
            }.bind(this),
        );

        socket.on(
            'fileInfo',
            function (data) {
                console.log('[RoomClientComp] File info:', data);
                //this.handleFileInfo(data);
            }.bind(this),
        );

        socket.on(
            'file',
            function (data) {
                //this.handleFile(data);
            }.bind(this),
        );

        socket.on(
            'shareVideoAction',
            function (data) {
                //this.shareVideoAction(data);
            }.bind(this),
        );

        socket.on(
            'fileAbort',
            function (data) {
                //this.handleFileAbort(data);
            }.bind(this),
        );

        socket.on(
            'wbCanvasToJson',
            function (data) {
                console.log('[RoomClientComp] Received whiteboard canvas JSON');
                //console.log(data);
                
                // first clear all paths because we receive the entire drawing
                dispatch({type: 'CLEAR_PATHS', payload:""});
                dispatch({type: 'CLEAR_IMAGES', payload:""});
                dispatch({type: 'CLEAR_LINES', payload:""});
                dispatch({type: 'CLEAR_ELLIPSES', payload:""});
                dispatch({type: 'CLEAR_RECTS', payload:""});
                dispatch({type: 'CLEAR_TEXTS', payload:""});

                // decode the strokes
                JsonToSkia(data);

                //JsonToWbCanvas(data);
            }.bind(this),
        );

        socket.on(
            'wbPointer',
            function (data) {
                //console.log('[RoomClientComp] Received whiteboard pointer JSON');
                //console.log(data);
                var serialized = JSON.parse(data);
                // send to the store the x and y values of the pointer position
                dispatch({type: 'POINTER_DATA', payload:serialized});

                
            }.bind(this),
        );

        socket.on(
            'whiteboardAction',
            function (data) {
                console.log('[RoomClientComp] Whiteboard action', data);
                whiteboardAction(data, false);
            }.bind(this),
        );

        socket.on(
            'audioVolume',
            function (data) {
                //this.handleAudioVolume(data);
            }.bind(this),
        );

        socket.on(
            'disconnect',
            function () {
                console.log('[RoomClientComp] on disconnect!');
                //this.exit(true);
            }.bind(this),
        );
    }

    function convertWidth(oldx){
        // the origin canvas is 1200x600

        myx = oldx * state.board_W;
        return myx;
    }


    function whiteboardAction(data, emit){
        if(emit == true)
        {
            console.log("not implemented yet...");
        }
        else
        {
            switch (data.action) {
                case 'bgcolor':
                    //wbCanvasBackgroundColor(data.color);
                    console.log("not implemented yet...");
                    break;
                case 'undo':
                    //wbCanvasUndo();
                    console.log("not implemented yet...");
                    break;
                case 'redo':
                    //wbCanvasRedo();
                    console.log("not implemented yet...");
                    break;
                case 'clear':
                    dispatch({type: 'CLEAR_PATHS', payload:""});
                    dispatch({type: 'CLEAR_IMAGES', payload:""});
                    dispatch({type: 'CLEAR_LINES', payload:""});
                    dispatch({type: 'CLEAR_ELLIPSES', payload:""});
                    dispatch({type: 'CLEAR_RECTS', payload:""});
                    dispatch({type: 'CLEAR_TEXTS', payload:""});
                    break;
                case 'close':
                    //if (wbIsOpen) toggleWhiteboard();
                    console.log("not implemented yet...");
                    break;
                //...
            }
        }
    }

    /**
     * Convert JSON drawing to object compatible with SKIA
     * @param {JSON} data 
     */
    function JsonToSkia(data){
        // the data parameter is a complex json describing a path
        // we can decode it and extract only the values we are
        // interested on
        var serialized = JSON.parse(data);
        // print version so we are sure the object is serialized as json
        // console.log(serialized.version);
        // parse the objects
        serialized.objects.map((object) => (
            DecodeSingleObject(object)
        ));      
    }

    async function DecodeSingleObject(object){
        if(object.type == "path")
        {            
            dispatch({type: 'ADD_PATH', payload:{
                path:FabricPathToSkiaPath(object.path),
                id:"path:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                color:object.stroke,
                width:object.strokeWidth,
            }});    
        }
        else if(object.type == "image"){
            // ensure the object is a string
            var myimage = JSON.stringify(object.src);            

            // check first 30 char in order to log the string but
            // not whole, otherwise is too long
            controlobj = myimage.substring(0,30);
            //console.log("control string 0:" + controlobj);
            var count = (controlobj.match(/jpeg/g) || []).length; // this is the only format with 4 letters instead of 3
            var charstoremove = 23;
            if(count > 0)
                charstoremove = 24;
            
            // take only the part useful, getting rid of descriptor and last "
            myimage = myimage.substring(charstoremove,myimage.length-1);

            // check first 30 char in order to log the string but
            // not whole, otherwise is too long
            controlobj = myimage.substring(0,30);
            //console.log("control string 1:" + controlobj);

            // decode image and transform to a skia image
            myimage2 = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64( myimage ));
            
            dispatch({type: 'ADD_IMAGE', payload:{
                image:myimage2,
                id:"image:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                fit:"contain",
                x:object.left,
                y:object.top,
                width:object.width,
                height:object.height,
                scalex:object.scaleX,
                scaley:object.scaleY,
            }});    
        }
        else if(object.type == "rect")
        {            
            dispatch({type: 'ADD_RECT', payload:{
                x:object.left,
                y:object.top,
                width:object.width,
                height:object.height,
                id:"rect:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                strokeColor:object.stroke,
                strokeWidth:object.strokeWidth,
                fillColor:object.fill,
            }});    
        }
        else if(object.type == "ellipse")
        {            
            dispatch({type: 'ADD_ELLIPSE', payload:{
                x:object.left,
                y:object.top,
                width:object.width,
                height:object.height,
                id:"ellipse:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                strokeColor:object.stroke,
                strokeWidth:object.strokeWidth,
                fillColor:object.fill,
            }});    
        }
        else if(object.type == "line")
        {            
            // determine the slope of the line in order to decide 
            // what vertex is what
            var myx1, myx2, myy1, myy2
            if(object.x1 < 0 && object.y1 < 0) // this case is the following slope: /
            {
                myx1 = object.left;
                myy1 = object.top;
                myx2 = object.left + object.width;
                myy2 = object.top + object.height;
            }
            else // this case is the following slope: \
            {
                myx1 = object.left;
                myy1 = object.top + object.height;
                myx2 = object.left + object.width;
                myy2 = object.top;
            }

            dispatch({type: 'ADD_LINE', payload:{
                x1:myx1, 
                y1:myy1, 
                x2:myx2,
                y2:myy2,
                id:"line:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                strokeColor:object.stroke,
                strokeWidth:object.strokeWidth,                
            }});    
        }
        else if(object.type == "text")
        {            
            dispatch({type: 'ADD_TEXT', payload:{
                x:object.left,
                y:object.top,
                id:"text:" + Date.now() + Math.floor(Math.random() * 100) + 1,
                fillColor:object.fill,
                text:object.text,
            }});    
        }
        else // this is the xtreme case of unknown obejcts
        {
            console.log("object type: " + object.type + " not implemented yet!");
            console.log("object unknown: "+JSON.stringify(object));
        }
    }
    
    /**
     * we receive an object with this format:
     * [["M",322.003,139.747],["Q",322,139.75,321.5,140.25],["Q",321,140.75,319,141.75],["L",274.997,163.753]]
     * we must convert to this format:
     * M 322.003 139.747 Q 322 139.75 321.5 140.25 Q 321 140.75 319 141.75 L 274.997 163.753
     * @param {JSON} data 
     * @returns the converted string
     */
    function FabricPathToSkiaPath(data){

        var newdata = JSON.stringify(data);     // convert to string        
        newdata = newdata.replace(/,/g , ' ');  // substitute comma with spaces
        newdata = newdata.replace(/\[/g , '');  // get rid of open parenthesis        
        newdata = newdata.replace(/\]/g , '');  // get rid of close parenthesis              
        newdata = newdata.replace(/\"/g , '');  // get rid of extra characters
        
        return newdata;
    }

    /**
     * Export paths to an SVG string file
     * @param {*} paths Array of paths
     * @param {*} options option parameter made of width, height, backgroundcolor
     */
    function exportSvgFromPaths(paths,options)
    {    
        /*
        paths: {
          id: number
          color: Color (SKIA definition)
          style: 'stroke' | 'fill'
          path: string;
        }[]

        options: {
          width: number;
          height: number;
          backgroundColor?: string;
        }
        */
       
        return `<svg width="${options.width}" height="${
          options.height
        }" viewBox="0 0 ${options.width} ${
          options.height
        }" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="${options.width}" height="${options.height}" fill="${
          options.backgroundColor || 'white'
        }"/>
        <g>
          ${paths.map((path) => `<path d="${path.path}" stroke="${path.color}" />`)}
          </g>
          </svg>`;
      }



    // ####################################################
    // START LOCAL AUDIO VIDEO MEDIA
    // ####################################################

    function startLocalMedia() {
        /*let localStorageDevices = this.getLocalStorageDevices();
        console.log('08 ----> Get Local Storage Devices before', localStorageDevices);
        if (localStorageDevices) {
            microphoneSelect.selectedIndex = localStorageDevices.audio.index;
            speakerSelect.selectedIndex = localStorageDevices.speaker.index;
            videoSelect.selectedIndex = localStorageDevices.video.index;
            //
            if (DEVICES_COUNT.audio != localStorageDevices.audio.count) {
                console.log('08.1 ----> Audio devices seems changed, use default index 0');
                microphoneSelect.selectedIndex = 0;
                this.setLocalStorageDevices(mediaType.audio, microphoneSelect.selectedIndex, microphoneSelect.value);
            }
            if (DEVICES_COUNT.speaker != localStorageDevices.speaker.count) {
                console.log('08.2 ----> Speaker devices seems changed, use default index 0');
                speakerSelect.selectedIndex = 0;
                this.setLocalStorageDevices(mediaType.speaker, speakerSelect.selectedIndex, speakerSelect.value);
            }
            if (DEVICES_COUNT.video != localStorageDevices.video.count) {
                console.log('08.3 ----> Video devices seems changed, use default index 0');
                videoSelect.selectedIndex = 0;
                this.setLocalStorageDevices(mediaType.video, videoSelect.selectedIndex, videoSelect.value);
            }
            console.log('08.4 ----> Get Local Storage Devices after', this.getLocalStorageDevices());
        }*/
        if (state.isAudioAllowed) {
            console.log('[RoomClientComp] 09 ----> Start audio media');
            produce(mediaType.audio, 0/*microphoneSelect.value*/);
        } else {

            console.log('[RoomClientComp] 09 ----> Audio is off');
        }
        if (state.isVideoAllowed) {
            console.log('[RoomClientComp] 10 ----> Start video media');
            produce(mediaType.video, 0/*videoSelect.value*/);
        } else {

            console.log('[RoomClientComp] 10 ----> Video is off');
            //this.setVideoOff(this.peer_info, false);
            //this.sendVideoOff();
        }
    }

    // ####################################################
    // PRODUCER
    // ####################################################

    async function produce(type, deviceId = null, swapCamera = false) {
        let mediaConstraints = {};
        let audio = false;
        let screen = false;
        switch (type) {
            case mediaType.audio:
                //this.isAudioAllowed = true;
                mediaConstraints = getAudioConstraints(deviceId);
                audio = true;
                break;
            case mediaType.video:
                //this.isVideoAllowed = true;
                if (swapCamera) {
                    mediaConstraints = getCameraConstraints();
                } else {
                    if(state.usbcamera)
                    {
                        console.log('[RoomClientComp] 11,5 ----> USBCAMERA');
                        mediaConstraints = getVideoConstraintsUSB(deviceId);
                    }
                    else
                    {
                        console.log('[RoomClientComp] 11,5 ----> NORMAL CAMERA');
                        mediaConstraints = getVideoConstraints(deviceId);
                    }
                        
                    
                }
                break;
            case mediaType.screen:
                mediaConstraints = getScreenConstraints();
                screen = true;
                break;
            default:
                return;
        }
        if (!this.device.canProduce('video') && !audio) {
            return console.error('Cannot produce video');
        }
        if (this.producerLabel.has(type)) {
            return console.log('[RoomClientComp] Producer already exists for this type ' + type);
        }
        //console.log(`[RoomClientComp] Media contraints ${type}:`, mediaConstraints);
        let stream;
        try {
            stream = screen
                ? await /*navigator.*/mediaDevices.getDisplayMedia(mediaConstraints)
                : await /*navigator.*/mediaDevices.getUserMedia(mediaConstraints);
            //console.log('Supported Constraints', mediaDevices.getSupportedConstraints());
            console.log('[RoomClientComp] once were constratint!')
            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            const params = {
                track,
                appData: {
                    mediaType: type,
                },
            };

            if (!audio && !screen) {
                params.encodings = getEncoding();
                params.codecOptions = {
                    videoGoogleStartBitrate: 1000,
                };
            }

            var myproducer = await this.producerTransport.produce(params);
            this.producers.set(myproducer.id, myproducer);

            let elem, au;
            if (!audio) {
                console.log("[RoomClientComp] localvideostream changed!");
                dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
                this.localVideoStream = stream;
                //state.localVideoStream = stream;
                //this.setMyLocalStream(stream);
                this.videoProducerId = myproducer.id;
                //elem = await this.handleProducer(prod.id, type, stream);
                //if (!screen && !isEnumerateDevices) enumerateVideoDevices(stream);
            } else {
                console.log("[RoomClientComp] localaudiostream changed!");
                dispatch({ type: 'SET_LOCAL_AUDIO_STREAM', payload: stream });
                //this.localAudioStream = stream;
                this.audioProducerId = myproducer.id;
                //au = await this.handleProducer(prod.id, type, stream);
                //if (!isEnumerateDevices) enumerateAudioDevices(stream);
            }

            myproducer.on('trackended', () => {
                closeProducer(type);
            });

            myproducer.on('transportclose', () => {
                console.log('[RoomClientComp] Producer transport close');
                if (!audio) {
                    elem.srcObject.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    elem.parentNode.removeChild(elem);

                    //handleAspectRatio();
                    //console.log('[transportClose] Video-element-count', this.videoMediaContainer.childElementCount);
                } else {
                    au.srcObject.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    au.parentNode.removeChild(au);
                    //console.log('[transportClose] audio-element-count', this.localAudioEl.childElementCount);
                }
                this.producers.delete(myproducer.id);
            });

            myproducer.on('close', () => {
                console.log('[RoomClientComp] Closing producer');
                if (!audio) {
                    elem.srcObject.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    elem.parentNode.removeChild(elem);

                    //handleAspectRatio();
                    //console.log('[closingProducer] Video-element-count', this.videoMediaContainer.childElementCount);
                } else {
                    au.srcObject.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    au.parentNode.removeChild(au);
                    //console.log('[closingProducer] audio-element-count', this.localAudioEl.childElementCount);
                }
                this.producers.delete(myproducer.id);
            });

            this.producerLabel.set(type, myproducer.id);

            switch (type) {
                case mediaType.audio:
                    setIsAudio(state.peer_id, true);
                    //this.event(_EVENTS.startAudio);
                    break;
                case mediaType.video:
                    setIsVideo(true);
                    //this.event(_EVENTS.startVideo);
                    break;
                case mediaType.screen:
                    setIsScreen(true);
                    //this.event(_EVENTS.startScreen);
                    break;
                default:
                    return;
            }
            //this.sound('joined');

            // if present produce the tab audio on screen share
            if (screen && stream.getAudioTracks()[0]) {
                this.produceScreenAudio(stream);
            }
        } catch (err) {
            console.error('Produce error:', err);
        }
    }
    
    async function produceScreenAudio(stream) {
        try {
            this.stopMyAudio();

            if (this.producerLabel.has(mediaType.audio)) {
                return console.log('Producer already exists for this type ' + mediaType.audio);
            }

            const track = stream.getAudioTracks()[0];
            const params = {
                track,
                appData: {
                    mediaType: mediaType.audio,
                },
            };

            const producerSa = await this.producerTransport.produce(params);

            console.log('PRODUCER SCREEN AUDIO', producerSa);

            this.producers.set(producerSa.id, producerSa);

            const sa = await this.handleProducer(producerSa.id, mediaType.audio, stream);

            producerSa.on('trackended', () => {
                this.closeProducer(mediaType.audio);
                this.startMyAudio();
            });

            producerSa.on('transportclose', () => {
                console.log('Producer Screen audio transport close');
                sa.srcObject.getTracks().forEach(function (track) {
                    track.stop();
                });
                sa.parentNode.removeChild(sa);
                console.log('[transportClose] audio-element-count', this.localAudioEl.childElementCount);
                this.producers.delete(producerSa.id);
            });

            producerSa.on('close', () => {
                console.log('Closing Screen audio producer');
                sa.srcObject.getTracks().forEach(function (track) {
                    track.stop();
                });
                sa.parentNode.removeChild(sa);
                console.log('[closingProducer] audio-element-count', this.localAudioEl.childElementCount);
                this.producers.delete(producerSa.id);
            });

            this.producerLabel.set(mediaType.audio, producerSa.id);
        } catch (err) {
            console.error('Produce error:', err);
        }
    }

    function startMyAudio() {
        startAudioButton.click();
        this.setIsAudio(this.peer_id, true);
        this.event(_EVENTS.startAudio);
        setAudioButtonsDisabled(false);
    }

    function stopMyAudio() {
        stopAudioButton.click();
        this.setIsAudio(this.peer_id, false);
        this.event(_EVENTS.stopAudio);
        setAudioButtonsDisabled(true);
    }

    function getAudioConstraints(deviceId) {
        return {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100,
                deviceId: deviceId,
            },
            video: false,
        };
    }

    function getCameraConstraints() {
        this.camera = this.camera == 'user' ? 'environment' : 'user';
        if (this.camera != 'user') this.camVideo = { facingMode: { exact: this.camera } };
        else this.camVideo = true;
        return {
            audio: false,
            video: this.camVideo,
        };
    }

    function getVideoConstraints(deviceId) {
        return {
            audio: false,
            video: {
                width: {
                    min: 640,
                    ideal: 1920,
                    max: 3840,
                },
                height: {
                    min: 480,
                    ideal: 1080,
                    max: 2160,
                },
                deviceId: deviceId,
                aspectRatio: 1.777, // 16:9
                frameRate: {
                    min: 5,
                    ideal: 15,
                    max: 30,
                },
            },
        };
    }

    function getScreenConstraints() {
        return {
            audio: true,
            video: {
                frameRate: {
                    ideal: 15,
                    max: 30,
                },
            },
        };
    }

    function getEncoding() {
        return [
            {
                rid: 'r0',
                maxBitrate: 100000,
                scalabilityMode: 'S1T3',
            },
            {
                rid: 'r1',
                maxBitrate: 300000,
                scalabilityMode: 'S1T3',
            },
            {
                rid: 'r2',
                maxBitrate: 900000,
                scalabilityMode: 'S1T3',
            },
        ];
    }

    function closeThenProduce(type, deviceId, swapCamera = false) {
        this.closeProducer(type);
        this.produce(type, deviceId, swapCamera);
    }

    async function handleProducer(id, type, stream) {
        let elem, vb, ts, d, p, i, au, fs, pm, pb, pn;
        switch (type) {
            case mediaType.video:
            case mediaType.screen:
                let isScreen = type === mediaType.screen;
                this.removeVideoOff(this.peer_id);
                d = document.createElement('div');
                d.className = 'Camera';
                d.id = id + '__video';
                elem = document.createElement('video');
                elem.setAttribute('id', id);
                elem.setAttribute('playsinline', true);
                elem.controls = isVideoControlsOn;
                elem.autoplay = true;
                elem.muted = true;
                elem.volume = 0;
                elem.poster = image.poster;
                elem.style.objectFit = isScreen ? 'contain' : 'var(--videoObjFit)';
                this.isMobileDevice || type === mediaType.screen ? (elem.className = '') : (elem.className = 'mirror');
                vb = document.createElement('div');
                vb.setAttribute('id', this.peer_id + '__vb');
                vb.className = 'videoMenuBar fadein';
                fs = document.createElement('button');
                fs.id = id + '__fullScreen';
                fs.className = html.fullScreen;
                ts = document.createElement('button');
                ts.id = id + '__snapshot';
                ts.className = html.snapshot;
                pn = document.createElement('button');
                pn.id = id + '__pin';
                pn.className = html.pin;
                au = document.createElement('button');
                au.id = this.peer_id + '__audio';
                au.className = this.peer_info.peer_audio ? html.audioOn : html.audioOff;
                p = document.createElement('p');
                p.id = this.peer_id + '__name';
                p.className = html.userName;
                p.innerHTML = this.peer_name + ' (me)';
                i = document.createElement('i');
                i.id = this.peer_id + '__hand';
                i.className = html.userHand;
                pm = document.createElement('div');
                pb = document.createElement('div');
                pm.setAttribute('id', this.peer_id + '_pitchMeter');
                pb.setAttribute('id', this.peer_id + '_pitchBar');
                pm.className = 'speechbar';
                pb.className = 'bar';
                pb.style.height = '1%';
                pm.appendChild(pb);
                BUTTONS.producerVideo.muteAudioButton && vb.appendChild(au);
                BUTTONS.producerVideo.snapShotButton && vb.appendChild(ts);
                BUTTONS.producerVideo.fullScreenButton && this.isVideoFullScreenSupported && vb.appendChild(fs);
                if (!this.isMobileDevice) vb.appendChild(pn);
                d.appendChild(elem);
                d.appendChild(pm);
                d.appendChild(i);
                d.appendChild(p);
                d.appendChild(vb);
                this.videoMediaContainer.appendChild(d);
                this.attachMediaStream(elem, stream, type, 'Producer');
                this.myVideoEl = elem;
                this.isVideoFullScreenSupported && this.handleFS(elem.id, fs.id);
                this.handleDD(elem.id, this.peer_id, true);
                this.handleTS(elem.id, ts.id);
                this.handlePN(elem.id, pn.id, d.id, isScreen);
                this.popupPeerInfo(p.id, this.peer_info);
                this.checkPeerInfoStatus(this.peer_info);
                handleAspectRatio();
                if (!this.isMobileDevice) {
                    this.setTippy(pn.id, 'Toggle Pin', 'top-end');
                    this.setTippy(ts.id, 'Snapshot', 'top-end');
                    this.setTippy(au.id, 'Audio status', 'top-end');
                }
                console.log('[addProducer] Video-element-count', this.videoMediaContainer.childElementCount);
                break;
            case mediaType.audio:
                elem = document.createElement('audio');
                elem.id = id + '__localAudio';
                elem.controls = false;
                elem.autoplay = true;
                elem.muted = true;
                elem.volume = 0;
                this.myAudioEl = elem;
                this.localAudioEl.appendChild(elem);
                this.attachMediaStream(elem, stream, type, 'Producer');
                if (this.isAudioAllowed && !speakerSelect.disabled) {
                    this.attachSinkId(elem, speakerSelect.value);
                }
                console.log('[addProducer] audio-element-count', this.localAudioEl.childElementCount);
                break;
        }
        return elem;
    }

    function pauseProducer(type) {
        if (!this.producerLabel.has(type)) {
            return console.log('There is no producer for this type ' + type);
        }

        let producer_id = this.producerLabel.get(type);
        this.producers.get(producer_id).pause();

        switch (type) {
            case mediaType.audio:
                this.event(_EVENTS.pauseAudio);
                break;
            case mediaType.video:
                this.event(_EVENTS.pauseVideo);
                break;
            case mediaType.screen:
                this.event(_EVENTS.pauseScreen);
                break;
            default:
                return;
        }
    }

    function resumeProducer(type) {
        if (!this.producerLabel.has(type)) {
            return console.log('There is no producer for this type ' + type);
        }

        let producer_id = this.producerLabel.get(type);
        this.producers.get(producer_id).resume();

        switch (type) {
            case mediaType.audio:
                this.event(_EVENTS.resumeAudio);
                break;
            case mediaType.video:
                this.event(_EVENTS.resumeVideo);
                break;
            case mediaType.screen:
                this.event(_EVENTS.resumeScreen);
                break;
            default:
                return;
        }
    }

    function closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            return console.log('[RoomClientComp] There is no producer for this type ' + type);
        }

        let producer_id = this.producerLabel.get(type);

        let data = {
            peer_name: state.peer_name,
            producer_id: producer_id,
            type: type,
            status: false,
        };
        console.log('[RoomClientComp] Close producer', data);

        socket.emit('producerClosed', data);

        this.producers.get(producer_id).close();
        this.producers.delete(producer_id);
        this.producerLabel.delete(type);

        if (type !== mediaType.audio) {
            /*let elem = this.getId(producer_id);
            let d = this.getId(producer_id + '__video');
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            d.parentNode.removeChild(d);*/

            //handleAspectRatio();
            //console.log('[producerClose] Video-element-count', this.videoMediaContainer.childElementCount);
        }

        if (type === mediaType.audio) {
            /*
            let au = this.getId(producer_id + '__localAudio');
            au.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });*/
            //this.localAudioEl.removeChild(au);
            //console.log('[producerClose] Audio-element-count', this.localAudioEl.childElementCount);
        }

        switch (type) {
            case mediaType.audio:
                setIsAudio(state.peer_id, false);
                //this.event(_EVENTS.stopAudio);
                break;
            case mediaType.video:
                setIsVideo(false);
                //this.event(_EVENTS.stopVideo);
                break;
            case mediaType.screen:
                setIsScreen(false);
                //this.event(_EVENTS.stopScreen);
                break;
            default:
                return;
        }

        // this.sound('left');
    }

    ////////////////////////////////////////////////////////////////
    // CONSUMER
    ////////////////////////////////////////////////////////////////
    
    function consume(producer_id, peer_name, peer_info, type) {
        //
        /*if (wbIsOpen && isPresenter) {
            console.log('Update whiteboard canvas to the participants in the room');
            wbCanvasToJson();
        }*/

        console.log("[RoomClientComp] we are in Consume...")
        getConsumeStream(producer_id).then(
            function ({ consumer, stream, kind }) {
                console.log('[RoomClientComp] CONSUMER', consumer);

                this.consumers.set(consumer.id, consumer);

                console.log('[RoomClientComp]  CONSUMER MEDIA TYPE ----> ' + type);

                handleConsumer(consumer.id, type, stream, peer_name, peer_info);

                consumer.on(
                    'trackended',
                    function () {
                        console.log('[RoomClientComp] trackended kind: ', kind);
                        removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );

                consumer.on(
                    'transportclose',
                    function () {
                        console.log('[RoomClientComp] transportclose kind: ', kind);
                        removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );
            }.bind(this),
        );
    }

    async function getConsumeStream(producerId) {
        const { rtpCapabilities } = this.device;
        const data = await socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id,
            producerId,
        });
        console.log("[RoomClientComp]  consume request data: ", data);
        const { id, kind, rtpParameters } = data;
        const codecOptions = {};
        const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions,
        });
        const stream = new MediaStream();
        stream.addTrack(consumer.track);
        console.log("[RoomClientComp]  consume request data 2: ", { consumer, stream, kind });
        return {
            consumer,
            stream,
            kind,
        };
    }

    function handleConsumer(id, type, stream, peer_name, peer_info) {
        let remotePeerId = peer_info.peer_id;

        switch (type) {
            case mediaType.video:
                console.log("[RoomClientComp] remote stream cambiata!");

                // We have to understand if this is our main remote caller or one of the
                // guests that partecipate in the call
                if(this.videoConsumerId == "empty"){ // ok, this is the first remote stream we have
                    dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
                    dispatch({ type: 'SET_REMOTE_STREAM_ID', payload: id });
                    this.localVideoStream = stream;
                    this.videoConsumerId = id;
                }
                else if(this.guest1ConsumerId == "empty"){ // ok, this the first guest
                    dispatch({ type: 'SET_GUEST1_STREAM', payload: stream });
                    dispatch({ type: 'SET_GUEST1_STREAM_ID', payload: id });
                    this.guest1VideoStream = stream;
                    this.guest1ConsumerId = id;
                }
                else{ // otherwise it is the second guest
                    dispatch({ type: 'SET_GUEST2_STREAM', payload: stream });
                    dispatch({ type: 'SET_GUEST2_STREAM_ID', payload: id });
                    this.guest2VideoStream = stream;
                    this.guest2ConsumerId = id;
                }
                break;
            case mediaType.screen:
                //let remotePeerAudio = peer_info.peer_audio;
                //this.removeVideoOff(remotePeerId);
                console.log("[RoomClientComp] remote screen cambiata!");
                console.log("[RoomClientComp] id: " + id);
                console.log("[RoomClientComp] screenstreamid: " + state.screenstreamid);
                dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
                dispatch({ type: 'SET_SCREEN_STREAM_ID', payload: id });
                this.screenConsumerId = id;
                this.screenVideoStream = stream;
                //this.setMyRemoteStream(stream);

                //handleAspectRatio();
                //console.log('[addConsumer] Video-element-count', this.videoMediaContainer.childElementCount);

                break;
            case mediaType.audio:

                console.log('[RoomClientComp] [Add audioConsumers]', this.audioConsumers);
                break;
        }
        return null;
    }

    function cleanConsumers() {
        
        console.log("we are in clean consumers");
        this.consumers.forEach(function(key, val){
            console.log(key + " " + val);
          });
        
        // set stream to null in order to reset the view
        console.log("[RoomClientComp] remote stream NULLIFIED!");
        dispatch({ type: 'SET_REMOTE_STREAM', payload: "empty" });
        dispatch({ type: 'SET_REMOTE_STREAM_ID', payload: "empty" });
        this.videoConsumerId = "empty";

        // set stream to null in order to reset the view
        console.log("[RoomClientComp] remote stream NULLIFIED!");
        dispatch({ type: 'SET_GUEST1_STREAM', payload: "empty" });
        dispatch({ type: 'SET_GUEST1_STREAM_ID', payload: "empty" });
        this.guest1ConsumerId = "empty";

        // set stream to null in order to reset the view
        console.log("[RoomClientComp] remote stream NULLIFIED!");
        dispatch({ type: 'SET_GUEST2_STREAM', payload: "empty" });
        dispatch({ type: 'SET_GUEST2_STREAM_ID', payload: "empty" });
        this.guest2ConsumerId = "empty";

        // set stream to null in order to reset the view
        console.log("[RoomClientComp] screen stream NULLIFIED!");
        dispatch({ type: 'SET_SCREEN_STREAM', payload: "empty" });
        dispatch({ type: 'SET_SCREEN_STREAM_ID', payload: "empty" });
        dispatch({ type: 'SET_LOCAL_STREAM', payload: this.localVideoStream});
        this.screenConsumerId = "empty";
        this.screenVideoStream = null;
        
    }

    function removeConsumer(consumer_id, consumer_kind) {
        console.log('[RoomClientComp] Remove consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });

      

        /*
                let elem = this.getId(consumer_id);
                if (elem) {
                    elem.srcObject.getTracks().forEach(function (track) {
                        track.stop();
                    });
                    elem.parentNode.removeChild(elem);
                }
        */
        if (consumer_kind === 'video') {

            console.log("consumer_id: " + consumer_id);
            console.log("remotestreamid: " + state.remotestreamid);
            console.log("screenstreamid: " + state.screenstreamid);


            // we don't have the information of screen kind, 
            // we have to understand which stream id has been removed
            if(consumer_id == this.videoConsumerId)
            {
                // set stream to null in order to reset the view
                console.log("[RoomClientComp] remote stream NULLIFIED!");
                dispatch({ type: 'SET_REMOTE_STREAM', payload: "empty" });
                dispatch({ type: 'SET_REMOTE_STREAM_ID', payload: "empty" });
                this.videoConsumerId = "empty";
            }

            if(consumer_id == this.guest1ConsumerId)
            {
                // set stream to null in order to reset the view
                console.log("[RoomClientComp] remote stream NULLIFIED!");
                dispatch({ type: 'SET_GUEST1_STREAM', payload: "empty" });
                dispatch({ type: 'SET_GUEST1_STREAM_ID', payload: "empty" });
                this.guest1ConsumerId = "empty";
            }

            if(consumer_id == this.guest2ConsumerId)
            {
                // set stream to null in order to reset the view
                console.log("[RoomClientComp] remote stream NULLIFIED!");
                dispatch({ type: 'SET_GUEST2_STREAM', payload: "empty" });
                dispatch({ type: 'SET_GUEST2_STREAM_ID', payload: "empty" });
                this.guest2ConsumerId = "empty";
            }

            if(consumer_id == this.screenConsumerId)
            {
                // set stream to null in order to reset the view
                console.log("[RoomClientComp] screen stream NULLIFIED!");
                dispatch({ type: 'SET_SCREEN_STREAM', payload: "empty" });
                dispatch({ type: 'SET_SCREEN_STREAM_ID', payload: "empty" });
                dispatch({ type: 'SET_LOCAL_STREAM', payload: this.localVideoStream});
                this.screenConsumerId = "empty";
                this.screenVideoStream = null;
            }

            
            //let d = this.getId(consumer_id + '__video');
            //if (d) d.parentNode.removeChild(d);
            //handleAspectRatio();
            /* console.log(
                 '[removeConsumer - ' + consumer_kind + '] Video-element-count',
                 this.videoMediaContainer.childElementCount,
             );*/
        }

        if (consumer_kind === 'audio') {
            let audioConsumerPlayerId = getMapKeyByValue(this.audioConsumers, consumer_id);
            if (audioConsumerPlayerId) {
                //let inputPv = this.getId(audioConsumerPlayerId);
                //if (inputPv) inputPv.style.display = 'none';
                this.audioConsumers.delete(audioConsumerPlayerId);
                console.log('[RoomClientComp] Remove audio Consumer', {
                    consumer_id: consumer_id,
                    audioConsumerPlayerId: audioConsumerPlayerId,
                    audioConsumers: this.audioConsumers,
                });
            }
        }

        this.consumers.delete(consumer_id);
        //this.sound('left');
    }


// ####################################################
// HANDLE VIDEO OFF
// ####################################################

async function setVideoOff(peer_info, remotePeer = false) {
    let d, vb, i, h, au, sf, sm, sv, ko, p, pm, pb, pv;
    let peer_id = peer_info.peer_id;
    let peer_name = peer_info.peer_name;
    let peer_audio = peer_info.peer_audio;
    this.removeVideoOff(peer_id);
    d = document.createElement('div');
    d.className = 'Camera';
    d.id = peer_id + '__videoOff';
    vb = document.createElement('div');
    vb.setAttribute('id', peer_id + 'vb');
    vb.className = 'videoMenuBar fadein';
    au = document.createElement('button');
    au.id = peer_id + '__audio';
    au.className = peer_audio ? html.audioOn : html.audioOff;
    if (remotePeer) {
        pv = document.createElement('input');
        pv.id = peer_id + '___pVolume';
        pv.type = 'range';
        pv.min = 0;
        pv.max = 100;
        pv.value = 100;
        sf = document.createElement('button');
        sf.id = 'remotePeer___' + peer_id + '___sendFile';
        sf.className = html.sendFile;
        sm = document.createElement('button');
        sm.id = 'remotePeer___' + peer_id + '___sendMsg';
        sm.className = html.sendMsg;
        sv = document.createElement('button');
        sv.id = 'remotePeer___' + peer_id + '___sendVideo';
        sv.className = html.sendVideo;
        ko = document.createElement('button');
        ko.id = 'remotePeer___' + peer_id + '___kickOut';
        ko.className = html.kickOut;
    }
    i = document.createElement('img');
    i.className = 'center pulsate';
    i.id = peer_id + '__img';
    p = document.createElement('p');
    p.id = peer_id + '__name';
    p.className = html.userName;
    p.innerHTML = peer_name + (remotePeer ? '' : ' (me) ');
    h = document.createElement('i');
    h.id = peer_id + '__hand';
    h.className = html.userHand;
    pm = document.createElement('div');
    pb = document.createElement('div');
    pm.setAttribute('id', peer_id + '__pitchMeter');
    pb.setAttribute('id', peer_id + '__pitchBar');
    pm.className = 'speechbar';
    pb.className = 'bar';
    pb.style.height = '1%';
    pm.appendChild(pb);
    if (remotePeer) {
        BUTTONS.videoOff.ejectButton && vb.appendChild(ko);
        BUTTONS.videoOff.sendVideoButton && vb.appendChild(sv);
        BUTTONS.videoOff.sendFileButton && vb.appendChild(sf);
        BUTTONS.videoOff.sendMessageButton && vb.appendChild(sm);
        BUTTONS.videoOff.audioVolumeInput && vb.appendChild(pv);
    }
    vb.appendChild(au);
    d.appendChild(i);
    d.appendChild(p);
    d.appendChild(h);
    d.appendChild(pm);
    d.appendChild(vb);
    this.videoMediaContainer.appendChild(d);
    BUTTONS.videoOff.muteAudioButton && this.handleAU(au.id);
    if (remotePeer) {
        this.handlePV('remotePeer___' + pv.id);
        this.handleSM(sm.id);
        this.handleSF(sf.id);
        this.handleSV(sv.id);
        this.handleKO(ko.id);
    }
    this.handleDD(d.id, peer_id, !remotePeer);
    this.popupPeerInfo(p.id, peer_info);
    this.setVideoAvatarImgName(i.id, peer_name);
    this.getId(i.id).style.display = 'block';
    handleAspectRatio();
    if (isParticipantsListOpen) getRoomParticipants(true);
    if (!this.isMobileDevice && remotePeer) {
        this.setTippy(sm.id, 'Send message', 'top-end');
        this.setTippy(sf.id, 'Send file', 'top-end');
        this.setTippy(sv.id, 'Send video', 'top-end');
        this.setTippy(au.id, 'Mute', 'top-end');
        this.setTippy(pv.id, '🔊 Volume', 'top-end');
        this.setTippy(ko.id, 'Eject', 'top-end');
    }
    console.log('[setVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
}

function removeVideoOff(peer_id) {
    let pvOff = this.getId(peer_id + '__videoOff');
    if (pvOff) {
        pvOff.parentNode.removeChild(pvOff);
        handleAspectRatio();
        console.log('[removeVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
        if (peer_id != this.peer_id) this.sound('left');
    }
}
    // ####################################################
    // SHARE SCREEN ON JOIN
    // ####################################################

    function shareScreen() {
        if (!this.isMobileDevice && (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia)) {
            this.sound('open');
            // startScreenButton.click(); // Chrome - Opera - Edge - Brave
            // handle error: getDisplayMedia requires transient activation from a user gesture on Safari - FireFox
            Swal.fire({
                background: swalBackground,
                position: 'center',
                icon: 'question',
                text: 'Do you want to share your screen?',
                showDenyButton: true,
                confirmButtonText: `Yes`,
                denyButtonText: `No`,
                showClass: {
                    popup: 'animate__animated animate__fadeInDown',
                },
                hideClass: {
                    popup: 'animate__animated animate__fadeOutUp',
                },
            }).then((result) => {
                if (result.isConfirmed) {
                    startScreenButton.click();
                    console.log('11 ----> Screen is on');
                } else {
                    console.log('11 ----> Screen is on');
                }
            });
        } else {
            console.log('11 ----> Screen is off');
        }
    }
    // ####################################################
    // EXIT ROOM
    // ####################################################
    async function exit(offline = false) {

        const data = await socket.request('exitRoom');
        this._isConnected = false;
        this.consumerTransport.close();
        this.producerTransport.close();
        cleanConsumers();
        socket.disconnect();

    }

    function exitRoom() {
        this.sound('eject');
        this.exit();
    }


    // ####################################################
    // HELPERS
    // ####################################################
    function attachMediaStream(elem, stream, type, who) {
        let track;
        switch (type) {
            case mediaType.audio:
                track = stream.getAudioTracks()[0];
                break;
            case mediaType.video:
            case mediaType.screen:
                track = stream.getVideoTracks()[0];
                break;
        }
        const consumerStream = new MediaStream();
        consumerStream.addTrack(track);
        elem.srcObject = consumerStream;
        console.log(who + ' Success attached media ' + type);
    }

    async function attachSinkId(elem, sinkId) {
        if (typeof elem.sinkId !== 'undefined') {
            elem.setSinkId(sinkId)
                .then(() => {
                    console.log(`Success, audio output device attached: ${sinkId}`);
                })
                .catch((err) => {
                    let errorMessage = err;
                    let speakerSelect = this.getId('speakerSelect');
                    if (err.name === 'SecurityError')
                        errorMessage = `You need to use HTTPS for selecting audio output device: ${err}`;
                    console.error('Attach SinkId error: ', errorMessage);
                    this.userLog('error', errorMessage, 'top-end');
                    speakerSelect.selectedIndex = 0;
                    this.setLocalStorageDevices(mediaType.speaker, 0, speakerSelect.value);
                });
        } else {
            let error = `Browser seems doesn't support output device selection.`;
            console.warn(error);
            this.userLog('error', error, 'top-end');
        }
    }

    function event(evt) {
        if (this.eventListeners.has(evt)) {
            this.eventListeners.get(evt).forEach((callback) => callback());
        }
    }

    function on(evt, callback) {
        this.eventListeners.get(evt).push(callback);
    }

    function getCameraConstraints() {
        this.camera = this.camera == 'user' ? 'environment' : 'user';
        if (this.camera != 'user') this.camVideo = { facingMode: { exact: this.camera } };
        else this.camVideo = true;
        return {
            audio: false,
            video: this.camVideo,
        };
    }

    // ####################################################
    // PEER ACTION
    // ####################################################
    function peerAction(from_peer_name, id, action, emit = true, broadcast = false, info = true) {
        const words = id.split('___');
        let mpeer_id = words[0];

        if (emit) {
            let data = {
                from_peer_name: state.peer_name,
                peer_id: mpeer_id,
                action: action,
                broadcast: broadcast,
            };

            //if (!this.thereIsParticipants()) {
            //    if (info) /*this.userLog('info', 'No participants detected', 'top-end');*/console.log("no participants detected");
            //    return;
            //}
            confirmPeerAction(action, data);
        } else {
            switch (action) {
                case 'eject':
                    if (mpeer_id === state.peer_id || broadcast) {
                        //this.sound(action);

                        //this.peerActionProgress(from_peer_name, 'Will eject you from the room', 5000, action);
                    }
                    break;
                case 'mute':
                    if (mpeer_id === state.peer_id || broadcast) {
                        closeProducer(mediaType.audio);
                        //this.updatePeerInfo(this.peer_name, this.peer_id, 'audio', false);
                        /* this.userLog(
                             'warning',
                             from_peer_name + '  ' + _PEER.audioOff + ' has closed yours audio',
                             'top-end',
                             10000,
                         );*/
                    }
                    break;
                case 'hide':
                    if (mpeer_id === state.peer_id || broadcast) {
                        closeProducer(mediaType.video);
                        /*this.userLog(
                            'warning',
                            from_peer_name + '  ' + _PEER.videoOff + ' has closed yours video',
                            'top-end',
                            10000,
                        );*/
                    }
                    break;
                case 'screenStart':
                    break;
                case 'screenStop':
                    break;
                // ...
            }
        }
    }

    function confirmPeerAction(action, data) {
        switch (action) {
            case 'eject':
                let ejectConfirmed = false;
                let whoEject = data.broadcast ? 'All participants except yourself?' : 'current participant?';
                break;
            case 'mute':
            case 'hide':
                let muteHideConfirmed = false;
                let whoMuteHide = data.broadcast ? 'everyone except yourself?' : 'current participant?';
                break;
            case 'screenStart':
            case 'screenStop':
                setTimeout(() => {
                    socket.emit('peerAction', data);
                }, 2000);
                break;
        }
    }

    return (
        <>
            <Text style={{ width: "100%", color: "#00000000", backgroundColor: '#AAAAAA00' }}>
                {state.remotestreamid == "empty" ? "Remote Stream ID: empty" : "Remote Stream ID: " + state.remotestreamid} {"\n"}
                {state.screenstreamid == "empty" ? "Screen Stream ID: empty" : "Screen Stream ID: " + state.screenstreamid}
            </Text>
        </>
    )
}

export default RoomClient