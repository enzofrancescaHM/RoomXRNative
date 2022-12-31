/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import { Node, useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  StyleSheet,
  useColorScheme,
  StatusBar,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import Store from './global/Store';
//import {SocketContext, socket} from './global/socket';
import { Camera} from 'react-native-vision-camera';
//import { CameraPage } from './component/CameraPage';
import { PermissionsPage } from './component/PermissionPage';
import { TestPage } from './component/TestPage';
import { HomePage } from './component/HomePage';
import { StartPage } from './component/StartPage';
import MainPage from './component/MainPage';
const Stack = createNativeStackNavigator();

const App: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

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
    {/* <SocketContext.Provider value={socket}> */}
      <Store>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animationTypeForReplace: 'push',
          }}
          initialRouteName={showPermissionsPage ? 'PermissionsPage' : 'StartPage'}>
          <Stack.Screen name="PermissionsPage" component={PermissionsPage} />
          <Stack.Screen name="StartPage" component={StartPage} />
          <Stack.Screen name="MainPage" component={MainPage} />
        </Stack.Navigator>    
      </Store>
    {/* </SocketContext.Provider> */}
  </NavigationContainer>
  
);
 };

export default App;
