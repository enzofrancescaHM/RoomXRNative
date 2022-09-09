import { mediaDevices } from "react-native-webrtc";
import { mediaType, _EVENTS, DEVICES_COUNT } from "../global/constants";
import React, { useEffect, useRef, useState, useContext } from "react";
import { Text } from "react-native";
import Store, { Context } from '../global/Store';
import { SocketContext } from '../global/socket';
import {setIsAudio, setIsVideo, setIsScreen, getAudioConstraints, getVideoConstraints} from "../global/constraints"
import {getScreenConstraints, getEncoding, getMapKeyByValue} from "../global/constraints"
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
        console.log("%c [RoomClientComp] componetDidMount", "color:green;");
        initComp();
        return function componentWillUnmount() {
            console.log("%c [RoomClientComp] componetWillUnmount", "color:red")
        }
    }, [])

    useEffect(function componentDidMountAndCompontDidUpdate() {
        console.log("%c [RoomClientComp] componentDidMountAndCompontDidUpdate", "color:teal;")
    })

    useEffect(function runComponentDidUpdate() {
        if (!isComponetMounted()) {
            return
        }
        (function componentDidUpdate() {
            console.log("%c [RoomClientComp] CompontDidUpdateForAnyVariable", "color:orange;")
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
    const socket = useContext(SocketContext);


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

    function startLocalMedia() {
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
                async function ({ kind, rtpParameters }, callback, errback) {
                    try {
                        const { producer_id } = await socket.request('produce', {
                            producerTransportId: this.producerTransport.id,
                            kind,
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
                function (state) {
                    switch (state) {
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
                    mediaConstraints = getVideoConstraints(deviceId);
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
            console.error('Cannot produce video');
            return;
        }
        if (this.producerLabel.has(type)) {
            console.log('[RoomClientComp] Producer already exists for this type ' + type);
            return;
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
        } catch (err) {
            console.error('Produce error:', err);
        }
    }

    function closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('[RoomClientComp] There is no producer for this type ' + type);
            return;
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
            /*let d = this.getId(consumer_id + '__video');
            if (d) d.parentNode.removeChild(d);*/
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

    function consume(producer_id, peer_name, peer_info) {
        //
        /*if (wbIsOpen && isPresenter) {
            console.log('Update whiteboard canvas to the participants in the room');
            wbCanvasToJson();
        }*/

        console.log("[RoomClientComp] we are in Consume...")
        getConsumeStream(producer_id).then(
            function ({ consumer, stream, kind }) {
                //console.log('[RoomClientComp] CONSUMER', consumer);

                this.consumers.set(consumer.id, consumer);

                if (kind === 'video') {
                    console.log("[RoomClientComp] we are in Consume...VIDEO")
                    handleConsumer(consumer.id, mediaType.video, stream, peer_name, peer_info);
                    //if (isParticipantsListOpen) getRoomParticipants(true);
                } else {
                    console.log("[RoomClientComp] we are in Consume...AUDIO")
                    handleConsumer(consumer.id, mediaType.audio, stream, peer_name, peer_info);
                }

                consumer.on(
                    'trackended',
                    function () {
                        removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );

                consumer.on(
                    'transportclose',
                    function () {
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
                //let remotePeerAudio = peer_info.peer_audio;
                //this.removeVideoOff(remotePeerId);
                console.log("[RoomClientComp] remote stream cambiata!");
                dispatch({ type: 'SET_REMOTE_STREAM', payload: stream });
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

  

  

    ////////////////////////////////////////////////////////////////
    // SOCKETS
    ////////////////////////////////////////////////////////////////
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
                    for (let { producer_id, peer_name, peer_info } of data) {
                        await consume(producer_id, peer_name, peer_info);
                    }
                }
            }.bind(this),
        );

        socket.on(
            'message',
            function (data) {
                console.log('[RoomClientComp] New message:', data);
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
                //JsonToWbCanvas(data);
            }.bind(this),
        );

        socket.on(
            'whiteboardAction',
            function (data) {
                console.log('[RoomClientComp] Whiteboard action', data);
                //whiteboardAction(data, false);
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

    return (
        <>
            <Text style={{ width: "100%", backgroundColor: '#AAAAAA' }}>
                {state.localstream == "empty" ? "Local Stream ID: empty" : "Local Stream ID: " + state.localstream.toURL()} {"\n"}
                {state.remotestream == "empty" ? "Remote Stream ID: empty" : "Remote Stream ID: " + state.remotestream.toURL()}
            </Text>
        </>
    )
}

export default RoomClient