/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View } from 'react-native';
import {Store, Context} from './global/Store';
import { Camera} from 'react-native-vision-camera';
import { PermissionsPage } from './component/PermissionPage';
import { StartPage } from './component/StartPage';
import MainPage from './component/MainPage';
import { ScannerPage } from './component/ScannerPage';

const Stack = createNativeStackNavigator();
const App = () => {

  //const [state, dispatch] = useContext(Context);
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
  
  function setRealDimensions(rw,rh){
    // we are always in landscape mode so adjust the values accordingly
   /* if(rw > rh){
      dispatch({ type: 'SET_REAL_WIDTH', payload:rw});  
      dispatch({ type: 'SET_REAL_HEIGHT', payload:rh});  
    }
    else{
      dispatch({ type: 'SET_REAL_WIDTH', payload:rh});  
      dispatch({ type: 'SET_REAL_HEIGHT', payload:rw});    
    }*/
  }

  return (
    
    <NavigationContainer>
      
      {/* <View style={{flex: 1}} onLayout={(e)=>setRealDimensions(e.nativeEvent.layout.width, e.nativeEvent.layout.height)}> */}
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
              initialRouteName={showPermissionsPage ? 'PermissionsPage' : 'StartPage'}>
              <Stack.Screen name="PermissionsPage" component={PermissionsPage} />
              <Stack.Screen name="StartPage" component={StartPage} />
              <Stack.Screen name="MainPage" component={MainPage} />
              <Stack.Screen name="ScannerPage" component={ScannerPage} />
            </Stack.Navigator>    
          
        {/* </View> */}
        </Store>
    </NavigationContainer>
    
  );
 };

export default App;
