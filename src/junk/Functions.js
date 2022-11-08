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
    dispatch({type: 'SET_LOCAL_STREAM', payload: newval});
}

function setYourStream(newval) {
    dispatch({type: 'SET_REMOTE_STREAM', payload: newval});
}
