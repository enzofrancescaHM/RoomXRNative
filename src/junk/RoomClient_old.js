import { isPresenter, setIsPresenter, handleRules } from "./Rules";
import { mediaDevices } from "react-native-webrtc";
import {mediaType, _EVENTS, DEVICES_COUNT} from "./constants";
import SocketIOClient from 'socket.io-client'
//import { useContext } from "react";
//import {Context} from './Store';

let chatMessage = "chatMessage";
let receiveFileInfo = "receiveFileInfo";
let receiveFileDiv = "receiveFileDiv";
let receiveProgress = "receiveProgress";
let sendFileInfo = "sendFileInfo";
let sendFileDiv = "sendFileDiv";
let sendProgress = "sendProgress";
let sendFilePercentage = "sendFilePercentage";
let receiveFilePercentage = "receiveFilePercentage";
//const [state, dispatch] = useContext(Context);



class RoomClient {
    constructor(
        mediasoupClient,
        socket,
        room_id,
        peer_name,
        peer_geo,
        peer_info,
        isAudioAllowed,
        isVideoAllowed,
        isScreenAllowed,
        successCallback,
        getProducer,
        getParticipantsCount,
        setProducer,
        setParticipantsCount,
        setMyLocalStream,
        setMyRemoteStream
    ) {
        this.mediasoupClient = mediasoupClient;

        this.setParticipantsCount = setParticipantsCount;
        this.getParticipantsCount = getParticipantsCount;
        this.setProducer = setProducer;
        this.getProducer = getProducer;
        this.setMyLocalStream = setMyLocalStream;
        this.setMyRemoteStream = setMyRemoteStream;


        this.socket = socket;
        this.room_id = room_id;
        this.peer_id = null
        this.peer_name = peer_name;
        this.peer_geo = peer_geo;
        this.peer_info = peer_info;

        //console.log(peer_info);

        this.isAudioAllowed = isAudioAllowed;
        this.isVideoAllowed = isVideoAllowed;
        this.isScreenAllowed = isScreenAllowed;
        this.producerTransport = null;
        this.consumerTransport = null;
        this.device = null;

        this.isMobileDevice = true/*DetectRTC.isMobileDevice*/;

        //this.isMySettingsOpen = false;

        this._isConnected = false;
        //this.isVideoOnFullScreen = false;
        //this.isChatOpen = false;
        //this.isChatEmojiOpen = false;
        //this.isChatBgTransparent = false;
        this.camVideo = false;
        this.camera = 'user';

        //this.chatMessages = [];
        this.leftMsgAvatar = null;
        this.rightMsgAvatar = null;

        this.localVideoStream = "empty";
        this.localScreenStream = null;
        this.localAudioStream = null;
        this.mediaRecorder = null;
        this.recScreenStream = null;
        this._isRecording = false;

        this.RoomPassword = null;

        // file transfer settings
        this.fileToSend = null;
        this.fileReader = null;
        this.receiveBuffer = [];
        this.receivedSize = 0;
        this.incomingFileInfo = null;
        this.incomingFileData = null;
        this.sendInProgress = false;
        this.receiveInProgress = false;
        this.fileSharingInput = '*';
        this.chunkSize = 1024 * 16; // 16kb/s

        this.myVideoEl = null;
        this.myAudioEl = null;
        this.debug = false;

        this.videoProducerId = null;
        this.audioProducerId = null;
        this.audioConsumers = new Map();

        this.consumers = new Map();
        this.producers = new Map();
        this.producerLabel = new Map();
        this.eventListeners = new Map();

        console.log('06 ----> Load Mediasoup Client v', mediasoupClient.version);


                console.log("first internal socket id: " + socket.id); // x8WIv7-mJelg7on_ALbx


                Object.keys(_EVENTS).forEach(
                    function (evt) {
                        this.eventListeners.set(evt, []);
                    }.bind(this),
                );
                  
                this.socket.request = function request(type, data = {}) {
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

                this.createRoom(this.room_id).then(
                    async function () {
                        let data = {
                            room_id: this.room_id,
                            peer_info: this.peer_info,
                            peer_geo: this.peer_geo,
                        };
                        console.log("internal socketid: " + this.socket.id);
                        console.log(data);
                    //        this.peer_info.peer_id = this.socket.id;
                    //        this.peer_id = this.socket.id;
                        await this.join(data);
                        this.initSockets();
                        this._isConnected = true;
                        successCallback();
                    }.bind(this),
                );


       
              
        
       

       
    }

    // ####################################################
    // GET STARTED
    // ####################################################

    async createRoom(room_id) {
        console.log("socket: " + this.socket);
        console.log("room_id: " + room_id);
        await this.socket
            .request('createRoom', {
                room_id,
            })
            .catch((err) => {
                console.log('Create room error:', err);
            });
    }

    async join(data) {
        this.socket
            .request('join', data)
            .then(
                async function (room) {
                    if (room === 'isLocked') {
                        this.event(_EVENTS.roomLock);
                        console.log('00-WARNING ----> Room is Locked, Try to unlock by the password');
                        this.unlockTheRoom();
                        return;
                    }
                    console.log("06b ----> joinrequest");
                    
                    await this.joinAllowed(room);
                }.bind(this),
            )
            .catch((err) => {
                console.log('Join error:', err);
            });
    }

    async joinAllowed(room) {
        await this.handleRoomInfo(room);
        const data = await this.socket.request('getRouterRtpCapabilities');
        console.log('06.015 ----> got data');
        this.device = await this.loadDevice(data);
        console.log('07 ----> Get Router Rtp Capabilities codecs: ', this.device.rtpCapabilities.codecs);
        await this.initTransports(this.device);
        console.log('07.01 ----> Init Transports done!');
        this.startLocalMedia();
        console.log('07.02 ----> Start Local Media done!');
        this.socket.emit('getProducers');
    }

    async handleRoomInfo(room) {
        let peers = new Map(JSON.parse(room.peers));
        //this.setParticipantsCount(peers.size);
        //setIsPresenter(this.getParticipantsCount() > 1 ? false : true);
        handleRules(isPresenter);
        //adaptAspectRatio(participantsCount);
        for (let peer of Array.from(peers.keys()).filter((id) => id !== this.peer_id)) {
            let peer_info = peers.get(peer).peer_info;
            // console.log('07 ----> Remote Peer info', peer_info);
            if (!peer_info.peer_video) {
                await this.setVideoOff(peer_info, true);
            }
        }
        this.refreshParticipantsCount();
        //console.log('06.2 Participants Count ---->', this.getParticipantsCount());
    }

    async loadDevice(routerRtpCapabilities) {
        let device;
        try {
            device = new this.mediasoupClient.Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('Browser not supported');
                this.userLog('error', 'Browser not supported', 'center');
            }
            console.error('Browser not supported: ', error);
            this.userLog('error', 'Browser not supported: ' + error, 'center');
        }
        await device.load({
            routerRtpCapabilities,
        });
        return device;
    }

    // ####################################################
    // PRODUCER TRANSPORT
    // ####################################################

