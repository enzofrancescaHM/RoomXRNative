const Reducer = (state, action) => {
    switch (action.type) {
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
        case 'ADD_CHAT_MESSAGE':
            return{
                ...state,
                chat_array: [...state.chat_array, action.payload]
            };
        default:
            return state;
    }
};

export default Reducer;