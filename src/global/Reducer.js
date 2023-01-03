const Reducer = (state, action) => {
    switch (action.type) {
        case 'SET_PEER_NAME':
            return{
                ...state,
                peer_name: action.payload
            };
        case 'SET_ROOT':
            return{
                ...state,
                root_address: action.payload
            };
        case 'SET_ROOM':
            return{
                ...state,
                room_id: action.payload
            };
    
        case 'SET_PEER_ID':
            return{
                ...state,
                peer_id: action.payload
            };
        case 'SET_CONNECTED':
            return{
                ...state,
                connected: action.payload
            };
        case 'SET_IS_AUDIO_ALLOWED':
            return{
                ...state,
                isAudioAllowed: action.payload
            };
        case 'SET_MEDIASOUPCLIENT':
            return{
                ...state,
                mediasoupClient: action.payload
            };
        case 'SET_IS_VIDEO_ALLOWED':
            return{
                ...state,
                isVideoAllowed: action.payload
            };
        case 'SET_IS_SCREEN_ALLOWED':
            return{
                ...state,
                isScreenAllowed: action.payload
            };
        case 'SET_LOCAL_STREAM':
            return{
                ...state,
                localstream: action.payload
            };
        case 'SET_REMOTE_STREAM':
                return{
                    ...state,
                    remotestream: action.payload
                };
        case 'SET_SCREEN_STREAM':
                return{
                    ...state,
                    screenstream: action.payload
                };
        case 'SET_GUEST1_STREAM':
                return{
                    ...state,
                    guest1stream: action.payload
            };
        case 'SET_GUEST2_STREAM':
                return{
                    ...state,
                    guest2stream: action.payload
            };
        case 'SET_GUEST1_STREAM_ID':
                return{
                    ...state,
                    guest1streamid: action.payload
            };
        case 'SET_GUEST2_STREAM_ID':
                return{
                    ...state,
                    guest2streamid: action.payload
            };

        case 'SET_REMOTE_STREAM_ID':
                return{
                    ...state,
                    remotestreamid: action.payload
                };
        case 'SET_SCREEN_STREAM_ID':
                return{
                    ...state,
                    screenstreamid: action.payload
                };
        case 'SET_LOCAL_AUDIO_STREAM':
            return{
                ...state,
                localaudiostream: action.payload
            };
        case 'SET_REMOTE_AUDIO_STREAM':
                return{
                    ...state,
                    remoteaudiostream: action.payload
                };
        case 'SET_USBCAMERA':
            return{
                ...state,
                usbcamera: action.payload
            };
        case 'ADD_CHAT_MESSAGE':
            return{
                ...state,
                chat_array: [...state.chat_array, action.payload]
            };
        case 'CLEAR_CHAT':
            return{
                ...state,
                chat_array: []
            };
        case 'ADD_PATH':
            return{
                ...state,
                path_array: [...state.path_array, action.payload]
            };
        case 'CLEAR_PATHS':
            return{
                ...state,
                path_array: []
            };
        case 'ADD_ELLIPSE':
            return{
                ...state,
                ellipse_array: [...state.ellipse_array, action.payload]
            };
        case 'CLEAR_ELLIPSES':
            return{
                ...state,
                ellipse_array: []
            };
        case 'ADD_RECT':
            return{
                ...state,
                rect_array: [...state.rect_array, action.payload]
            };
        case 'CLEAR_RECTS':
            return{
                ...state,
                rect_array: []
            };
        case 'ADD_LINE':
            return{
                ...state,
                line_array: [...state.line_array, action.payload]
            };
        case 'CLEAR_LINES':
            return{
                ...state,
                line_array: []
            };
        case 'ADD_TEXT':
            return{
                ...state,
                text_array: [...state.text_array, action.payload]
            };
        case 'CLEAR_TEXTS':
            return{
                ...state,
                text_array: []
            };
        case 'ADD_IMAGE':
            return{
                ...state,
                image_array: [...state.image_array, action.payload]
            };
        case 'CLEAR_IMAGES':
            return{
                ...state,
                image_array: []
            };            
        case 'POINTER_DATA':
            return{
                ...state,
                pointer_x: action.payload.x,
                pointer_y: action.payload.y
            };
        case 'BOARDSIZE':
            return{
                ...state,
                board_W: action.payload.w,
                board_H: action.payload.h
            };
        
        default:
            return state;
    }
};

export default Reducer;