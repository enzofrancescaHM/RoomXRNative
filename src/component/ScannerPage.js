import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useCameraDevices } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, useFrameProcessor } from 'vision-camera-code-scanner';
import AsyncStorage from '@react-native-async-storage/async-storage';
// local project imports
import Store, {Context} from '../global/Store';

export function ScannerPage({navigation}){

  const devices = useCameraDevices();
  const device = devices.back;
  const [state, dispatch] = useContext(Context);

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });


  const setUserValue = async (value) => {
    try {
      console.log("writing: " + value);

      await AsyncStorage.setItem('user', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("user write error!");
    }
  
    console.log('user write done.');
  }

  const setRootValue = async (value) => {
    try {
      await AsyncStorage.setItem('root', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("root write error!");
    }
  
    console.log('root write done.');
  }
  const setRoomValue = async (value) => {
    try {
      await AsyncStorage.setItem('room', value.replace(/\"/g , ''))
    } catch(e) {
      // save error
      console.log("room write error!");
    }
  
    console.log('room write done.');
  }

  
  const [isActive, setIsActive] = useState(true);

  React.useEffect(() => {
    
    console.log(barcodes);
    barcodes.map((barcode, idx) => (
      getBarcode(barcode.displayValue, idx)
    ));
  }, [barcodes]);

  
  /**
   * Evaluate barcode read by the camera in order to
   * extrapolate config info such as room address and 
   * username
   * @param {*} barcodevalue 
   */
  async function getBarcode(barcodevalue, idx){

        console.log("idx: " + idx);
        if(idx == 0)
        {
          // stop reading barcodes
          setIsActive(false);
          // Sanity check, assure that this is a valid qrcode
          if(barcodevalue.includes('user') && barcodevalue.includes('room') && barcodevalue.includes('base'))
          {          
            console.log("barcode correct: " + barcodevalue );
            // build json object
            var dec = (JSON.parse(barcodevalue)); 

            console.log("user: " + dec.user + " base: " + dec.base + " room: " + dec.room );
            // store it in the persistent app memory
            await setUserValue(JSON.stringify(dec.user));
            await setRoomValue(JSON.stringify(dec.room));
            await setRootValue(JSON.stringify(dec.base));

            // store in the volatile app memory
            await dispatch({ type: 'SET_PEER_NAME', payload:dec.user});          
            await dispatch({ type: 'SET_ROOT', payload:dec.base});
            await dispatch({ type: 'SET_ROOM', payload:dec.room});  
            // come back to start page
            navigation.replace('StartPage');        
          }
          else{
            console.log("barcode incorrect!");
          }
      }
  }  

  return (
    device != null &&
     (
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={isActive}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
        {/*  {barcodes.map((barcode, idx) => (
                getBarcode(barcode.displayValue)
           <Text key={idx} style={styles.barcodeTextURL}>
            {barcode.displayValue}
          </Text>
 
        ))} */}
       </>
    )
  );
}

const styles = StyleSheet.create({
  barcodeTextURL: {
    fontSize: 20,
    color: 'white',
    fontWeight: 'bold',
  },
});