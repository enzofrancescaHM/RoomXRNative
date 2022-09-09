import react from "react";
import React, { Component } from "react";
import Section from "../../Section.native";
//import RoomClient from "./RoomClient";

import {RTCView} from "react-native-webrtc";

import {
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';
// MEDIASOUP SECTION
import * as mediasoupClient from "mediasoup-client";
import {
    types,
    version,
    Device,
    detectDevice,
    parseScalabilityMode,
    debug
} from "mediasoup-client";
//import { Button } from "react-native-web";
import SocketIOClient from 'socket.io-client'

import MainPage from "../../MainPage";

var socket = null;


function socketConnect() {
    //alert('getRTP()!')
    socket = SocketIOClient("https://roomxr.eu:5001", { transports: ['websocket'] });

    // client-side
    socket.on("chat_message", (msg) => {
        console.log(msg);
    });

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

}

async function createRoom() {

    //const data = await socket.request('getRouterRtpCapabilities');
    await socket
        .request('createRoom', {
            room_id: "ciccio"
        })
        .catch((err) => {
            console.log('Create room error:', err);
        });


}

async function myjoinRoom() {

    let data = {
        room_id: "ciccio",
        peer_info: {},
        peer_geo: {},
    };
    await socket
        .request('join', data)
        .catch((err) => {
            console.log('join error:', err);
        });


}

function initSockets() {

    socket.on(
        'consumerClosed',
        function ({ consumer_id, consumer_kind }) {
            console.log('Closing consumer', { consumer_id: consumer_id, consumer_kind: consumer_kind });
            //this.removeConsumer(consumer_id, consumer_kind);
        }.bind(this),
    );

    socket.on(
        'setVideoOff',
        function (data) {
            console.log('Video off:', data);
            //this.setVideoOff(data, true);
        }.bind(this),
    );

    socket.on(
        'removeMe',
        function (data) {
            console.log('Remove me:', data);
            //this.removeVideoOff(data.peer_id);
            //participantsCount = data.peer_counts;
            //adaptAspectRatio(participantsCount);
            //if (isParticipantsListOpen) getRoomParticipants(true);
        }.bind(this),
    );

    socket.on(
        'refreshParticipantsCount',
        function (data) {
            console.log('Participants Count:', data);
            //participantsCount = data.peer_counts;
            //adaptAspectRatio(participantsCount);
        }.bind(this),
    );

    socket.on(
        'newProducers',
        async function (data) {
            if (data.length > 0) {
                console.log('New producers', data);
                //for (let { producer_id, peer_name, peer_info } of data) {
                //    await this.consume(producer_id, peer_name, peer_info);
                //}
            }
        }.bind(this),
    );

    socket.on(
        'message',
        function (data) {
            console.log('New message:', data);
            //this.showMessage(data);
        }.bind(this),
    );

    socket.on(
        'roomAction',
        function (data) {
            console.log('Room action:', data);
            //this.roomAction(data, false);
        }.bind(this),
    );

    socket.on(
        'roomPassword',
        function (data) {
            console.log('Room password:', data.password);
            //this.roomPassword(data);
        }.bind(this),
    );

    socket.on(
        'peerAction',
        function (data) {
            console.log('Peer action:', data);
            //this.peerAction(data.from_peer_name, data.peer_id, data.action, false, data.broadcast);
        }.bind(this),
    );

    socket.on(
        'updatePeerInfo',
        function (data) {
            console.log('Peer info update:', data);
            //this.updatePeerInfo(data.peer_name, data.peer_id, data.type, data.status, false);
        }.bind(this),
    );

    socket.on(
        'fileInfo',
        function (data) {
            console.log('File info:', data);
            //this.handleFileInfo(data);
        }.bind(this),
    );

    socket.on(
        'file',
        function (data) {
            console.log('File:', data);
            //this.handleFile(data);
        }.bind(this),
    );

    socket.on(
        'shareVideoAction',
        function (data) {
            console.log('shareVideoAction:', data);
            //this.shareVideoAction(data);
        }.bind(this),
    );

    socket.on(
        'fileAbort',
        function (data) {
            console.log('File abort:', data);
            //this.handleFileAbort(data);
        }.bind(this),
    );

    socket.on(
        'wbCanvasToJson',
        function (data) {
            console.log('Received whiteboard canvas JSON');
            //JsonToWbCanvas(data);
        }.bind(this),
    );

    socket.on(
        'whiteboardAction',
        function (data) {
            console.log('Whiteboard action', data);
            //whiteboardAction(data, false);
        }.bind(this),
    );

    socket.on(
        'audioVolume',
        function (data) {
            //console.log('audio volume:', data);
            //this.handleAudioVolume(data);
        }.bind(this),
    );

    socket.on(
        'disconnect',
        function () {
            console.log("disconnect!")
            //this.exit(true);
        }.bind(this),
    );

}

async function createRoomClient(){
    
   initEnumerateDevices();
   // joinRoom("enzo","ciccio");

}
async function getRTP() {

    const data = await socket.request('getRouterRtpCapabilities');
    console.log(data);
    let device = await loadDevice(data);
    const data2 = await socket.request('createWebRtcTransport', {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities,
    });

    if (data2.error) {
        console.error('Create WebRtc Transport for Producer err: ', data.error);
        return;
    }

    let producerTransport = device.createSendTransport(data2);
    producerTransport.on(
        'connect',
        async function ({ dtlsParameters }, callback, errback) {
            this.socket
                .request('connectTransport', {
                    dtlsParameters,
                    transport_id: data2.id,
                })
                .then(callback)
                .catch(errback);
        }.bind(this),
    );

    producerTransport.on(
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

    producerTransport.on(
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
                    producerTransport.close();
                    break;

                default:
                    break;
            }
        }.bind(this),
    );

    socket.emit('getProducers');
    initSockets();

}

async function loadDevice(routerRtpCapabilities) {
    let device;
    try {
        device = new mediasoupClient.Device();
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

function ClientTest() {
    return (
        <>
            <Section title="RoomXR Playground">
                debug helper to connect to RoomXR from react native...
            </Section>
           {/*  <Section title="First Step">
                Get Socket connection
                <Button
                    title="Socket Connect"
                    enabled
                    onPress={socketConnect}
                />
            </Section>
            <Section title="Second Step">
                Get Socket connection
                <Button
                    title="Create Room"
                    enabled
                    onPress={createRoom}
                />
            </Section>
            <Section title="Third Step">
                Get Socket connection
                <Button
                    title="Join Room"
                    enabled
                    onPress={myjoinRoom}
                />
            </Section>
            <Section title="Fourth Step">
                Get RTP Capabilities
                <Button
                    title="Get RTP Caps"
                    enabled
                    onPress={getRTP}
                />
            </Section> */}
          

            <MainPage></MainPage>
            <Section title="Footer">
                Holomask S.r.l - 2022
            </Section>
        </>
    )
}

export default ClientTest