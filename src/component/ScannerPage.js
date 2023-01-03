import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useCameraDevices } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, useFrameProcessor } from 'vision-camera-code-scanner';
// local project imports
import Store, {Context} from '../global/Store';

export function ScannerPage({navigation}){

  const devices = useCameraDevices();
  const device = devices.back;
  const [state, dispatch] = useContext(Context);

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });

  
  const [deco, setDeco] = useState("");
  const [isActive, setIsActive] = useState(true);

  /*useEffect(() => {
      console.log("useeffect");
      if(deco != "")
      {
        console.log("ci siamo");
        setIsActive(false);
        dispatch({ type: 'SET_PEER_NAME', payload:deco.user});          
        dispatch({ type: 'SET_ROOT', payload:deco.base});
        dispatch({ type: 'SET_ROOM', payload:deco.room});  
        navigation.replace('StartPage');
      }
  }, [deco]);*/

  React.useEffect(() => {
    
    console.log(barcodes);
    barcodes.map((barcode, idx) => (
      getBarcode(barcode.displayValue)
    ));
  }, [barcodes]);

  
  /**
   * Evaluate barcode read by the camera in order to
   * extrapolate config info such as room address and 
   * username
   * @param {*} barcodevalue 
   */
  function getBarcode(barcodevalue){
        //console.log(barcodevalue);
        
        setIsActive(false);
        // Sanity check, assure that this is a valid qrcode
        if(barcodevalue.includes('user') && barcodevalue.includes('room') && barcodevalue.includes('base'))
        {
          console.log("siamo dentro");
          var dec = (JSON.parse(barcodevalue)); 
          dispatch({ type: 'SET_PEER_NAME', payload:dec.user});          
          dispatch({ type: 'SET_ROOT', payload:dec.base});
          dispatch({ type: 'SET_ROOM', payload:dec.room});  
          navigation.replace('StartPage');        
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