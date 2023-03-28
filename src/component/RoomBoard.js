import React, { useContext, useEffect, useState } from "react";
import {Canvas, Circle, Oval, Group, Image, Paint, Path, useCanvasRef, Fill, ImageFormat} from "@shopify/react-native-skia"; 
import {Rect, Line, vec,rect,Text, useFont, useValue,FitBox} from "@shopify/react-native-skia";
import Store, {Context} from '../global/Store';
import { mediaDevices } from "react-native-webrtc";
 
export function RoomBoard(props){
    const [state, dispatch] = useContext(Context);
    const mysize = 60;
    const r = mysize * 0.33;
    const fontSize = 100;
    const font = useFont(require("../fonts/Comfortaa-Bold.ttf"), fontSize);
    const size = useValue({ width: 0, height: 0 });
    const ref = useCanvasRef();
    var timeoutHandle;

    const [someNew, setSomeNew] = useState(false);


    useEffect(function componentDidMount() {
        console.log("%c RoomBoard componetDidMount", "color:green;");

         // wait 5 seconds in order to be sure the glasses are connected
         timeoutHandle = setTimeout(() => {
            if(state.usbcamera)
                dispatch({type: 'SET_USBCAMERAREADY', payload:true});
        }, 5000);


        return function componentWillUnmount() {
          clearTimeout(timeoutHandle);
        
          dispatch({type: 'SET_USBCAMERAREADY', payload:false});

          console.log("%c RoomBoard componetWillUnmount", "color:red")
        }
      }, [])



    useEffect(() => {
        setTimeout(() => {
            if(state.usbcamera && state.usbcamera_ready && someNew)
            {
                setSomeNew(false);
                
                // you can pass an optional rectangle
                // to only save part of the image
                const image = ref.current?.makeImageSnapshot();
                if (image) {
                    const data = image.encodeToBase64(ImageFormat.PNG, 100);
                        mediaDevices.showLoopBackCamera(false);
                        mediaDevices.showBitmap(data);           
                }
            }
        }, 1000);
      });

    useEffect(() => {
        console.log("image array changed!");
        if(state.image_array.length > 0 && state.usbcamera)
        {
            setSomeNew(true);
        }        
    }, [state.image_array])

    useEffect(() => {
        console.log("ellipse array changed!");
        if(state.ellipse_array.length > 0 && state.usbcamera)
        {
            setSomeNew(true);
        }
    }, [state.ellipse_array])

    useEffect(() => {
        console.log("rect array changed!");
        if(state.rect_array.length > 0 && state.usbcamera)
        { 
            setSomeNew(true);            
        }
    }, [state.rect_array])

    useEffect(() => {
        console.log("line array changed!");
        if(state.line_array.length > 0 && state.usbcamera)
        {
            setSomeNew(true);
        }
    }, [state.line_array])
    
    useEffect(() => {
        console.log("path array changed!");
        if(state.path_array.length > 0 && state.usbcamera)
        {
            setSomeNew(true);
        }        
    }, [state.path_array])
  
    useEffect(() => {
        console.log("text array changed!");
        if(state.text_array.length > 0 && state.usbcamera)
        {
            setSomeNew(true);
        }        
    }, [state.text_array])

    return (
        <>
        <Canvas style={props.containerStyle} onSize={size} onLayout={event => { console.log(JSON.stringify(size)) }} ref={ref}>             
            <FitBox src={rect(0, 0, 1200, 600)} dst={rect(0, 0, size.current.width, size.current.height)}> 
                <Group blendMode="srcOver">
                    {
                        // cycle the image array and draw on the canvas
                        state.image_array.map((image) => (
                            
                            <Image
                                image={image.image}
                                key={image.id}
                                fit="contain"
                                x={image.x}
                                y={image.y}
                                width={image.width * image.scalex}
                                height={image.height * image.scaley}
                            />
                        ))          
                    }
                </Group>
                <Group blendMode="srcOver">
                    {
                        // cycle the path array and draw on the canvas
                        state.path_array.map((path) => (
                            <Path
                            path={path.path}
                            key={path.id}
                            style="stroke"
                            strokeWidth={path.width}
                            color={path.color}
                            >
                                <Paint color={"#FF000000"} />
                                <Paint color={path.color} style="stroke" strokeWidth={path.width} />
                            </Path>
                        ))              
                    }
                </Group>
                <Group  blendMode="srcOver">
               
                    {
                        // cycle the path array and draw on the canvas
                        state.rect_array.map((rect) => (
                            <Rect                         
                            key={rect.id}
                            x={rect.x}
                            y={rect.y}
                            width={rect.width}
                            height={rect.height}
                            color={rect.strokeColor}
                            style="stroke"
                            >
                                <Paint color={rect.fillColor} />
                                <Paint color={rect.strokeColor} style="stroke" strokeWidth={rect.strokeWidth} />
                            </Rect>
                        ))              
                    }
                </Group>
                <Group blendMode="srcOver">
                    {
                        // cycle the path array and draw on the canvas
                        state.ellipse_array.map((ellipse) => (
                            <Oval                        
                            key={ellipse.id}
                            x={ellipse.x}
                            y={ellipse.y}
                            width={ellipse.width}
                            height={ellipse.height}
                            color={ellipse.strokeColor}
                            style="stroke"
                            >
                                <Paint color={ellipse.fillColor} />
                                <Paint color={ellipse.strokeColor} style="stroke" strokeWidth={ellipse.strokeWidth} />
                                
                            </Oval>
                        ))              
                    }
                </Group>
                <Group blendMode="srcOver">
                    {
                        // cycle the path array and draw on the canvas
                        state.line_array.map((line) => (
                            <Line                        
                            key={line.id}
                            p1={vec(line.x1, line.y1)}
                            p2={vec(line.x2, line.y2)}
                            color={line.strokeColor}
                            style="stroke"
                            strokeWidth={line.strokeWidth}
                            >                            
                            </Line>
                        ))              
                    }
                </Group>
                <Group blendMode="srcOver">
                {
                        // cycle the path array and draw on the canvas
                        state.text_array.map((text) => (                    
                            <Text
                                key={text.id}
                                x={text.x}
                                y={text.y + fontSize}
                                text={text.text}
                                font={font}
                            >
                                <Paint color={text.fillColor} />
                            </Text>                                   
                        ))
                    }
                </Group>
                <Group blendMode="srcOver">
                        {
                            // draw the pointer fill in red semi transparent
                            (state.pointer_x != null && state.pointer_y != null)?(<Circle cx={state.pointer_x} cy={state.pointer_y} r={r} color="#FF000044" />):null
                        } 
                        {
                            // draw the pointer stroke in full red
                            (state.pointer_x != null && state.pointer_y != null)?(<Circle cx={state.pointer_x} cy={state.pointer_y} r={r} color="#FF0000" style="stroke" strokeWidth={3}/>):null
                        } 
                </Group>
            </FitBox>
        </Canvas>   
        </>     
    );
}
