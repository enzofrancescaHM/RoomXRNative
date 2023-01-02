import * as React from 'react';
import { useState } from 'react'; 

import { runOnJS } from 'react-native-reanimated';
import { StyleSheet, Text } from 'react-native';
import { useCameraDevices } from 'react-native-vision-camera';
import { Camera } from 'react-native-vision-camera';
import { useScanBarcodes, BarcodeFormat, useFrameProcessor } from 'vision-camera-code-scanner';

export function ScannerPage({navigation}){

  //const [hasPermission, setHasPermission] = React.useState(false);
  const devices = useCameraDevices();
  const device = devices.back;
  //const [barcodes, setBarcodes] = useState([]);
  //const [barcodes, setBc] = useState([]);

  const [frameProcessor, barcodes] = useScanBarcodes([BarcodeFormat.QR_CODE], {
    checkInverted: true,
  });

  /*
  function scanBarcodes(frame, types, options) {
    'worklet';
    // @ts-ignore
    // eslint-disable-next-line no-undef
    return __scanCodes(frame, types, options);
  }


   const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE], { checkInverted: true });
    runOnJS(setBc)(detectedBarcodes);
  }, []);

*/
    function getBarcode(barcodevalue){
        console.log(barcodevalue);
    }  

  return (
    device != null &&
     (
      <>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          frameProcessor={frameProcessor}
          frameProcessorFps={5}
        />
         {barcodes.map((barcode, idx) => (
                getBarcode(barcode.displayValue)
/*           <Text key={idx} style={styles.barcodeTextURL}>
            {barcode.displayValue}
          </Text>
 */
        ))}
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