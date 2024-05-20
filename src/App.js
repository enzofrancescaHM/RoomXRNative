/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import  Store  from './global/Store';
import { Camera} from 'react-native-vision-camera';

import { PermissionsPage } from './component/PermissionPage';
import { StartPage } from './component/StartPage';
import { MainPage } from './component/MainPage';
import { SplashPage } from './component/SplashPage';
import { ScannerPage } from './component/ScannerPage';
import { QRCodePage } from './component/QRCodePage';
import { MainPageVuzix } from './component/MainPageVuzix';


const Stack = createNativeStackNavigator();
const App = () => {
  
  const [cameraPermission, setCameraPermission] = useState();
  const [microphonePermission, setMicrophonePermission] = useState();
  
  useEffect(() => {
    Camera.getCameraPermissionStatus().then(setCameraPermission);
    Camera.getMicrophonePermissionStatus().then(setMicrophonePermission);
  }, []);

  console.log(`Re-rendering Navigator. Camera: ${cameraPermission} | Microphone: ${microphonePermission}`);

  if (cameraPermission == null || microphonePermission == null) {
    // still loading
    return null;
  }
  const showPermissionsPage = cameraPermission !== 'authorized' || microphonePermission === 'not-determined';
  
  return (
    
    <NavigationContainer>
      <StatusBar
          animated={true}
          backgroundColor="transparent"
        />
        <Store>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animationTypeForReplace: 'push',
            }}
            initialRouteName={showPermissionsPage ? 'PermissionsPage' : 'SplashPage'}>
            <Stack.Screen name="PermissionsPage" component={PermissionsPage} />
            <Stack.Screen name="StartPage" component={StartPage} />
            <Stack.Screen name="MainPage" component={MainPage} />
            <Stack.Screen name="MainPageVuzix" component={MainPageVuzix} />
            <Stack.Screen name="ScannerPage" component={ScannerPage} />
            <Stack.Screen name="SplashPage" component={SplashPage} />
            <Stack.Screen name="QRCodePage" component={QRCodePage} />

          </Stack.Navigator>    
        </Store>
    </NavigationContainer>
    
  );
 };

export default App;
