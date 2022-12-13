import React, { useEffect, useRef, useState, useContext } from "react";
import {Canvas, Circle, Group, Drawing, Skia, Path} from "@shopify/react-native-skia";
import Store, {Context} from '../global/Store';
 
export function RoomBoard(props){
    const [state, dispatch] = useContext(Context);
    const size = 256;
    const r = size * 0.33;
  
    return (
        <Canvas style={props.containerStyle} >
            <Group blendMode="multiply">
                {
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
            {/*
            <Drawing
                drawing={({ canvas, paint }) => {
                    paint.setColor(Skia.Color("cyan"));
                    canvas.drawCircle(r, r, r, paint);
                    paint.setColor(Skia.Color("magenta"));
                    canvas.drawCircle(size - r, r, r, paint);
                    paint.setColor(Skia.Color("yellow"));
                    canvas.drawCircle(size / 2, size - r, r, paint);
                    
                }}
            />*/}
            </Group>
        </Canvas>        
    );
}
