    ////////////////////////////////////////////////////////////////
    // CONSTRAINTS
    ////////////////////////////////////////////////////////////////
    function setIsAudio(peer_id, status) {
        //this.peer_info.peer_audio = status;
        //let b = this.getPeerAudioBtn(peer_id);
        //if (b) b.className = this.peer_info.peer_audio ? html.audioOn : html.audioOff;
    }

    function setIsVideo(status) {
        /*this.peer_info.peer_video = status;
        if (!this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }*/
    }

    function setIsScreen(status) {/*
        this.peer_info.peer_screen = status;
        if (!this.peer_info.peer_screen && !this.peer_info.peer_video) {
            this.setVideoOff(this.peer_info, false);
            this.sendVideoOff();
        }*/
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

    function getVideoConstraints(deviceId) {
        return {
            audio: false,
            video: {
                width: {
                    min: 1280,
                    ideal: 1920,
                    max: 3840,
                },
                height: {
                    min: 720,
                    ideal: 1080,
                    max: 2160,
                },
                deviceId: deviceId,
                //facingMode: "environment",
                aspectRatio: 1.777, // 16:9
                frameRate: {
                    min: 5,
                    ideal: 15,
                    max: 30,
                },
            },
        };
    }
    function getVideoConstraintsUSB(deviceId) {
        return {
            //usb:true,
            audio: false,
            video: {
                width: {
                    min: 1280, //640
                    ideal: 1280, //1920
                    max: 1280, //3840
                },
                height: {
                    min: 720, //480
                    ideal: 720, //1080
                    max: 720, //2160
                },
                deviceId: "uvc",
                //facingMode: "environment",
                aspectRatio: 1.777, // 16:9
                frameRate: {
                    min: 5, //5
                    ideal: 15, //15
                    max: 30, //30
                },
            },
        };
    }

    function getScreenConstraints() {
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

    function getMapKeyByValue(map, searchValue) {
        for (let [key, value] of map.entries()) {
            if (value === searchValue) return key;
        }
    }

    export {setIsAudio, setIsVideo, setIsScreen, getAudioConstraints, getVideoConstraints, getVideoConstraintsUSB, getScreenConstraints, getEncoding, getMapKeyByValue}