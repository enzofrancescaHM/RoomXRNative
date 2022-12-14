import React, { useEffect, useRef, useState, useContext } from "react";
import { StyleSheet, Button, Image, Text, TouchableOpacity, View, StatusBar, Alert, Switch } from "react-native";
import { Context } from '../global/Store';
import Orientation from 'react-native-orientation-locker';

import AsyncStorage from '@react-native-async-storage/async-storage';
//import { interpolateNode } from "react-native-reanimated";


export function SplashPage({ navigation }) {

    const [state, dispatch] = useContext(Context);
    const imageConnect = require("../images/connect.png");
    const imageHolomask = require("../images/holomask.png");
    const [loadingLabel, setLoadingLabel] = useState("loading");
    const [count, setCount] = useState(0);
    var timeoutHandle, intervalHandle;

    const clearBuffer = count > 3;

    const getUserValue = async () => {
        try {
            var myuser = await AsyncStorage.getItem('user');
            console.log("fresh user: " + myuser);
            dispatch({ type: 'SET_PEER_NAME', payload: myuser });
            return myuser;
        } catch (e) {
            // read error
            console.log("user read error!")
        }

        console.log('user Done.')
    }

    const getRoomValue = async () => {
        try {
            var myRoom = await AsyncStorage.getItem('room');
            console.log("fresh room: " + myRoom);
            dispatch({ type: 'SET_ROOM', payload: myRoom });
        } catch (e) {
            // read error
            console.log("room read error!")
        }

        console.log('room Done.')
    }
    
    const getRootValue = async () => {
        try {
            var myRoot = await AsyncStorage.getItem('root');
            console.log("fresh root: " + myRoot);
            dispatch({ type: 'SET_ROOT', payload: myRoot });
        } catch (e) {
            // read error
            console.log("root read error!")
        }

        console.log('root Done.')
    }

    useEffect(() => {
        setLoadingLabel("loading");
    },[clearBuffer])

    useEffect(() => {
        const id = setInterval(() => {            
            setCount(prevCount => prevCount + 1);            
            setLoadingLabel(prevLabel => prevLabel + ".");
        }, 300);
    
        return () => {
          clearInterval(id);
        };
      }, []);

    useEffect(function componentDidMount() {
        console.log("%c SplashPage componetDidMount", "color:green;");
        // read config from persistent memory        
        const user = getUserValue();
        const room = getRoomValue();
        const root = getRootValue();

        StatusBar.setHidden(true, 'none');
        Orientation.lockToLandscapeLeft();

        // Start counting when the page is loaded
        timeoutHandle = setTimeout(() => {

           navigation.replace('StartPage');
        }, 3000);

        return function componentWillUnmount() {
            //console.log("%c MainPage componetWillUnmount", "color:red")
            clearTimeout(timeoutHandle);
            clearTimeout(intervalHandle);
        }
    }, [])


    function setRealDimensions(rw, rh) {
        // we are always in landscape mode so adjust the values accordingly
        if (rw > rh) {
            dispatch({ type: 'SET_REAL_WIDTH', payload: rw });
            dispatch({ type: 'SET_REAL_HEIGHT', payload: rh });
        }
        else {
            dispatch({ type: 'SET_REAL_WIDTH', payload: rh });
            dispatch({ type: 'SET_REAL_HEIGHT', payload: rw });
        }
    }

    const styles = StyleSheet.create({
        mainContainer: {
            flex: 1,
            flexDirection: "column",
            height: "100%",
            padding: 1,
            backgroundColor: '#000000',
            alignItems: 'center'
        },
        buttonImageIconStyle: {
            height: state.real_height / 5,
            width: state.real_height / 5,
            resizeMode: 'stretch',
        },
       LogoStyle: {
            height: state.real_height / 6,
            resizeMode: 'contain',
        },
        labelTitle: {
            color: '#fff',
            marginTop: 0,
            fontSize: state.real_height / 7,
            textAlign: "center",
        },
        labelUser: {
            color: '#aaa',
            marginTop: 0,
            fontSize: state.real_height / 14,
            textAlign: "center",
            marginBottom: state.real_height / 10,
        },


    });

    return (
        <>
            <View style={styles.mainContainer} onLayout={(e) => setRealDimensions(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}>
                <Text style={styles.labelTitle}>RoomXR PRO</Text>
                <Text style={styles.labelUser}>{loadingLabel}</Text>
                <Image
                    source={imageConnect}
                    style={styles.LogoStyle}
                />        
                <Text style={styles.labelUser}>powered by</Text>        
                <Image
                    source={imageHolomask}
                    style={styles.LogoStyle}
                />
            </View>
        </>
    )
}



