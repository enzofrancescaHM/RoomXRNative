import { Skia, useFont } from "@shopify/react-native-skia";

const Reducer = (state, action) => {
    switch (action.type) {
        case 'SET_APP_VER':
            return{
                ...state,
                app_ver: action.payload
            };
        case 'SET_APP_ARCH':
            return{
                ...state,
                app_arch: action.payload
            };
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
        case 'SET_SPLASH_MESSAGE':
            return{
                ...state,
                splash_message: action.payload
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
        case 'SET_REAL_WIDTH':
            return{
                ...state,
                real_width: action.payload
            };
        case 'SET_REAL_HEIGHT':
            return{
                ...state,
                real_height: action.payload
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
        case 'MOD_PATH':
            // try to modify the image object here because 
            // it is not possibile into the RoomClient...
            console.log("we are in mod path");
            //console.log(action.payload);
            state.path_array.forEach((path) => {                
                if(path.id == action.payload.elementID)
                {
                    console.log("path found!");
                    
                    if(action.payload.action == "delete")
                    {
                        const mypath = Skia.Path.Make();
                        mypath.moveTo(128, 0);
                        mypath.lineTo(168, 80);
                        mypath.lineTo(256, 93);
                        mypath.lineTo(192, 155);
                        mypath.lineTo(207, 244);
                        mypath.lineTo(128, 202);
                        mypath.lineTo(49, 244);
                        mypath.lineTo(64, 155);
                        mypath.lineTo(0, 93);
                        mypath.lineTo(88, 80);
                        mypath.lineTo(128, 0);
                        mypath.close();
                    
                        var myoffsetx = action.payload.target.left - action.payload.lastleft;
                        var myoffsety = action.payload.target.top - action.payload.lasttop;
    
                        mypath.offset(myoffsetx, myoffsety);
                        
                        path.path = mypath;
                    }
                    else
                    {
                        // rebuild the path
                        var newdata = JSON.stringify(action.payload.target.path);     // convert to string       
                        
                        newdata = newdata.replace(/,/g , ' ');  // substitute comma with spaces
                        newdata = newdata.replace(/\[/g , '');  // get rid of open parenthesis        
                        newdata = newdata.replace(/\]/g , '');  // get rid of close parenthesis              
                        newdata = newdata.replace(/\"/g , '');  // get rid of extra characters
                        
                        path.path = newdata;
                        
                        var mypath = Skia.Path.MakeFromSVGString(newdata);
                        
                        var myoffsetx = action.payload.target.left - action.payload.lastleft;
                        var myoffsety = action.payload.target.top - action.payload.lasttop;

                        
/*
                            const m = Skia.Matrix()
                            m.scale(action.payload.origobj.scaleX,action.payload.origobj.scaleY);
                            
                            
                            mypath.transform(m);
  */  



                        mypath.offset(myoffsetx / action.payload.origobj.scaleX, myoffsety / action.payload.origobj.scaleY);
                        

                        
                        
                        path.path = mypath;

                    }
                }
            });
            return{
                ...state,
                path_array: [...state.path_array]
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
        case 'MOD_ELLIPSE':
            // try to modify the ellipse object here because 
            // it is not possibile into the RoomClient...
            state.ellipse_array.forEach((ellipse) => {                
                if(ellipse.id == action.payload.elementID)
                {
                    
                    if(action.payload.action == "delete")
                    {
                        ellipse.x += 2500;
                        ellipse.y += 2500;
                    }
                    else
                    {                    
                        ellipse.x = action.payload.target.left;
                        ellipse.y = action.payload.target.top;

                        if(action.payload.transform.action == "scale"){
                            ellipse.width = ellipse.width * action.payload.origobj.scaleX;
                            ellipse.height = ellipse.height * action.payload.origobj.scaleY;    
                        }
                    }
                    //image.angle = action.payload.target.angle;                    
                }
            });
            return{
                ...state,
                ellipse_array: [...state.ellipse_array]
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
        case 'MOD_RECT':
            // try to modify the rect object here because 
            // it is not possibile into the RoomClient...
            state.rect_array.forEach((rect) => {                
                if(rect.id == action.payload.elementID)
                {
                    
                    if(action.payload.action == "delete")
                    {
                        rect.x += 2500;
                        rect.y += 2500;
                    }
                    else
                    {                    
                        rect.x = action.payload.target.left;
                        rect.y = action.payload.target.top;
                        
                        rect.width = rect.width * action.payload.origobj.scaleX;
                        rect.height = rect.height * action.payload.origobj.scaleY;
                    }
                    //rect = action.payload.origobj;

                    //image.angle = action.payload.target.angle;                    
                }
            });
            return{
                ...state,
                rect_array: [...state.rect_array]
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
        case 'MOD_LINE':
            // try to modify the line object here because 
            // it is not possibile into the RoomClient...
            state.line_array.forEach((line) => {                
                if(line.id == action.payload.elementID)
                {
                    if(action.payload.action == "delete")
                    {
                        line.x1 += 2500;
                        line.y1 += 2500;
                        line.x2 += 2500;
                        line.y2 += 2500;

                    }
                    else
                    {
                        // determine the slope of the line in order to decide 
                        // what vertex is what
                        var myx1, myx2, myy1, myy2
                        if(action.payload.target.x1 < 0 && action.payload.target.y1 < 0) // this case is the following slope: /
                        {
                            myx1 = action.payload.target.left;
                            myy1 = action.payload.target.top;
                            myx2 = action.payload.target.left + action.payload.target.width * action.payload.origobj.scaleX;
                            myy2 = action.payload.target.top + action.payload.target.height * action.payload.origobj.scaleY;
                        }
                        else // this case is the following slope: \
                        {
                            myx1 = action.payload.target.left;
                            myy1 = action.payload.target.top + action.payload.target.height * action.payload.origobj.scaleY;
                            myx2 = action.payload.target.left + action.payload.target.width * action.payload.origobj.scaleX;
                            myy2 = action.payload.target.top;
                        }
                        
                        line.x1 = myx1; 
                        line.y1 = myy1; 
                        line.x2 = myx2;
                        line.y2 = myy2;
                    }
                }
            });
            return{
                ...state,
                line_array: [...state.line_array]
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
        case 'MOD_TEXT':
            // try to modify the text object here because 
            // it is not possibile into the RoomClient...
            state.text_array.forEach((text) => {                
                if(text.id == action.payload.elementID)
                {
                    text.x = action.payload.target.left;
                    text.y = action.payload.target.top;
                    //text.angle = action.payload.target.angle;                    
                }
            });
            return{
                ...state,
                text_array: [...state.text_array]
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
        case 'MOD_IMAGE':
            // try to modify the image object here because 
            // it is not possibile into the RoomClient...
            state.image_array.forEach((image) => {                
                if(image.id == action.payload.elementID)
                {
                    image.x = action.payload.target.left;
                    image.y = action.payload.target.top;
                    if(action.payload.target.left != 2500 || action.payload.target.top != 2500)
                    {
                        image.scalex = action.payload.origobj.scaleX;
                        image.scaley = action.payload.origobj.scaleY;    
                    }

                    //image.angle = action.payload.target.angle;                    
                }
            });
            return{
                ...state,
                image_array: [...state.image_array]
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
        case 'SET_MIC_COUNT':
            return{
                ...state,
                micCount: action.payload
            };
        case 'ADD_MIC':
            return{
                ...state,
                mic_array: [...state.mic_array, action.payload]
            };
        case 'CLEAR_MICS':
            return{
                ...state,
                mic_array: []
            };     
        case 'SET_SPEAKER_COUNT':
            return{
                ...state,
                speakerCount: action.payload
            };        
        case 'ADD_SPEAKER':
            return{
                ...state,
                speaker_array: [...state.speaker_array, action.payload]
            };
        case 'CLEAR_SPEAKERS':
            return{
                ...state,
                speaker_array: []
            };     
        
        case 'SET_CAM_COUNT':
            return{
                ...state,
                camCount: action.payload
            };
        case 'ADD_CAM':
            return{
                ...state,
                cam_array: [...state.cam_array, action.payload]
            };
        case 'CLEAR_CAMS':
            return{
                ...state,
                cam_array: []
            };     
        case 'SET_USBCAMERAREADY':
            return{
                ...state,
                usbcamera_ready: action.payload
            };
        case 'SET_CURRENTPAGE':
            return{
                ...state,
                current_page: action.payload
            };
      
        case 'SET_EJECTED':
            return{
                ...state,
                ejected: action.payload
            };
        case 'SET_LOBBY':
            return{
                ...state,
                lobby: action.payload
            };
        case 'SET_DEVICEBRAND':
            return{
                ...state,
                device_brand: action.payload
            };
        case 'SET_DEVICENAME':
            return{
                ...state,
                device_name: action.payload
            };
                    
        default:
            return state;
    }
};

export default Reducer;