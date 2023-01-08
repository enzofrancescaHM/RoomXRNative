import React, { useContext } from "react";
import {Canvas, Circle, Oval, Group, Image, Paint, Path} from "@shopify/react-native-skia"; 
import {Rect, Line, vec,rect,Text, useFont, useValue,FitBox} from "@shopify/react-native-skia";
import Store, {Context} from '../global/Store';
 
export function RoomBoard(props){
    const [state, dispatch] = useContext(Context);
    const mysize = 60;
    const r = mysize * 0.33;
    const fontSize = 42;
    const font = useFont(require("../fonts/Comfortaa-Bold.ttf"), fontSize);
    const size = useValue({ width: 0, height: 0 });
  
    return (
        <>
        <Canvas style={props.containerStyle} onSize={size} onLayout={event => { console.log(JSON.stringify(size)) }}>             
            <FitBox src={rect(0, 0, 1200, 600)} dst={rect(0, 0, size.current.width, size.current.height)}> 
                <Group blendMode="multiply">
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
            </FitBox>
            </Canvas>        
        <Canvas style={props.containerStyle} onSize={size} onLayout={event => { console.log(JSON.stringify(size)) }}>             
            <FitBox src={rect(0, 0, 1200, 600)} dst={rect(0, 0, size.current.width, size.current.height)}> 
                <Group blendMode="multiply">
                    {
                        // cycle the path array and draw on the canvas
                        state.path_array.map((path) => (
                            <Path
                            path={path.path}
                            key={path.id}
                            style="stroke"
                            strokeWidth={path.width}
                            color={path.color}
                            />
                        ))              
                    }
                </Group>
                <Group blendMode="multiply">
                    {
                        // cycle the path array and draw on the canvas
                        state.rect_array.map((rect) => (
                            <Rect                         
                            key={rect.id}
                            x={rect.x}
                            y={rect.y}
                            width={rect.width}
                            height={rect.height}
                            color={rect.fillColor}
                            >
                                <Paint color={rect.strokeColor} style="stroke" strokeWidth={rect.strokeWidth} />
                            </Rect>
                        ))              
                    }
                </Group>
                <Group blendMode="multiply">
                    {
                        // cycle the path array and draw on the canvas
                        state.ellipse_array.map((ellipse) => (
                            <Oval                        
                            key={ellipse.id}
                            x={ellipse.x}
                            y={ellipse.y}
                            width={ellipse.width}
                            height={ellipse.height}
                            color={ellipse.fillColor}
                            >
                                <Paint color={ellipse.strokeColor} style="stroke" strokeWidth={ellipse.strokeWidth} />
                            </Oval>
                        ))              
                    }
                </Group>
                <Group blendMode="multiply">
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
                <Group blendMode="multiply">
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
                <Group blendMode="multiply">
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
