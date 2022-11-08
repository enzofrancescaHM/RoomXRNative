//import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState, useContext } from "react";
import {Colors} from 'react-native/Libraries/NewAppScreen';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    View,
    useColorScheme,
  } from 'react-native';
  import MainPage from './MainPage';


export function HomePage(){
  const mounted = useRef()

  useEffect(function componentDidMount() {
    console.log("%c MainPage componetDidMount", "color:green;");
    
    StatusBar.setHidden(true, 'none');

    //dispatch({type: 'SET_MEDIASOUPCLIENT', payload: mediasoupClient});
    return function componentWillUnmount() {
        console.log("%c MainPage componetWillUnmount", "color:red")
    }
}, [])

useEffect(function componentDidMountAndCompontDidUpdate() {
    console.log("%c MainPage componentDidMountAndCompontDidUpdate", "color:teal;")
})


useEffect(function runComponentDidUpdate() {
    if (!isComponetMounted()) {
        return
    }
    (function componentDidUpdate() {
        StatusBar.setHidden(true, 'none');
        console.log("%c MainPage CompontDidUpdateForAnyVariable", "color:orange;")
    })()
});

useEffect(function lastUseEffect() {
    signComponetAsMounted()
}, [])

function signComponetAsMounted() {
    mounted.current = true
}

function isComponetMounted() {
    if (!mounted.current) return false;
    return true;
}

    const isDarkMode = useColorScheme() === 'dark';

    const backgroundStyle = {
        flex: 1,
        padding: 0,
        backgroundColor: "#d9f587"
    };
    const backgroundStyle2 = {
        flex: 1,
        padding: 0,
        backgroundColor: "#d9f5FF"
      };
  
  
  return (
    <SafeAreaView style={backgroundStyle}>
        {<StatusBar hidden  />}
            <View
                contentInsetAdjustmentBehavior="automatic"
                style={backgroundStyle2}>               
                <MainPage></MainPage>      
            </View>
    </SafeAreaView>
  
  );
}

const styles = StyleSheet.create({
    sectionContainer: {
      marginTop: 32,
      paddingHorizontal: 24,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: '600',
    },
    sectionDescription: {
      marginTop: 8,
      fontSize: 18,
      fontWeight: '400',
    },
    highlight: {
      fontWeight: '700',
    },
  });