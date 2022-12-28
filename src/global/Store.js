import React, {createContext, useReducer} from "react";
import Reducer from './Reducer'


const initialState = {
    room_id: "holomask-test", // TODO change in production
    peer_name: "enzo",          // TODO change in production
    localstream: "empty",
    remotestream: "empty",
    guest1stream: "empty",
    guest2stream: "empty",
    screenstream: "empty",
    remotestreamid: "empty",
    guest1streamid: "empty",
    guest2streamid: "empty",
    screenstreamid: "empty",
    localaudiostream:"empty",
    remoteaudiostream:"empty",
    mediasoupClient: null,
    peer_geo: null,
    isAudioAllowed: true,
    isVideoAllowed: true,
    isScreenAllowed: false,
    user_agent: "android",
    detect_rtc_version: '1.4.1'/*DetectRTC.version*/,
    is_webrtc_supported: true/*DetectRTC.isWebRTCSupported*/,
    is_desktop_device: false,
    is_mobile_device: true,
    is_tablet_device: false,
    is_ipad_pro_device: false,
    os_name: 'Windows'/*DetectRTC.osName*/,
    os_version: '10'/*DetectRTC.osVersion*/,
    browser_name: 'Chrome'/*DetectRTC.browser.name*/,
    browser_version: '104'/*DetectRTC.browser.version*/,
    peer_id: null,
    peer_hand: false,
    connected: false,
    usbcamera:false,
    chat_array: [],
    path_array: [],
    rect_array: [],
    ellipse_array: [],
    line_array: [],
    text_array: [],
    pointer_x: null,
    pointer_y: null,
    image_array: [],
    board_W: 0,
    board_H: 0,


};

const Store = ({children}) => {
    const [state, dispatch] = useReducer(Reducer, initialState);
    return (
        <Context.Provider value={[state, dispatch]}>
            {children}
        </Context.Provider>
    )
};

export const Context = createContext(initialState);
export default Store;