    async initTransports(device) {
        {
            const data = await this.socket.request('createWebRtcTransport', {
                forceTcp: false,
                rtpCapabilities: device.rtpCapabilities,
            });

            if (data.error) {
                console.error('Create WebRtc Transport for Producer err: ', data.error);
                return;
            }

            this.producerTransport = device.createSendTransport(data);
            this.producerTransport.on(
                'connect',
                async function ({ dtlsParameters }, callback, errback) {
                    this.socket
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
                        const { producer_id } = await this.socket.request('produce', {
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
                            console.log('Producer Transport connected');
                            break;

                        case 'failed':
                            console.warn('Producer Transport failed');
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
            const data = await this.socket.request('createWebRtcTransport', {
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
                    this.socket
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
                            console.log('Consumer Transport connected');
                            break;

                        case 'failed':
                            console.warn('Consumer Transport failed');
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
    // SOCKET ON
    // ####################################################

    initSockets() {
        this.socket.on(
            'consumerClosed',
            function ({ consumer_id, consumer_kind }) {
                console.log('Closing consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });
                this.removeConsumer(consumer_id, consumer_kind);
            }.bind(this),
        );

        this.socket.on(
            'setVideoOff',
            function (data) {
                console.log('Video off:', data);
                this.setVideoOff(data, true);
            }.bind(this),
        );

        this.socket.on(
            'removeMe',
            function (data) {
                console.log('Remove me:', data);
                this.removeVideoOff(data.peer_id);
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

        this.socket.on(
            'refreshParticipantsCount',
            function (data) {
                console.log('Participants Count:', data);
                //this.setParticipantsCount(data.peer_counts);
                //adaptAspectRatio(participantsCount);
            }.bind(this),
        );

        this.socket.on(
            'newProducers',
            async function (data) {
                if (data.length > 0) {
                    console.log('New producers', data);
                    for (let { producer_id, peer_name, peer_info } of data) {
                        await this.consume(producer_id, peer_name, peer_info);
                    }
                }
            }.bind(this),
        );

        this.socket.on(
            'message',
            function (data) {
                console.log('New message:', data);
                this.showMessage(data);
            }.bind(this),
        );

        this.socket.on(
            'roomAction',
            function (data) {
                console.log('Room action:', data);
                this.roomAction(data, false);
            }.bind(this),
        );

        this.socket.on(
            'roomPassword',
            function (data) {
                console.log('Room password:', data.password);
                this.roomPassword(data);
            }.bind(this),
        );

        this.socket.on(
            'peerAction',
            function (data) {
                console.log('Peer action:', data);
                this.peerAction(data.from_peer_name, data.peer_id, data.action, false, data.broadcast);
            }.bind(this),
        );

        this.socket.on(
            'updatePeerInfo',
            function (data) {
                console.log('Peer info update:', data);
                this.updatePeerInfo(data.peer_name, data.peer_id, data.type, data.status, false);
            }.bind(this),
        );

        this.socket.on(
            'fileInfo',
            function (data) {
                console.log('File info:', data);
                this.handleFileInfo(data);
            }.bind(this),
        );

        this.socket.on(
            'file',
            function (data) {
                this.handleFile(data);
            }.bind(this),
        );

        this.socket.on(
            'shareVideoAction',
            function (data) {
                this.shareVideoAction(data);
            }.bind(this),
        );

        this.socket.on(
            'fileAbort',
            function (data) {
                this.handleFileAbort(data);
            }.bind(this),
        );

        this.socket.on(
            'wbCanvasToJson',
            function (data) {
                console.log('Received whiteboard canvas JSON');
                //JsonToWbCanvas(data);
            }.bind(this),
        );

        this.socket.on(
            'whiteboardAction',
            function (data) {
                console.log('Whiteboard action', data);
                //whiteboardAction(data, false);
            }.bind(this),
        );

        this.socket.on(
            'audioVolume',
            function (data) {
                //this.handleAudioVolume(data);
            }.bind(this),
        );

        this.socket.on(
            'disconnect',
            function () {
                this.exit(true);
            }.bind(this),
        );
    }

    // ####################################################
    // START LOCAL AUDIO VIDEO MEDIA
    // ####################################################

    startLocalMedia() {

        if (this.isAudioAllowed) {
            console.log('09 ----> Start audio media');
            this.produce(mediaType.audio, 0/*microphoneSelect.value*/);
        } else {
            //setColor(startAudioButton, 'red');
            console.log('09 ----> Audio is off');
        }
        if (this.isVideoAllowed) {
            console.log('10 ----> Start video media');
            this.produce(mediaType.video, 0/*videoSelect.value*/);
        } else {
            //setColor(startVideoButton, 'red');
            console.log('10 ----> Video is off');
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }

    }

    // ####################################################
    // PRODUCER
    // ####################################################

    async produce(type, deviceId = null, swapCamera = false) {
        let mediaConstraints = {};
        let audio = false;
        let screen = false;
        switch (type) {
            case mediaType.audio:
                this.isAudioAllowed = true;
                mediaConstraints = this.getAudioConstraints(deviceId);
                audio = true;
                break;
            case mediaType.video:
                this.isVideoAllowed = true;
                if (swapCamera) {
                    mediaConstraints = this.getCameraConstraints();
                } else {
                    mediaConstraints = this.getVideoConstraints(deviceId);
                }
                break;
            case mediaType.screen:
                mediaConstraints = this.getScreenConstraints();
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
            console.log('Producer already exists for this type ' + type);
            return;
        }
        console.log(`Media contraints ${type}:`, mediaConstraints);
        let stream;
        try {
            stream = screen
                ? await /*navigator.*/mediaDevices.getDisplayMedia(mediaConstraints)
                : await /*navigator.*/mediaDevices.getUserMedia(mediaConstraints);
            //console.log('Supported Constraints', mediaDevices.getSupportedConstraints());
            console.log('once were constratint!')
            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            const params = {
                track,
            };

            if (!audio && !screen) {
                params.encodings = this.getEncoding();
                params.codecOptions = {
                    videoGoogleStartBitrate: 1000,
                };
            }
            console.log("01");
            var myproducer = await this.producerTransport.produce(params);
            console.log("02")
            this.setProducer(myproducer);
            console.log("03");
            let prod = this.getProducer();

            console.log('PRODUCER', prod);

            this.producers.set(prod.id, prod);

            let elem, au;
            if (!audio) {
                console.log("localvideostream cambiata!");
                this.localVideoStream = stream;
                this.setMyLocalStream(stream);
                this.videoProducerId = prod.id;
                elem = await this.handleProducer(prod.id, type, stream);
                //if (!screen && !isEnumerateDevices) enumerateVideoDevices(stream);
            } else {
                console.log("localaudiostream cambiata!");
                this.localAudioStream = stream;
                this.audioProducerId = prod.id;
                au = await this.handleProducer(prod.id, type, stream);
                //if (!isEnumerateDevices) enumerateAudioDevices(stream);
            }

            prod.on('trackended', () => {
                this.closeProducer(type);
            });

            prod.on('transportclose', () => {
                console.log('Producer transport close');
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
                this.producers.delete(prod.id);
            });

            prod.on('close', () => {
                console.log('Closing producer');
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
                this.producers.delete(prod.id);
            });

            this.producerLabel.set(type, prod.id);

            switch (type) {
                case mediaType.audio:
                    this.setIsAudio(this.peer_id, true);
                    this.event(_EVENTS.startAudio);
                    break;
                case mediaType.video:
                    this.setIsVideo(true);
                    this.event(_EVENTS.startVideo);
                    break;
                case mediaType.screen:
                    this.setIsScreen(true);
                    this.event(_EVENTS.startScreen);
                    break;
                default:
                    return;
            }
            //this.sound('joined');
        } catch (err) {
            console.error('Produce error:', err);
        }
    }

    getAudioConstraints(deviceId) {
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

    getCameraConstraints() {
        this.camera = this.camera == 'user' ? 'environment' : 'user';
        if (this.camera != 'user') this.camVideo = { facingMode: { exact: this.camera } };
        else this.camVideo = true;
        return {
            audio: false,
            video: this.camVideo,
        };
    }

    getVideoConstraints(deviceId) {
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

    getScreenConstraints() {
        return {
            audio: false,
            video: {
                frameRate: {
                    ideal: 15,
                    max: 30,
                },
            },
        };
    }

    getEncoding() {
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

    closeThenProduce(type, deviceId, swapCamera = false) {
        this.closeProducer(type);
        this.produce(type, deviceId, swapCamera);
    }

    async handleProducer(id, type, stream) {
        let elem, vb, ts, d, p, i, au, fs, pm, pb;
        switch (type) {
            case mediaType.video:
            case mediaType.screen:
                this.removeVideoOff(this.peer_id);

                this.checkPeerInfoStatus(this.peer_info);
                /*
                if (this.getParticipantsCount() <= 3 && type === mediaType.screen) {
                    this.peerAction('me', this.peer_id + '___sStart', 'screenStart', true, true, false);
                    //setAspectRatio(2); // 16:9
                } else {
                    this.peerAction('me', this.peer_id + '___sStop', 'screenStop', true, true, false);
                    //handleAspectRatio();
                }
                */
                //console.log('[addProducer] Video-element-count', this.videoMediaContainer.childElementCount);
                break;
            case mediaType.audio:
                //console.log('[addProducer] audio-element-count', this.localAudioEl.childElementCount);
                break;
        }
        return elem;
    }

    pauseProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
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

    resumeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
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

    closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
        }

        let producer_id = this.producerLabel.get(type);

        let data = {
            peer_name: this.peer_name,
            producer_id: producer_id,
            type: type,
            status: false,
        };
        console.log('Close producer', data);

        this.socket.emit('producerClosed', data);

        this.producers.get(producer_id).close();
        this.producers.delete(producer_id);
        this.producerLabel.delete(type);

        if (type !== mediaType.audio) {
            let elem = this.getId(producer_id);
            let d = this.getId(producer_id + '__video');
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            d.parentNode.removeChild(d);

            //handleAspectRatio();
            //console.log('[producerClose] Video-element-count', this.videoMediaContainer.childElementCount);
        }

        if (type === mediaType.audio) {
            let au = this.getId(producer_id + '__localAudio');
            au.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            //this.localAudioEl.removeChild(au);
            //console.log('[producerClose] Audio-element-count', this.localAudioEl.childElementCount);
        }

        switch (type) {
            case mediaType.audio:
                this.setIsAudio(this.peer_id, false);
                this.event(_EVENTS.stopAudio);
                break;
            case mediaType.video:
                this.setIsVideo(false);
                this.event(_EVENTS.stopVideo);
                break;
            case mediaType.screen:
                this.setIsScreen(false);
                this.event(_EVENTS.stopScreen);
                break;
            default:
                return;
        }

        // this.sound('left');
    }

    // ####################################################
    // CONSUMER
    // ####################################################

    async consume(producer_id, peer_name, peer_info) {
        //
        /*if (wbIsOpen && isPresenter) {
            console.log('Update whiteboard canvas to the participants in the room');
            wbCanvasToJson();
        }*/
        this.getConsumeStream(producer_id).then(
            function ({ consumer, stream, kind }) {
                console.log('CONSUMER', consumer);

                this.consumers.set(consumer.id, consumer);

                if (kind === 'video') {
                    this.handleConsumer(consumer.id, mediaType.video, stream, peer_name, peer_info);
                    //if (isParticipantsListOpen) getRoomParticipants(true);
                } else {
                    this.handleConsumer(consumer.id, mediaType.audio, stream, peer_name, peer_info);
                }

                consumer.on(
                    'trackended',
                    function () {
                        this.removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );

                consumer.on(
                    'transportclose',
                    function () {
                        this.removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );
            }.bind(this),
        );
    }

    async getConsumeStream(producerId) {
        const { rtpCapabilities } = this.device;
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id,
            producerId,
        });
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

        return {
            consumer,
            stream,
            kind,
        };
    }

    handleConsumer(id, type, stream, peer_name, peer_info) {
        //let elem, vb, d, p, i, cm, au, fs, ts, sf, sm, sv, ko, pb, pm, pv;

        let remotePeerId = peer_info.peer_id;

        switch (type) {
            case mediaType.video:
                let remotePeerAudio = peer_info.peer_audio;
                this.removeVideoOff(remotePeerId);
                this.setMyRemoteStream(stream);

                //handleAspectRatio();
                //console.log('[addConsumer] Video-element-count', this.videoMediaContainer.childElementCount);

                break;
            case mediaType.audio:

                console.log('[Add audioConsumers]', this.audioConsumers);
                break;
        }
        return null;
    }

    removeConsumer(consumer_id, consumer_kind) {
        console.log('Remove consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });

        let elem = this.getId(consumer_id);
        if (elem) {
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            elem.parentNode.removeChild(elem);
        }

        if (consumer_kind === 'video') {
            let d = this.getId(consumer_id + '__video');
            if (d) d.parentNode.removeChild(d);
            //handleAspectRatio();
            /* console.log(
                 '[removeConsumer - ' + consumer_kind + '] Video-element-count',
                 this.videoMediaContainer.childElementCount,
             );*/
        }

        if (consumer_kind === 'audio') {
            let audioConsumerPlayerId = this.getMapKeyByValue(this.audioConsumers, consumer_id);
            if (audioConsumerPlayerId) {
                let inputPv = this.getId(audioConsumerPlayerId);
                if (inputPv) inputPv.style.display = 'none';
                this.audioConsumers.delete(audioConsumerPlayerId);
                console.log('Remove audio Consumer', {
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

    async setVideoOff(peer_info, remotePeer = false) {
        console.log("[setVideoOff]");
        let peer_id = peer_info.peer_id;
        this.removeVideoOff(peer_id);
        //let peer_name = peer_info.peer_name;
        //let peer_audio = peer_info.peer_audio;        
        //handleAspectRatio();
        //if (isParticipantsListOpen) getRoomParticipants(true);
        //console.log('[setVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
    }

    removeVideoOff(peer_id) {
        let pvOff = this.getId(peer_id + '__videoOff');
        if (pvOff) {
            pvOff.parentNode.removeChild(pvOff);
            //handleAspectRatio();
            //console.log('[removeVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
            //if (peer_id != this.peer_id) this.sound('left');
        }
    }

    // ####################################################
    // EXIT ROOM
    // ####################################################

    exit(offline = false) {
        let clean = function () {
            this._isConnected = false;
            this.consumerTransport.close();
            this.producerTransport.close();
            this.socket.off('disconnect');
            this.socket.off('newProducers');
            this.socket.off('consumerClosed');
        }.bind(this);

        if (!offline) {
            this.socket
                .request('exitRoom')
                .then((e) => console.log('Exit Room', e))
                .catch((e) => console.warn('Exit Room ', e))
                .finally(
                    function () {
                        clean();
                    }.bind(this),
                );
        } else {
            clean();
        }
        this.event(_EVENTS.exitRoom);
    }

    exitRoom() {
        //this.sound('eject');
        this.exit();
    }

    // ####################################################
    // HELPERS
    // ####################################################

    attachMediaStream(elem, stream, type, who) {
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

    async attachSinkId(elem, sinkId) {
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
                    //this.setLocalStorageDevices(mediaType.speaker, 0, speakerSelect.value);
                });
        } else {
            let error = `Browser seems doesn't support output device selection.`;
            console.warn(error);
            this.userLog('error', error, 'top-end');
        }
    }

    event(evt) {
        if (this.eventListeners.has(evt)) {
            this.eventListeners.get(evt).forEach((callback) => callback());
        }
    }

    on(evt, callback) {
        this.eventListeners.get(evt).push(callback);
    }



    setVideoAvatarImgName(elemId, peer_name) { }

    setIsAudio(peer_id, status) {
        this.peer_info.peer_audio = status;
        let b = this.getPeerAudioBtn(peer_id);
        //if (b) b.className = this.peer_info.peer_audio ? html.audioOn : html.audioOff;
    }

    setIsVideo(status) {
        this.peer_info.peer_video = status;
        if (!this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }
    }

    setIsScreen(status) {
        this.peer_info.peer_screen = status;
        if (!this.peer_info.peer_screen && !this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }
    }

    sendVideoOff() {
        this.socket.emit('setVideoOff', this.peer_info);
    }

    // ####################################################
    // GET
    // ####################################################

    isConnected() {
        return this._isConnected;
    }

    isRecording() {
        return this._isRecording;
    }

    static get mediaType() {
        return mediaType;
    }

    static get EVENTS() {
        return _EVENTS;
    }

    static get DEVICES_COUNT() {
        return DEVICES_COUNT;
    }

    getTimeNow() {
        return new Date().toTimeString().split(' ')[0];
    }

    getId(id) {
        //return document.getElementById(id);
    }

    getEcN(cn) {
        //return document.getElementsByClassName(cn);
    }

    async getRoomInfo() {
        let room_info = await this.socket.request('getRoomInfo');
        return room_info;
    }

    refreshParticipantsCount() {
        this.socket.emit('refreshParticipantsCount');
    }

    getPeerAudioBtn(peer_id) {
        return this.getId(peer_id + '__audio');
    }

    getPeerHandBtn(peer_id) {
        return this.getId(peer_id + '__hand');
    }

    getMapKeyByValue(map, searchValue) {
        for (let [key, value] of map.entries()) {
            if (value === searchValue) return key;
        }
    }



    userLog(icon, message, position, timer = 5000) {

    }

    thereIsParticipants() {
        // console.log('participantsCount ---->', participantsCount);
        if (this.consumers.size > 0 /*|| this.getParticipantsCount() > 1*/) {
            return true;
        }
        return false;
    }

    // ####################################################
    // MY SETTINGS
    // ####################################################

    toggleMySettings() {
       // this.isMySettingsOpen = this.isMySettingsOpen ? false : true;
    }

    openTab(evt, tabName) {
    }

    handleFS(elemId, fsId) {
        return;
        let videoPlayer = this.getId(elemId);
        let btnFs = this.getId(fsId);
        if (btnFs) {
            //this.setTippy(fsId, 'Full screen', 'top');
            btnFs.addEventListener('click', () => {
                videoPlayer.style.pointerEvents = this.isVideoOnFullScreen ? 'auto' : 'none';
                this.toggleFullScreen(videoPlayer);
                this.isVideoOnFullScreen = this.isVideoOnFullScreen ? false : true;
            });
        }
        if (videoPlayer) {
            videoPlayer.addEventListener('click', () => {
                if (!videoPlayer.hasAttribute('controls')) {
                    if ((this.isMobileDevice && this.isVideoOnFullScreen) || !this.isMobileDevice) {
                        videoPlayer.style.pointerEvents = this.isVideoOnFullScreen ? 'auto' : 'none';
                        this.toggleFullScreen(videoPlayer);
                        this.isVideoOnFullScreen = this.isVideoOnFullScreen ? false : true;
                    }
                }
            });
            videoPlayer.addEventListener('fullscreenchange', (e) => {
                /*if (!document.fullscreenElement) {
                    videoPlayer.style.pointerEvents = 'auto';
                    this.isVideoOnFullScreen = false;
                }*/
            });
            videoPlayer.addEventListener('webkitfullscreenchange', (e) => {
                /*if (!document.webkitIsFullScreen) {
                    videoPlayer.style.pointerEvents = 'auto';
                    this.isVideoOnFullScreen = false;
                }*/
            });
        }
    }

    // ####################################################
    // HANDLE VIDEO | OBJ FIT | CONTROLS |
    // ####################################################
    handleVideoObjectFit(value) { }
    handleVideoControls(value) { }

    // ####################################################
    // TAKE SNAPSHOT
    // ####################################################
    handleTS(elemId, tsId) { }



    // ####################################################
    // CHAT
    // ####################################################

    handleSM(uid, name) {
        const words = uid.split('___');
        let peer_id = words[1];
        let peer_name = name;
        let btnSm = this.getId(uid);
        if (btnSm) {
            btnSm.addEventListener('click', () => {
                this.sendMessageTo(peer_id, peer_name);
            });
        }
    }

    toggleChat() {
        /*
        if (this.isChatOpen == false) {
            this.isChatOpen = true;
        } else {
            this.isChatOpen = false;
        }*/
    }
    toggleChatEmoji() {/*
        this.isChatEmojiOpen = this.isChatEmojiOpen ? false : true;*/
    }

    sendMessage() {
        if (!this.thereIsParticipants()) {
            chatMessage.value = '';
            isChatPasteTxt = false;
            //this.userLog('info', 'No participants in the room', 'top-end');
            return;
        }
        let peer_msg = this.formatMsg(chatMessage.value);
        if (!peer_msg) {
            chatMessage.value = '';
            return;
        }
        let data = {
            peer_name: this.peer_name,
            peer_id: this.peer_id,
            to_peer_id: 'all',
            peer_msg: peer_msg,
        };
        console.log('Send message:', data);
        this.socket.emit('message', data);
        this.setMsgAvatar('right', this.peer_name);
        this.appendMessage('right', this.rightMsgAvatar, this.peer_name, this.peer_id, peer_msg, 'all', 'all');
        chatMessage.value = '';
    }

    sendMessageTo(to_peer_id, to_peer_name) {
        if (!this.thereIsParticipants()) {
            isChatPasteTxt = false;
            chatMessage.value = '';
            //this.userLog('info', 'No participants in the room expect you', 'top-end');
            return;
        }

    }

    showMessage(data) {/*
        if (!this.isChatOpen) this.toggleChat();
        this.setMsgAvatar('left', data.peer_name);
        this.appendMessage(
            'left',
            this.leftMsgAvatar,
            data.peer_name,
            data.peer_id,
            data.peer_msg,
            data.to_peer_id,
            data.to_peer_name,
        );*/
        //this.sound('message');
    }

    setMsgAvatar(avatar, peerName) { }
    appendMessage(side, img, fromName, fromId, msg, toId, toName) { }
    copyToClipboard(id) { }
    formatMsg(message) { }
    stripHtml(html) { }
    isHtml(str) {
        return false;
    }

    isValidHttpURL(str) { }
    collectMessages(time, from, msg) {/*
        this.chatMessages.push({
            time: time,
            from: from,
            msg: msg,
        });*/
    }
    chatToggleBg() { }
    chatClean() { }
    chatSave() { }

    getNewStream(videoStream, audioStream) {
        let newStream = null;
        let videoStreamTrack = videoStream ? videoStream.getVideoTracks()[0] : undefined;
        let audioStreamTrack = audioStream ? audioStream.getAudioTracks()[0] : undefined;
        if (videoStreamTrack && audioStreamTrack) {
            newStream = new MediaStream([videoStreamTrack, audioStreamTrack]);
        } else if (videoStreamTrack) {
            newStream = new MediaStream([videoStreamTrack]);
        } else if (audioStreamTrack) {
            newStream = new MediaStream([audioStreamTrack]);
        }
        return newStream;
    }




    // ####################################################
    // FILE SHARING
    // ####################################################

    handleSF(uid) {
        const words = uid.split('___');
        let peer_id = words[1];
        let btnSf = this.getId(uid);
        if (btnSf) {
            btnSf.addEventListener('click', () => {
                this.selectFileToShare(peer_id);
            });
        }
    }

    handleDD(uid, peer_id, itsMe = false) { }
    selectFileToShare(peer_id, broadcast = false) { }

    sendFileInformations(file, peer_id, broadcast = false) {
        this.fileToSend = file;
        //
        if (this.fileToSend && this.fileToSend.size > 0) {
            if (!this.thereIsParticipants()) {
                //userLog('info', 'No participants detected', 'top-end');
                return;
            }
            let fileInfo = {
                peer_id: peer_id,
                broadcast: broadcast,
                peer_name: this.peer_name,
                fileName: this.fileToSend.name,
                fileSize: this.fileToSend.size,
                fileType: this.fileToSend.type,
            };
            this.appendMessage(
                'right',
                this.rightMsgAvatar,
                this.peer_name,
                this.peer_id,
                'Send File: \n' + this.toHtmlJson(fileInfo),
                'all',
                'all',
            );
            // send some metadata about our file to peers in the room
            this.socket.emit('fileInfo', fileInfo);
            setTimeout(() => {
                this.sendFileData(peer_id, broadcast);
            }, 1000);
        } else {
            //userLog('error', 'File not selected or empty.', 'top-end');
        }
    }

    handleFileInfo(data) {
        this.incomingFileInfo = data;
        this.incomingFileData = [];
        this.receiveBuffer = [];
        this.receivedSize = 0;
        let fileToReceiveInfo =
            ' From: ' +
            this.incomingFileInfo.peer_name +
            //html.newline +
            ' Incoming file: ' +
            this.incomingFileInfo.fileName +
            //html.newline +
            ' File type: ' +
            this.incomingFileInfo.fileType +
            //html.newline +
            ' File size: ' +
            this.bytesToSize(this.incomingFileInfo.fileSize);
        this.appendMessage(
            'left',
            this.leftMsgAvatar,
            this.incomingFileInfo.peer_name,
            this.incomingFileInfo.peer_id,
            'Receive File: \n' + this.toHtmlJson(this.incomingFileInfo),
            'all',
            'all',
        );
        receiveFileInfo.innerHTML = fileToReceiveInfo;
        receiveFileDiv.style.display = 'inline';
        receiveProgress.max = this.incomingFileInfo.fileSize;
        //this.userLog('info', fileToReceiveInfo, 'top-end');
        this.receiveInProgress = true;
    }

    sendFileData(peer_id, broadcast) {
        console.log('Send file ', {
            name: this.fileToSend.name,
            size: this.bytesToSize(this.fileToSend.size),
            type: this.fileToSend.type,
        });

        this.sendInProgress = true;

        sendFileInfo.innerHTML =
            'File name: ' +
            this.fileToSend.name +
            //html.newline +
            'File type: ' +
            this.fileToSend.type +
            //html.newline +
            'File size: ' +
            this.bytesToSize(this.fileToSend.size)
        //html.newline;

        sendFileDiv.style.display = 'inline';
        sendProgress.max = this.fileToSend.size;

        this.fileReader = new FileReader();
        let offset = 0;

        this.fileReader.addEventListener('error', (err) => console.error('fileReader error', err));
        this.fileReader.addEventListener('abort', (e) => console.log('fileReader aborted', e));
        this.fileReader.addEventListener('load', (e) => {
            if (!this.sendInProgress) return;

            let data = {
                peer_id: peer_id,
                broadcast: broadcast,
                fileData: e.target.result,
            };
            this.sendFSData(data);
            offset += data.fileData.byteLength;

            sendProgress.value = offset;
            sendFilePercentage.innerHTML = 'Send progress: ' + ((offset / this.fileToSend.size) * 100).toFixed(2) + '%';

            // send file completed
            if (offset === this.fileToSend.size) {
                this.sendInProgress = false;
                sendFileDiv.style.display = 'none';
                //userLog('success', 'The file ' + this.fileToSend.name + ' was sent successfully.', 'top-end');
            }

            if (offset < this.fileToSend.size) readSlice(offset);
        });
        const readSlice = (o) => {
            const slice = this.fileToSend.slice(offset, o + this.chunkSize);
            this.fileReader.readAsArrayBuffer(slice);
        };
        readSlice(0);
    }

    sendFSData(data) {
        if (data) this.socket.emit('file', data);
    }

    abortFileTransfer() {
        if (this.fileReader && this.fileReader.readyState === 1) {
            this.fileReader.abort();
            sendFileDiv.style.display = 'none';
            this.sendInProgress = false;
            this.socket.emit('fileAbort', {
                peer_name: this.peer_name,
            });
        }
    }

    hideFileTransfer() {
        receiveFileDiv.style.display = 'none';
    }

    handleFileAbort(data) {
        this.receiveBuffer = [];
        this.incomingFileData = [];
        this.receivedSize = 0;
        this.receiveInProgress = false;
        receiveFileDiv.style.display = 'none';
        console.log(data.peer_name + ' aborted the file transfer');
        //userLog('info', data.peer_name + ' ⚠️ aborted the file transfer', 'top-end');
    }

    handleFile(data) {
        if (!this.receiveInProgress) return;
        this.receiveBuffer.push(data.fileData);
        this.receivedSize += data.fileData.byteLength;
        receiveProgress.value = this.receivedSize;
        receiveFilePercentage.innerHTML =
            'Receive progress: ' + ((this.receivedSize / this.incomingFileInfo.fileSize) * 100).toFixed(2) + '%';
        if (this.receivedSize === this.incomingFileInfo.fileSize) {
            receiveFileDiv.style.display = 'none';
            this.incomingFileData = this.receiveBuffer;
            this.receiveBuffer = [];
            this.endFileDownload();
        }
    }

    endFileDownload() {
        // save received file into Blob
        const blob = new Blob(this.incomingFileData);
        const file = this.incomingFileInfo.fileName;
        this.incomingFileData = [];
    }

    bytesToSize(bytes) {
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
    toHtmlJson(obj) { }

    // ####################################################
    // ROOM ACTION
    // ####################################################

    roomAction(action, emit = true) {
        let data = {
            action: action,
            password: null,
        };
        if (emit) {
            switch (action) {
                case 'lock':
                    /*if (room_password) {
                        data.password = room_password;
                        socket.emit('roomAction', data);
                        this.roomStatus(action);
                    } else {
                    }*/
                    break;
                case 'unlock':
                    this.socket.emit('roomAction', data);
                    this.roomStatus(action);
                    break;
            }
        } else {
            this.roomStatus(action);
        }
    }

    roomStatus(action) {
        switch (action) {
            case 'lock':
                //this.sound('locked');
                this.event(_EVENTS.roomLock);
                //this.userLog('info', '🔒 LOCKED the room by the password', 'top-end');
                break;
            case 'unlock':
                this.event(_EVENTS.roomUnlock);
                //this.userLog('info', '🔓 UNLOCKED the room', 'top-end');
                break;
        }
    }

    roomPassword(data) {
        switch (data.password) {
            case 'OK':
                this.joinAllowed(data.room);
                break;
            case 'KO':
                this.roomIsLocked();
                break;
        }
    }

    // ####################################################
    // HANDLE ROOM ACTION
    // ####################################################
    unlockTheRoom() { }
    roomIsLocked() {
        this.event(_EVENTS.roomLock);
        console.log('Room is Locked, try with another one');
    }

    // ####################################################
    // PEER ACTION
    // ####################################################
    peerAction(from_peer_name, id, action, emit = true, broadcast = false, info = true) {
        const words = id.split('___');
        let peer_id = words[0];

        if (emit) {
            let data = {
                from_peer_name: this.peer_name,
                peer_id: peer_id,
                action: action,
                broadcast: broadcast,
            };

            if (!this.thereIsParticipants()) {
                if (info) /*this.userLog('info', 'No participants detected', 'top-end');*/console.log("no participants detected");
                return;
            }
            this.confirmPeerAction(action, data);
        } else {
            switch (action) {
                case 'eject':
                    if (peer_id === this.peer_id || broadcast) {
                        //this.sound(action);

                        //this.peerActionProgress(from_peer_name, 'Will eject you from the room', 5000, action);
                    }
                    break;
                case 'mute':
                    if (peer_id === this.peer_id || broadcast) {
                        this.closeProducer(mediaType.audio);
                        this.updatePeerInfo(this.peer_name, this.peer_id, 'audio', false);
                        /* this.userLog(
                             'warning',
                             from_peer_name + '  ' + _PEER.audioOff + ' has closed yours audio',
                             'top-end',
                             10000,
                         );*/
                    }
                    break;
                case 'hide':
                    if (peer_id === this.peer_id || broadcast) {
                        this.closeProducer(mediaType.video);
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

    confirmPeerAction(action, data) {
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
                    this.socket.emit('peerAction', data);
                }, 2000);
                break;
        }
    }

    // ####################################################
    // SEARCH PEER FILTER
    // ####################################################
    searchPeer() { }

    // ####################################################
    // UPDATE PEER INFO
    // ####################################################
    updatePeerInfo(peer_name, peer_id, type, status, emit = true) {
        if (emit) {
            switch (type) {
                case 'audio':
                    this.setIsAudio(peer_id, status);
                    break;
                case 'video':
                    this.setIsVideo(status);
                    break;
                case 'hand':
                    this.peer_info.peer_hand = status;
                    let peer_hand = this.getPeerHandBtn(peer_id);
                    if (status) {
                        if (peer_hand) peer_hand.style.display = 'flex';
                        this.event(_EVENTS.raiseHand);
                        //this.sound('raiseHand');
                    } else {
                        if (peer_hand) peer_hand.style.display = 'none';
                        this.event(_EVENTS.lowerHand);
                    }
                    break;
            }
            let data = {
                peer_name: peer_name,
                peer_id: peer_id,
                type: type,
                status: status,
            };
            this.socket.emit('updatePeerInfo', data);
        } else {
            switch (type) {
                case 'audio':
                    this.setIsAudio(peer_id, status);
                    break;
                case 'video':
                    this.setIsVideo(status);
                    break;
                case 'hand':
                    let peer_hand = this.getPeerHandBtn(peer_id);
                    if (status) {
                        if (peer_hand) peer_hand.style.display = 'flex';
                        /* this.userLog(
                             'warning',
                             peer_name + '  ' + _PEER.raiseHand + ' has raised the hand',
                             'top-end',
                             10000,
                         );*/
                        //this.sound('raiseHand');
                    } else {
                        if (peer_hand) peer_hand.style.display = 'none';
                    }
                    break;
            }
        }
        // if (isParticipantsListOpen) getRoomParticipants(true);
    }

    checkPeerInfoStatus(peer_info) {
        let peer_id = peer_info.peer_id;
        let peer_hand_status = peer_info.peer_hand;
        if (peer_hand_status) {
            let peer_hand = this.getPeerHandBtn(peer_id);
            if (peer_hand) peer_hand.style.display = 'flex';
        }
        //...
    }






}




/*
class RoomClient {
    constructor(
        mediasoupClient,
        socket,
        room_id,
        peer_name,
        peer_geo,
        peer_info,
        isAudioAllowed,
        isVideoAllowed,
        isScreenAllowed,
        successCallback,
        getProducer,
        getParticipantsCount,
        setProducer,
        setParticipantsCount,
        setMyLocalStream,
        setMyRemoteStream
    ) {
        this.mediasoupClient = mediasoupClient;

        this.setParticipantsCount = setParticipantsCount;
        this.getParticipantsCount = getParticipantsCount;
        this.setProducer = setProducer;
        this.getProducer = getProducer;
        this.setMyLocalStream = setMyLocalStream;
        this.setMyRemoteStream = setMyRemoteStream;


        this.socket = socket;
        this.room_id = room_id;
        this.peer_id = socket.id;
        this.peer_name = peer_name;
        this.peer_geo = peer_geo;
        this.peer_info = peer_info;

        this.isAudioAllowed = isAudioAllowed;
        this.isVideoAllowed = isVideoAllowed;
        this.isScreenAllowed = isScreenAllowed;
        this.producerTransport = null;
        this.consumerTransport = null;
        this.device = null;

        this.isMobileDevice = true;

        this.isMySettingsOpen = false;

        this._isConnected = false;
        this.isVideoOnFullScreen = false;
        this.isChatOpen = false;
        this.isChatEmojiOpen = false;
        this.isChatBgTransparent = false;
        this.camVideo = false;
        this.camera = 'user';

        this.chatMessages = [];
        this.leftMsgAvatar = null;
        this.rightMsgAvatar = null;

        this.localVideoStream = "empty";
        this.localScreenStream = null;
        this.localAudioStream = null;
        this.mediaRecorder = null;
        this.recScreenStream = null;
        this._isRecording = false;

        this.RoomPassword = null;

        // file transfer settings
        this.fileToSend = null;
        this.fileReader = null;
        this.receiveBuffer = [];
        this.receivedSize = 0;
        this.incomingFileInfo = null;
        this.incomingFileData = null;
        this.sendInProgress = false;
        this.receiveInProgress = false;
        this.fileSharingInput = '*';
        this.chunkSize = 1024 * 16; // 16kb/s

        this.myVideoEl = null;
        this.myAudioEl = null;
        this.debug = false;

        this.videoProducerId = null;
        this.audioProducerId = null;
        this.audioConsumers = new Map();

        this.consumers = new Map();
        this.producers = new Map();
        this.producerLabel = new Map();
        this.eventListeners = new Map();

        console.log('06 ----> Load Mediasoup Client v', mediasoupClient.version);

        Object.keys(_EVENTS).forEach(
            function (evt) {
                this.eventListeners.set(evt, []);
            }.bind(this),
        );

        this.socket.request = function request(type, data = {}) {
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

        this.createRoom(this.room_id).then(
            async function () {
                let data = {
                    room_id: this.room_id,
                    peer_info: this.peer_info,
                    peer_geo: this.peer_geo,
                };
                await this.join(data);
                this.initSockets();
                this._isConnected = true;
                successCallback();
            }.bind(this),
        );
    }

    // ####################################################
    // GET STARTED
    // ####################################################

    async createRoom(room_id) {
        await this.socket
            .request('createRoom', {
                room_id,
            })
            .catch((err) => {
                console.log('Create room error:', err);
            });
    }

    async join(data) {
        this.socket
            .request('join', data)
            .then(
                async function (room) {
                    if (room === 'isLocked') {
                        this.event(_EVENTS.roomLock);
                        console.log('00-WARNING ----> Room is Locked, Try to unlock by the password');
                        this.unlockTheRoom();
                        return;
                    }
                    await this.joinAllowed(room);
                }.bind(this),
            )
            .catch((err) => {
                console.log('Join error:', err);
            });
    }

    async joinAllowed(room) {
        await this.handleRoomInfo(room);
        const data = await this.socket.request('getRouterRtpCapabilities');
        console.log('06.015 ----> got data');
        this.device = await this.loadDevice(data);
        console.log('07 ----> Get Router Rtp Capabilities codecs: ', this.device.rtpCapabilities.codecs);
        await this.initTransports(this.device);
        console.log('07.01 ----> Init Transports done!');
        this.startLocalMedia();
        console.log('07.02 ----> Start Local Media done!');
        this.socket.emit('getProducers');
    }

    async handleRoomInfo(room) {
        let peers = new Map(JSON.parse(room.peers));
        this.setParticipantsCount(peers.size);
        setIsPresenter(this.getParticipantsCount() > 1 ? false : true);
        handleRules(isPresenter);
        //adaptAspectRatio(participantsCount);
        for (let peer of Array.from(peers.keys()).filter((id) => id !== this.peer_id)) {
            let peer_info = peers.get(peer).peer_info;
            // console.log('07 ----> Remote Peer info', peer_info);
            if (!peer_info.peer_video) {
                await this.setVideoOff(peer_info, true);
            }
        }
        this.refreshParticipantsCount();
        console.log('06.2 Participants Count ---->', this.getParticipantsCount());
    }

    async loadDevice(routerRtpCapabilities) {
        let device;
        try {
            device = new this.mediasoupClient.Device();
        } catch (error) {
            if (error.name === 'UnsupportedError') {
                console.error('Browser not supported');
                this.userLog('error', 'Browser not supported', 'center');
            }
            console.error('Browser not supported: ', error);
            this.userLog('error', 'Browser not supported: ' + error, 'center');
        }
        await device.load({
            routerRtpCapabilities,
        });
        return device;
    }

    // ####################################################
    // PRODUCER TRANSPORT
    // ####################################################

    async initTransports(device) {
        {
            const data = await this.socket.request('createWebRtcTransport', {
                forceTcp: false,
                rtpCapabilities: device.rtpCapabilities,
            });

            if (data.error) {
                console.error('Create WebRtc Transport for Producer err: ', data.error);
                return;
            }

            this.producerTransport = device.createSendTransport(data);
            this.producerTransport.on(
                'connect',
                async function ({ dtlsParameters }, callback, errback) {
                    this.socket
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
                        const { producer_id } = await this.socket.request('produce', {
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
                            console.log('Producer Transport connected');
                            break;

                        case 'failed':
                            console.warn('Producer Transport failed');
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
            const data = await this.socket.request('createWebRtcTransport', {
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
                    this.socket
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
                            console.log('Consumer Transport connected');
                            break;

                        case 'failed':
                            console.warn('Consumer Transport failed');
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
    // SOCKET ON
    // ####################################################

    initSockets() {
        this.socket.on(
            'consumerClosed',
            function ({ consumer_id, consumer_kind }) {
                console.log('Closing consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });
                this.removeConsumer(consumer_id, consumer_kind);
            }.bind(this),
        );

        this.socket.on(
            'setVideoOff',
            function (data) {
                console.log('Video off:', data);
                this.setVideoOff(data, true);
            }.bind(this),
        );

        this.socket.on(
            'removeMe',
            function (data) {
                console.log('Remove me:', data);
                this.removeVideoOff(data.peer_id);
                this.setParticipantsCount(data.peer_counts);
                //adaptAspectRatio(participantsCount);
                //if (isParticipantsListOpen) getRoomParticipants(true);
                if (this.getParticipantsCount() == 1) {
                    setIsPresenter(true);
                    handleRules(isPresenter);
                    console.log('I am alone in the room, got Presenter Rules');
                }
            }.bind(this),
        );

        this.socket.on(
            'refreshParticipantsCount',
            function (data) {
                console.log('Participants Count:', data);
                this.setParticipantsCount(data.peer_counts);
                //adaptAspectRatio(participantsCount);
            }.bind(this),
        );

        this.socket.on(
            'newProducers',
            async function (data) {
                if (data.length > 0) {
                    console.log('New producers', data);
                    for (let { producer_id, peer_name, peer_info } of data) {
                        await this.consume(producer_id, peer_name, peer_info);
                    }
                }
            }.bind(this),
        );

        this.socket.on(
            'message',
            function (data) {
                console.log('New message:', data);
                this.showMessage(data);
            }.bind(this),
        );

        this.socket.on(
            'roomAction',
            function (data) {
                console.log('Room action:', data);
                this.roomAction(data, false);
            }.bind(this),
        );

        this.socket.on(
            'roomPassword',
            function (data) {
                console.log('Room password:', data.password);
                this.roomPassword(data);
            }.bind(this),
        );

        this.socket.on(
            'peerAction',
            function (data) {
                console.log('Peer action:', data);
                this.peerAction(data.from_peer_name, data.peer_id, data.action, false, data.broadcast);
            }.bind(this),
        );

        this.socket.on(
            'updatePeerInfo',
            function (data) {
                console.log('Peer info update:', data);
                this.updatePeerInfo(data.peer_name, data.peer_id, data.type, data.status, false);
            }.bind(this),
        );

        this.socket.on(
            'fileInfo',
            function (data) {
                console.log('File info:', data);
                this.handleFileInfo(data);
            }.bind(this),
        );

        this.socket.on(
            'file',
            function (data) {
                this.handleFile(data);
            }.bind(this),
        );

        this.socket.on(
            'shareVideoAction',
            function (data) {
                this.shareVideoAction(data);
            }.bind(this),
        );

        this.socket.on(
            'fileAbort',
            function (data) {
                this.handleFileAbort(data);
            }.bind(this),
        );

        this.socket.on(
            'wbCanvasToJson',
            function (data) {
                console.log('Received whiteboard canvas JSON');
                //JsonToWbCanvas(data);
            }.bind(this),
        );

        this.socket.on(
            'whiteboardAction',
            function (data) {
                console.log('Whiteboard action', data);
                //whiteboardAction(data, false);
            }.bind(this),
        );

        this.socket.on(
            'audioVolume',
            function (data) {
                //this.handleAudioVolume(data);
            }.bind(this),
        );

        this.socket.on(
            'disconnect',
            function () {
                this.exit(true);
            }.bind(this),
        );
    }

    // ####################################################
    // START LOCAL AUDIO VIDEO MEDIA
    // ####################################################

    startLocalMedia() {

        if (this.isAudioAllowed) {
            console.log('09 ----> Start audio media');
            this.produce(mediaType.audio, 0); // microphoneSelect.value
        } else {
            //setColor(startAudioButton, 'red');
            console.log('09 ----> Audio is off');
        }
        if (this.isVideoAllowed) {
            console.log('10 ----> Start video media');
            this.produce(mediaType.video, 0); //videoSelect.value
        } else {
            //setColor(startVideoButton, 'red');
            console.log('10 ----> Video is off');
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }

    }

    // ####################################################
    // PRODUCER
    // ####################################################

    async produce(type, deviceId = null, swapCamera = false) {
        let mediaConstraints = {};
        let audio = false;
        let screen = false;
        switch (type) {
            case mediaType.audio:
                this.isAudioAllowed = true;
                mediaConstraints = this.getAudioConstraints(deviceId);
                audio = true;
                break;
            case mediaType.video:
                this.isVideoAllowed = true;
                if (swapCamera) {
                    mediaConstraints = this.getCameraConstraints();
                } else {
                    mediaConstraints = this.getVideoConstraints(deviceId);
                }
                break;
            case mediaType.screen:
                mediaConstraints = this.getScreenConstraints();
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
            console.log('Producer already exists for this type ' + type);
            return;
        }
        console.log(`Media contraints ${type}:`, mediaConstraints);
        let stream;
        try {
            stream = screen
                ? await mediaDevices.getDisplayMedia(mediaConstraints)
                : await mediaDevices.getUserMedia(mediaConstraints);
            //console.log('Supported Constraints', mediaDevices.getSupportedConstraints());
            console.log('once were constratint!')
            const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];
            const params = {
                track,
            };

            if (!audio && !screen) {
                params.encodings = this.getEncoding();
                params.codecOptions = {
                    videoGoogleStartBitrate: 1000,
                };
            }

            var myproducer = await this.producerTransport.produce(params);
            this.setProducer(myproducer);

            let prod = this.getProducer();

            console.log('PRODUCER', prod);

            this.producers.set(prod.id, prod);

            let elem, au;
            if (!audio) {
                console.log("localvideostream cambiata!");
                this.localVideoStream = stream;
                this.setMyLocalStream(stream);
                this.videoProducerId = prod.id;
                elem = await this.handleProducer(prod.id, type, stream);
                //if (!screen && !isEnumerateDevices) enumerateVideoDevices(stream);
            } else {
                console.log("localaudiostream cambiata!");
                this.localAudioStream = stream;
                this.audioProducerId = prod.id;
                au = await this.handleProducer(prod.id, type, stream);
                //if (!isEnumerateDevices) enumerateAudioDevices(stream);
            }

            prod.on('trackended', () => {
                this.closeProducer(type);
            });

            prod.on('transportclose', () => {
                console.log('Producer transport close');
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
                this.producers.delete(prod.id);
            });

            prod.on('close', () => {
                console.log('Closing producer');
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
                this.producers.delete(prod.id);
            });

            this.producerLabel.set(type, prod.id);

            switch (type) {
                case mediaType.audio:
                    this.setIsAudio(this.peer_id, true);
                    this.event(_EVENTS.startAudio);
                    break;
                case mediaType.video:
                    this.setIsVideo(true);
                    this.event(_EVENTS.startVideo);
                    break;
                case mediaType.screen:
                    this.setIsScreen(true);
                    this.event(_EVENTS.startScreen);
                    break;
                default:
                    return;
            }
            //this.sound('joined');
        } catch (err) {
            console.error('Produce error:', err);
        }
    }

    getAudioConstraints(deviceId) {
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

    getCameraConstraints() {
        this.camera = this.camera == 'user' ? 'environment' : 'user';
        if (this.camera != 'user') this.camVideo = { facingMode: { exact: this.camera } };
        else this.camVideo = true;
        return {
            audio: false,
            video: this.camVideo,
        };
    }

    getVideoConstraints(deviceId) {
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

    getScreenConstraints() {
        return {
            audio: false,
            video: {
                frameRate: {
                    ideal: 15,
                    max: 30,
                },
            },
        };
    }

    getEncoding() {
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

    closeThenProduce(type, deviceId, swapCamera = false) {
        this.closeProducer(type);
        this.produce(type, deviceId, swapCamera);
    }

    async handleProducer(id, type, stream) {
        let elem, vb, ts, d, p, i, au, fs, pm, pb;
        switch (type) {
            case mediaType.video:
            case mediaType.screen:
                this.removeVideoOff(this.peer_id);

                this.checkPeerInfoStatus(this.peer_info);
                if (this.getParticipantsCount() <= 3 && type === mediaType.screen) {
                    this.peerAction('me', this.peer_id + '___sStart', 'screenStart', true, true, false);
                    //setAspectRatio(2); // 16:9
                } else {
                    this.peerAction('me', this.peer_id + '___sStop', 'screenStop', true, true, false);
                    //handleAspectRatio();
                }
                //console.log('[addProducer] Video-element-count', this.videoMediaContainer.childElementCount);
                break;
            case mediaType.audio:
                //console.log('[addProducer] audio-element-count', this.localAudioEl.childElementCount);
                break;
        }
        return elem;
    }

    pauseProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
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

    resumeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
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

    closeProducer(type) {
        if (!this.producerLabel.has(type)) {
            console.log('There is no producer for this type ' + type);
            return;
        }

        let producer_id = this.producerLabel.get(type);

        let data = {
            peer_name: this.peer_name,
            producer_id: producer_id,
            type: type,
            status: false,
        };
        console.log('Close producer', data);

        this.socket.emit('producerClosed', data);

        this.producers.get(producer_id).close();
        this.producers.delete(producer_id);
        this.producerLabel.delete(type);

        if (type !== mediaType.audio) {
            let elem = this.getId(producer_id);
            let d = this.getId(producer_id + '__video');
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            d.parentNode.removeChild(d);

            //handleAspectRatio();
            //console.log('[producerClose] Video-element-count', this.videoMediaContainer.childElementCount);
        }

        if (type === mediaType.audio) {
            let au = this.getId(producer_id + '__localAudio');
            au.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            //this.localAudioEl.removeChild(au);
            //console.log('[producerClose] Audio-element-count', this.localAudioEl.childElementCount);
        }

        switch (type) {
            case mediaType.audio:
                this.setIsAudio(this.peer_id, false);
                this.event(_EVENTS.stopAudio);
                break;
            case mediaType.video:
                this.setIsVideo(false);
                this.event(_EVENTS.stopVideo);
                break;
            case mediaType.screen:
                this.setIsScreen(false);
                this.event(_EVENTS.stopScreen);
                break;
            default:
                return;
        }

        // this.sound('left');
    }

    // ####################################################
    // CONSUMER
    // ####################################################

    async consume(producer_id, peer_name, peer_info) {
        //
        //if (wbIsOpen && isPresenter) {
        //    console.log('Update whiteboard canvas to the participants in the room');
        //    wbCanvasToJson();
        //}
        this.getConsumeStream(producer_id).then(
            function ({ consumer, stream, kind }) {
                console.log('CONSUMER', consumer);

                this.consumers.set(consumer.id, consumer);

                if (kind === 'video') {
                    this.handleConsumer(consumer.id, mediaType.video, stream, peer_name, peer_info);
                    //if (isParticipantsListOpen) getRoomParticipants(true);
                } else {
                    this.handleConsumer(consumer.id, mediaType.audio, stream, peer_name, peer_info);
                }

                consumer.on(
                    'trackended',
                    function () {
                        this.removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );

                consumer.on(
                    'transportclose',
                    function () {
                        this.removeConsumer(consumer.id, consumer.kind);
                    }.bind(this),
                );
            }.bind(this),
        );
    }

    async getConsumeStream(producerId) {
        const { rtpCapabilities } = this.device;
        const data = await this.socket.request('consume', {
            rtpCapabilities,
            consumerTransportId: this.consumerTransport.id,
            producerId,
        });
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

        return {
            consumer,
            stream,
            kind,
        };
    }

    handleConsumer(id, type, stream, peer_name, peer_info) {
        //let elem, vb, d, p, i, cm, au, fs, ts, sf, sm, sv, ko, pb, pm, pv;

        let remotePeerId = peer_info.peer_id;

        switch (type) {
            case mediaType.video:
                let remotePeerAudio = peer_info.peer_audio;
                this.removeVideoOff(remotePeerId);
                this.setMyRemoteStream(stream);

                //handleAspectRatio();
                //console.log('[addConsumer] Video-element-count', this.videoMediaContainer.childElementCount);

                break;
            case mediaType.audio:

                console.log('[Add audioConsumers]', this.audioConsumers);
                break;
        }
        return null;
    }

    removeConsumer(consumer_id, consumer_kind) {
        console.log('Remove consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });

        let elem = this.getId(consumer_id);
        if (elem) {
            elem.srcObject.getTracks().forEach(function (track) {
                track.stop();
            });
            elem.parentNode.removeChild(elem);
        }

        if (consumer_kind === 'video') {
            let d = this.getId(consumer_id + '__video');
            if (d) d.parentNode.removeChild(d);
            //handleAspectRatio();
            //console.log(
            //     '[removeConsumer - ' + consumer_kind + '] Video-element-count',
            //     this.videoMediaContainer.childElementCount,
            // );
        }

        if (consumer_kind === 'audio') {
            let audioConsumerPlayerId = this.getMapKeyByValue(this.audioConsumers, consumer_id);
            if (audioConsumerPlayerId) {
                let inputPv = this.getId(audioConsumerPlayerId);
                if (inputPv) inputPv.style.display = 'none';
                this.audioConsumers.delete(audioConsumerPlayerId);
                console.log('Remove audio Consumer', {
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

    async setVideoOff(peer_info, remotePeer = false) {
        console.log("[setVideoOff]");
        let peer_id = peer_info.peer_id;
        this.removeVideoOff(peer_id);
        //let peer_name = peer_info.peer_name;
        //let peer_audio = peer_info.peer_audio;        
        //handleAspectRatio();
        //if (isParticipantsListOpen) getRoomParticipants(true);
        //console.log('[setVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
    }

    removeVideoOff(peer_id) {
        let pvOff = this.getId(peer_id + '__videoOff');
        if (pvOff) {
            pvOff.parentNode.removeChild(pvOff);
            //handleAspectRatio();
            //console.log('[removeVideoOff] Video-element-count', this.videoMediaContainer.childElementCount);
            //if (peer_id != this.peer_id) this.sound('left');
        }
    }

    // ####################################################
    // EXIT ROOM
    // ####################################################

    exit(offline = false) {
        let clean = function () {
            this._isConnected = false;
            this.consumerTransport.close();
            this.producerTransport.close();
            this.socket.off('disconnect');
            this.socket.off('newProducers');
            this.socket.off('consumerClosed');
        }.bind(this);

        if (!offline) {
            this.socket
                .request('exitRoom')
                .then((e) => console.log('Exit Room', e))
                .catch((e) => console.warn('Exit Room ', e))
                .finally(
                    function () {
                        clean();
                    }.bind(this),
                );
        } else {
            clean();
        }
        this.event(_EVENTS.exitRoom);
    }

    exitRoom() {
        //this.sound('eject');
        this.exit();
    }

    // ####################################################
    // HELPERS
    // ####################################################

    attachMediaStream(elem, stream, type, who) {
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

    async attachSinkId(elem, sinkId) {
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
                    //this.setLocalStorageDevices(mediaType.speaker, 0, speakerSelect.value);
                });
        } else {
            let error = `Browser seems doesn't support output device selection.`;
            console.warn(error);
            this.userLog('error', error, 'top-end');
        }
    }

    event(evt) {
        if (this.eventListeners.has(evt)) {
            this.eventListeners.get(evt).forEach((callback) => callback());
        }
    }

    on(evt, callback) {
        this.eventListeners.get(evt).push(callback);
    }



    setVideoAvatarImgName(elemId, peer_name) { }

    setIsAudio(peer_id, status) {
        this.peer_info.peer_audio = status;
        let b = this.getPeerAudioBtn(peer_id);
        //if (b) b.className = this.peer_info.peer_audio ? html.audioOn : html.audioOff;
    }

    setIsVideo(status) {
        this.peer_info.peer_video = status;
        if (!this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }
    }

    setIsScreen(status) {
        this.peer_info.peer_screen = status;
        if (!this.peer_info.peer_screen && !this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }
    }

    sendVideoOff() {
        this.socket.emit('setVideoOff', this.peer_info);
    }

    // ####################################################
    // GET
    // ####################################################

    isConnected() {
        return this._isConnected;
    }

    isRecording() {
        return this._isRecording;
    }

    static get mediaType() {
        return mediaType;
    }

    static get EVENTS() {
        return _EVENTS;
    }

    static get DEVICES_COUNT() {
        return DEVICES_COUNT;
    }

    getTimeNow() {
        return new Date().toTimeString().split(' ')[0];
    }

    getId(id) {
        //return document.getElementById(id);
    }

    getEcN(cn) {
        //return document.getElementsByClassName(cn);
    }

    async getRoomInfo() {
        let room_info = await this.socket.request('getRoomInfo');
        return room_info;
    }

    refreshParticipantsCount() {
        this.socket.emit('refreshParticipantsCount');
    }

    getPeerAudioBtn(peer_id) {
        return this.getId(peer_id + '__audio');
    }

    getPeerHandBtn(peer_id) {
        return this.getId(peer_id + '__hand');
    }

    getMapKeyByValue(map, searchValue) {
        for (let [key, value] of map.entries()) {
            if (value === searchValue) return key;
        }
    }



    userLog(icon, message, position, timer = 5000) {

    }

    thereIsParticipants() {
        // console.log('participantsCount ---->', participantsCount);
        if (this.consumers.size > 0 || this.getParticipantsCount() > 1) {
            return true;
        }
        return false;
    }

    // ####################################################
    // MY SETTINGS
    // ####################################################

    toggleMySettings() {
        this.isMySettingsOpen = this.isMySettingsOpen ? false : true;
    }

    openTab(evt, tabName) {
    }

    handleFS(elemId, fsId) {
        let videoPlayer = this.getId(elemId);
        let btnFs = this.getId(fsId);
        if (btnFs) {
            //this.setTippy(fsId, 'Full screen', 'top');
            btnFs.addEventListener('click', () => {
                videoPlayer.style.pointerEvents = this.isVideoOnFullScreen ? 'auto' : 'none';
                this.toggleFullScreen(videoPlayer);
                this.isVideoOnFullScreen = this.isVideoOnFullScreen ? false : true;
            });
        }
        if (videoPlayer) {
            videoPlayer.addEventListener('click', () => {
                if (!videoPlayer.hasAttribute('controls')) {
                    if ((this.isMobileDevice && this.isVideoOnFullScreen) || !this.isMobileDevice) {
                        videoPlayer.style.pointerEvents = this.isVideoOnFullScreen ? 'auto' : 'none';
                        this.toggleFullScreen(videoPlayer);
                        this.isVideoOnFullScreen = this.isVideoOnFullScreen ? false : true;
                    }
                }
            });
            videoPlayer.addEventListener('fullscreenchange', (e) => {
                //if (!document.fullscreenElement) {
                //    videoPlayer.style.pointerEvents = 'auto';
                //    this.isVideoOnFullScreen = false;
                //}
            });
            videoPlayer.addEventListener('webkitfullscreenchange', (e) => {
                //if (!document.webkitIsFullScreen) {
                //    videoPlayer.style.pointerEvents = 'auto';
                //    this.isVideoOnFullScreen = false;
                //}
            });
        }
    }

    // ####################################################
    // HANDLE VIDEO | OBJ FIT | CONTROLS |
    // ####################################################
    handleVideoObjectFit(value) { }
    handleVideoControls(value) { }

    // ####################################################
    // TAKE SNAPSHOT
    // ####################################################
    handleTS(elemId, tsId) { }



    // ####################################################
    // CHAT
    // ####################################################

    handleSM(uid, name) {
        const words = uid.split('___');
        let peer_id = words[1];
        let peer_name = name;
        let btnSm = this.getId(uid);
        if (btnSm) {
            btnSm.addEventListener('click', () => {
                this.sendMessageTo(peer_id, peer_name);
            });
        }
    }

    toggleChat() {
        if (this.isChatOpen == false) {
            this.isChatOpen = true;
        } else {
            this.isChatOpen = false;
        }
    }
    toggleChatEmoji() {
        this.isChatEmojiOpen = this.isChatEmojiOpen ? false : true;
    }

    sendMessage() {
        if (!this.thereIsParticipants()) {
            chatMessage.value = '';
            isChatPasteTxt = false;
            //this.userLog('info', 'No participants in the room', 'top-end');
            return;
        }
        let peer_msg = this.formatMsg(chatMessage.value);
        if (!peer_msg) {
            chatMessage.value = '';
            return;
        }
        let data = {
            peer_name: this.peer_name,
            peer_id: this.peer_id,
            to_peer_id: 'all',
            peer_msg: peer_msg,
        };
        console.log('Send message:', data);
        this.socket.emit('message', data);
        this.setMsgAvatar('right', this.peer_name);
        this.appendMessage('right', this.rightMsgAvatar, this.peer_name, this.peer_id, peer_msg, 'all', 'all');
        chatMessage.value = '';
    }

    sendMessageTo(to_peer_id, to_peer_name) {
        if (!this.thereIsParticipants()) {
            isChatPasteTxt = false;
            chatMessage.value = '';
            //this.userLog('info', 'No participants in the room expect you', 'top-end');
            return;
        }

    }

    showMessage(data) {
        if (!this.isChatOpen) this.toggleChat();
        this.setMsgAvatar('left', data.peer_name);
        this.appendMessage(
            'left',
            this.leftMsgAvatar,
            data.peer_name,
            data.peer_id,
            data.peer_msg,
            data.to_peer_id,
            data.to_peer_name,
        );
        //this.sound('message');
    }

    setMsgAvatar(avatar, peerName) { }
    appendMessage(side, img, fromName, fromId, msg, toId, toName) { }
    copyToClipboard(id) { }
    formatMsg(message) { }
    stripHtml(html) { }
    isHtml(str) {
        return false;
    }

    isValidHttpURL(str) { }
    collectMessages(time, from, msg) {
        this.chatMessages.push({
            time: time,
            from: from,
            msg: msg,
        });
    }
    chatToggleBg() { }
    chatClean() { }
    chatSave() { }

    getNewStream(videoStream, audioStream) {
        let newStream = null;
        let videoStreamTrack = videoStream ? videoStream.getVideoTracks()[0] : undefined;
        let audioStreamTrack = audioStream ? audioStream.getAudioTracks()[0] : undefined;
        if (videoStreamTrack && audioStreamTrack) {
            newStream = new MediaStream([videoStreamTrack, audioStreamTrack]);
        } else if (videoStreamTrack) {
            newStream = new MediaStream([videoStreamTrack]);
        } else if (audioStreamTrack) {
            newStream = new MediaStream([audioStreamTrack]);
        }
        return newStream;
    }




    // ####################################################
    // FILE SHARING
    // ####################################################

    handleSF(uid) {
        const words = uid.split('___');
        let peer_id = words[1];
        let btnSf = this.getId(uid);
        if (btnSf) {
            btnSf.addEventListener('click', () => {
                this.selectFileToShare(peer_id);
            });
        }
    }

    handleDD(uid, peer_id, itsMe = false) { }
    selectFileToShare(peer_id, broadcast = false) { }

    sendFileInformations(file, peer_id, broadcast = false) {
        this.fileToSend = file;
        //
        if (this.fileToSend && this.fileToSend.size > 0) {
            if (!this.thereIsParticipants()) {
                //userLog('info', 'No participants detected', 'top-end');
                return;
            }
            let fileInfo = {
                peer_id: peer_id,
                broadcast: broadcast,
                peer_name: this.peer_name,
                fileName: this.fileToSend.name,
                fileSize: this.fileToSend.size,
                fileType: this.fileToSend.type,
            };
            this.appendMessage(
                'right',
                this.rightMsgAvatar,
                this.peer_name,
                this.peer_id,
                'Send File: \n' + this.toHtmlJson(fileInfo),
                'all',
                'all',
            );
            // send some metadata about our file to peers in the room
            this.socket.emit('fileInfo', fileInfo);
            setTimeout(() => {
                this.sendFileData(peer_id, broadcast);
            }, 1000);
        } else {
            //userLog('error', 'File not selected or empty.', 'top-end');
        }
    }

    handleFileInfo(data) {
        this.incomingFileInfo = data;
        this.incomingFileData = [];
        this.receiveBuffer = [];
        this.receivedSize = 0;
        let fileToReceiveInfo =
            ' From: ' +
            this.incomingFileInfo.peer_name +
            //html.newline +
            ' Incoming file: ' +
            this.incomingFileInfo.fileName +
            //html.newline +
            ' File type: ' +
            this.incomingFileInfo.fileType +
            //html.newline +
            ' File size: ' +
            this.bytesToSize(this.incomingFileInfo.fileSize);
        this.appendMessage(
            'left',
            this.leftMsgAvatar,
            this.incomingFileInfo.peer_name,
            this.incomingFileInfo.peer_id,
            'Receive File: \n' + this.toHtmlJson(this.incomingFileInfo),
            'all',
            'all',
        );
        receiveFileInfo.innerHTML = fileToReceiveInfo;
        receiveFileDiv.style.display = 'inline';
        receiveProgress.max = this.incomingFileInfo.fileSize;
        //this.userLog('info', fileToReceiveInfo, 'top-end');
        this.receiveInProgress = true;
    }

    sendFileData(peer_id, broadcast) {
        console.log('Send file ', {
            name: this.fileToSend.name,
            size: this.bytesToSize(this.fileToSend.size),
            type: this.fileToSend.type,
        });

        this.sendInProgress = true;

        sendFileInfo.innerHTML =
            'File name: ' +
            this.fileToSend.name +
            //html.newline +
            'File type: ' +
            this.fileToSend.type +
            //html.newline +
            'File size: ' +
            this.bytesToSize(this.fileToSend.size)
        //html.newline;

        sendFileDiv.style.display = 'inline';
        sendProgress.max = this.fileToSend.size;

        this.fileReader = new FileReader();
        let offset = 0;

        this.fileReader.addEventListener('error', (err) => console.error('fileReader error', err));
        this.fileReader.addEventListener('abort', (e) => console.log('fileReader aborted', e));
        this.fileReader.addEventListener('load', (e) => {
            if (!this.sendInProgress) return;

            let data = {
                peer_id: peer_id,
                broadcast: broadcast,
                fileData: e.target.result,
            };
            this.sendFSData(data);
            offset += data.fileData.byteLength;

            sendProgress.value = offset;
            sendFilePercentage.innerHTML = 'Send progress: ' + ((offset / this.fileToSend.size) * 100).toFixed(2) + '%';

            // send file completed
            if (offset === this.fileToSend.size) {
                this.sendInProgress = false;
                sendFileDiv.style.display = 'none';
                //userLog('success', 'The file ' + this.fileToSend.name + ' was sent successfully.', 'top-end');
            }

            if (offset < this.fileToSend.size) readSlice(offset);
        });
        const readSlice = (o) => {
            const slice = this.fileToSend.slice(offset, o + this.chunkSize);
            this.fileReader.readAsArrayBuffer(slice);
        };
        readSlice(0);
    }

    sendFSData(data) {
        if (data) this.socket.emit('file', data);
    }

    abortFileTransfer() {
        if (this.fileReader && this.fileReader.readyState === 1) {
            this.fileReader.abort();
            sendFileDiv.style.display = 'none';
            this.sendInProgress = false;
            this.socket.emit('fileAbort', {
                peer_name: this.peer_name,
            });
        }
    }

    hideFileTransfer() {
        receiveFileDiv.style.display = 'none';
    }

    handleFileAbort(data) {
        this.receiveBuffer = [];
        this.incomingFileData = [];
        this.receivedSize = 0;
        this.receiveInProgress = false;
        receiveFileDiv.style.display = 'none';
        console.log(data.peer_name + ' aborted the file transfer');
        //userLog('info', data.peer_name + ' ⚠️ aborted the file transfer', 'top-end');
    }

    handleFile(data) {
        if (!this.receiveInProgress) return;
        this.receiveBuffer.push(data.fileData);
        this.receivedSize += data.fileData.byteLength;
        receiveProgress.value = this.receivedSize;
        receiveFilePercentage.innerHTML =
            'Receive progress: ' + ((this.receivedSize / this.incomingFileInfo.fileSize) * 100).toFixed(2) + '%';
        if (this.receivedSize === this.incomingFileInfo.fileSize) {
            receiveFileDiv.style.display = 'none';
            this.incomingFileData = this.receiveBuffer;
            this.receiveBuffer = [];
            this.endFileDownload();
        }
    }

    endFileDownload() {
        // save received file into Blob
        const blob = new Blob(this.incomingFileData);
        const file = this.incomingFileInfo.fileName;
        this.incomingFileData = [];
    }

    bytesToSize(bytes) {
        let sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return '0 Byte';
        let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
        return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
    }
    toHtmlJson(obj) { }

    // ####################################################
    // ROOM ACTION
    // ####################################################

    roomAction(action, emit = true) {
        let data = {
            action: action,
            password: null,
        };
        if (emit) {
            switch (action) {
                case 'lock':
                    //if (room_password) {
                    //    data.password = room_password;
                    //    this.socket.emit('roomAction', data);
                    //    this.roomStatus(action);
                    //} else {
                    //}
                    break;
                case 'unlock':
                    this.socket.emit('roomAction', data);
                    this.roomStatus(action);
                    break;
            }
        } else {
            this.roomStatus(action);
        }
    }

    roomStatus(action) {
        switch (action) {
            case 'lock':
                //this.sound('locked');
                this.event(_EVENTS.roomLock);
                //this.userLog('info', '🔒 LOCKED the room by the password', 'top-end');
                break;
            case 'unlock':
                this.event(_EVENTS.roomUnlock);
                //this.userLog('info', '🔓 UNLOCKED the room', 'top-end');
                break;
        }
    }

    roomPassword(data) {
        switch (data.password) {
            case 'OK':
                this.joinAllowed(data.room);
                break;
            case 'KO':
                this.roomIsLocked();
                break;
        }
    }

    // ####################################################
    // HANDLE ROOM ACTION
    // ####################################################
    unlockTheRoom() { }
    roomIsLocked() {
        this.event(_EVENTS.roomLock);
        console.log('Room is Locked, try with another one');
    }

    // ####################################################
    // PEER ACTION
    // ####################################################
    peerAction(from_peer_name, id, action, emit = true, broadcast = false, info = true) {
        const words = id.split('___');
        let peer_id = words[0];

        if (emit) {
            let data = {
                from_peer_name: this.peer_name,
                peer_id: peer_id,
                action: action,
                broadcast: broadcast,
            };

            if (!this.thereIsParticipants()) {
                if (info) console.log("no participants detected");
                return;
            }
            this.confirmPeerAction(action, data);
        } else {
            switch (action) {
                case 'eject':
                    if (peer_id === this.peer_id || broadcast) {
                        //this.sound(action);

                        //this.peerActionProgress(from_peer_name, 'Will eject you from the room', 5000, action);
                    }
                    break;
                case 'mute':
                    if (peer_id === this.peer_id || broadcast) {
                        this.closeProducer(mediaType.audio);
                        this.updatePeerInfo(this.peer_name, this.peer_id, 'audio', false);
                        //this.userLog(
                        //     'warning',
                        //     from_peer_name + '  ' + _PEER.audioOff + ' has closed yours audio',
                        //     'top-end',
                        //     10000,
                        // );
                    }
                    break;
                case 'hide':
                    if (peer_id === this.peer_id || broadcast) {
                        this.closeProducer(mediaType.video);
                        //this.userLog(
                        //    'warning',
                        //    from_peer_name + '  ' + _PEER.videoOff + ' has closed yours video',
                        //    'top-end',
                        //    10000,
                        //);
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

    confirmPeerAction(action, data) {
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
                    this.socket.emit('peerAction', data);
                }, 2000);
                break;
        }
    }

    // ####################################################
    // SEARCH PEER FILTER
    // ####################################################
    searchPeer() { }

    // ####################################################
    // UPDATE PEER INFO
    // ####################################################
    updatePeerInfo(peer_name, peer_id, type, status, emit = true) {
        if (emit) {
            switch (type) {
                case 'audio':
                    this.setIsAudio(peer_id, status);
                    break;
                case 'video':
                    this.setIsVideo(status);
                    break;
                case 'hand':
                    this.peer_info.peer_hand = status;
                    let peer_hand = this.getPeerHandBtn(peer_id);
                    if (status) {
                        if (peer_hand) peer_hand.style.display = 'flex';
                        this.event(_EVENTS.raiseHand);
                        //this.sound('raiseHand');
                    } else {
                        if (peer_hand) peer_hand.style.display = 'none';
                        this.event(_EVENTS.lowerHand);
                    }
                    break;
            }
            let data = {
                peer_name: peer_name,
                peer_id: peer_id,
                type: type,
                status: status,
            };
            this.socket.emit('updatePeerInfo', data);
        } else {
            switch (type) {
                case 'audio':
                    this.setIsAudio(peer_id, status);
                    break;
                case 'video':
                    this.setIsVideo(status);
                    break;
                case 'hand':
                    let peer_hand = this.getPeerHandBtn(peer_id);
                    if (status) {
                        if (peer_hand) peer_hand.style.display = 'flex';
                        //this.userLog(
                        //     'warning',
                        //     peer_name + '  ' + _PEER.raiseHand + ' has raised the hand',
                        //     'top-end',
                        //     10000,
                        // );
                        //this.sound('raiseHand');
                    } else {
                        if (peer_hand) peer_hand.style.display = 'none';
                    }
                    break;
            }
        }
        // if (isParticipantsListOpen) getRoomParticipants(true);
    }

    checkPeerInfoStatus(peer_info) {
        let peer_id = peer_info.peer_id;
        let peer_hand_status = peer_info.peer_hand;
        if (peer_hand_status) {
            let peer_hand = this.getPeerHandBtn(peer_id);
            if (peer_hand) peer_hand.style.display = 'flex';
        }
        //...
    }




}

//export default RoomClient
export { RoomClient }
*/



//export default RoomClient
export { RoomClient }