import React, { useEffect, useRef, useState, useContext } from "react";
import {Canvas, Circle, Oval, Group, Image, Paint, Path, Rect, Line, vec} from "@shopify/react-native-skia";
import Store, {Context} from '../global/Store';
 
export function RoomBoard(props){
    const [state, dispatch] = useContext(Context);
    const size = 60;
    const r = size * 0.33;
  
    return (
        <Canvas style={props.containerStyle} >
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
                            width={image.width}
                            height={image.height}
                        />
                      ))          
                }
            </Group>
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
                        // draw the pointer fill in red semi transparent
                        (state.pointer_x != null && state.pointer_y != null)?(<Circle cx={state.pointer_x} cy={state.pointer_y} r={r} color="#FF000044" />):null
                    } 
                    {
                        // draw the pointer stroke in full red
                        (state.pointer_x != null && state.pointer_y != null)?(<Circle cx={state.pointer_x} cy={state.pointer_y} r={r} color="#FF0000" style="stroke" strokeWidth={3}/>):null
                    } 
            </Group>
        </Canvas>        
    );
}
