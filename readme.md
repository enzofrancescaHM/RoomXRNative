# RoomXR React Native Client

This is the Android / iOS client that connects with RoomXR Server, built with React Native, Mediasoup and Socket.io. 


## Project Initialization

npx react-native init RoomX
yarn add mediasoup-client --dev
yarn add react-native-webrtc --dev
yarn add socket.io-client --dev

add these lines to androidmanifest:

```
<uses-feature android:name="android.hardware.camera" />
<uses-feature android:name="android.hardware.camera.autofocus" />
<uses-feature android:name="android.hardware.audio.output" />
<uses-feature android:name="android.hardware.microphone" />

<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-permission android:name="android.permission.INTERNET" />
```

fixes: 
if error java.lang.NoSuchMethodError: No static method createEgl14([I)Lorg/webrtc/EglBase14; in class Lorg/webrtc/EglBase;
then you have to set minSdkVersion = 24 in build.gradle

if using react navigation, please follow the instructions on prerequisites on: https://reactnavigation.org/docs/getting-started/ (add override in mainactivity)  
any way the code changes are reflected to git, so it should be present as is.

## Android Build APK

create the folder asset in  android/app/src/main/assets/ if not present 

first the following command:
```
react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```
then:
```
cd android
./gradlew assembleDebug
```
the apk is now in: yourProject/android/app/build/outputs/apk/debug/app-debug.apk

## Todo:

- Implement Device Chooser (camera and audio)...
- Implement QRCode Reader
- test on iOS
- implement login
- implement room choice
- explore expo compilation
- implement voice recognition with: pocketsphynx
- implement chat with: https://github.com/FaridSafi/react-native-gifted-chat


## In Progress:
- implement resolution independent whiteboard


## Done:


- implement git (done with github)
- [FIX] if room is empty crashes
- [FIX] screen sharing Start/Stop
- transform roomclient to functional component, please read the mediasoup example in order to understand.
- Implement Screen Navigation System using: https://reactnative.dev/docs/navigation or reactnavigation.org
- Implement Univet Glasses Stream
- Implement Orientation lock to Landscape mode
- Implement Guest1 & Guest2 capabilities
- Implement loopback camera on main display Univet
- [FIX] investigate why closeproducer is not called
- implement whiteboard using: https://github.com/wobsoriano/rn-perfect-sketch-canvas


## Changelist:

### Ver. 0.1 Alpha:
- Univet USB Camera Working
- Screen Share Receiver
- Guest1, Guest2 Receiver
- Proto Chat Management

### Ver. 0.2 Alpha:
- Loopback Univet Camera on Univet Display
- IMU Univet Glasses implemented with touchpad
- SKIA Canvas implemented
- Basic WhiteBoard implementation (draw and clear)

### Ver 0.3 Alpha:





## Univet Camera Procedure

- install ReactNativeUsbModule from: https://github.com/andy-shea/react-native-usb
- follow the readme instruction in order to modify but not this one: "Add new ReactNativeUsbPackage() to the list returned by the getPackages() method"  
  otherwise an error will occur
- change ReactNativeUsbModule.java and the others .java accordingly with the file stored in the changes folder (they are .txt files)
- add UsbCapturer.java from changes directory
- add to the build gradle of reactnativeWebRTC the folowing:  
'''implementation("com.serenegiant:common:${commonLibVersion}") {
	    exclude module: 'support-v4'
    }'''
- it's better the following;
''' implementation 'com.licheedev:usbcameracommon:1.0.1' '''
- raise sdk in build.gradle of reactnativeWebRTC to 26 (please refer to the build.gradle put in the changes folder)
- in general the whole project was raised to 26 minimum, the changes are in git, so nothing to change manually
- The core of the connection with Univet Glasses is in the UsbCapturer.java file. In that file we connect both to UsbCamera and    
the display of glasses. This file and the other associated are in the ReactNativeWebRTC implementation so everytime something   
changes in that project we must fix it with our changes.

## React Univet Bridge

The communication between React Native and the glasses is made by adding some support functions in MediaDevices class that is already   
exposed to ReactNative, in particular if we would like to add showTextMessage function we must modify:
- INDEX.TS - extend the register globals by adding our new function
- MEDIADEVICES.TS - it's the bridge where the function is exported
- SHOWTEXTMESSAGE.TS - it's a new file where a bridge funcion is called from WebRTCModule.java
- WebRTCModule.java - here we call the GetUserMediaImpl.java that finally calls the real function in UsbCapturer.java
- GetUserMediaImpl.java - direct call to the real function in UsbCapturer.java

- to send notification to javascript from JAVA we can do the following:   
https://reactnative.dev/docs/native-modules-android#sending-events-to-javascript



## Notes

A normal external USB Camera works as is with no usb external libraries, i.e. the one on the helmet is working properly
So, to use a normal USB UVC Compatible camera it is enough to click change camera in order to switch to the external one


## Whiteboard Considerations

In order to reduce bandwidth passing between the peers we would like to sync the freeze frame on Remote Expert with the freeze frame   
on Glasses so to send only what is drow on the whiteboard (vector data, very lightwheigth).

### Strokes definition
```
{
  "version":"5.2.4",
  "objects":[
    {
      "type":"path",
      "version":"5.2.4",
      "originX":"left",
      "originY":"top",
      "left":273.5,
      "top":138.25,
      "width":47.01,
      "height":24.01,
      "fill":null,
      "stroke":"#FFFFFFFF",
      "strokeWidth":3,
      "strokeDashArray":null,
      "strokeLineCap":"round",
      "strokeDashOffset":0,
      "strokeLineJoin":"round",
      "strokeUniform":false,
      "strokeMiterLimit":10,
      "scaleX":1,
      "scaleY":1,
      "angle":0,
      "flipX":false,
      "flipY":false,
      "opacity":1,
      "shadow":null,
      "visible":true,
      "backgroundColor":"",
      "fillRule":"nonzero",
      "paintFirst":"fill",
      "globalCompositeOperation":"source-over",
      "skewX":0,
      "skewY":0,
      "path":[["M",322.003,139.747],["Q",322,139.75,321.5,140.25],["Q",321,140.75,319,141.75],["Q",317,142.75,315,143.75],["Q",313,144.75,309.5,146.75],["Q",306,148.75,302.5,150.25],["Q",299,151.75,296,153.75],["Q",293,155.75,288,157.75],["Q",283,159.75,280.5,160.75],["Q",278,161.75,276.5,162.75],["L",274.997,163.753]]
    },
    {"type":"path","version":"5.2.4","originX":"left","originY":"top","left":344.5,"top":229.25,"width":18.01,"height":14.01,"fill":null,"stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"round","strokeDashOffset":0,"strokeLineJoin":"round","strokeUniform":false,"strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"path":[["M",364.003,230.747],["Q",364,230.75,363,231.75],["Q",362,232.75,360.5,233.75],["Q",359,234.75,357.5,236.25],["Q",356,237.75,354.5,239.25],["Q",353,240.75,351,241.75],["Q",349,242.75,347.5,243.75],["L",345.997,244.753]]},
    {"type":"path","version":"5.2.4","originX":"left","originY":"top","left":395.5,"top":302.25,"width":27,"height":23,"fill":null,"stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"round","strokeDashOffset":0,"strokeLineJoin":"round","strokeUniform":false,"strokeMiterLimit":10,"scaleX":1,"scaleY":1,"angle":0,"flipX":false,"flipY":false,"opacity":1,"shadow":null,"visible":true,"backgroundColor":"","fillRule":"nonzero","paintFirst":"fill","globalCompositeOperation":"source-over","skewX":0,"skewY":0,"path":[["M",424.003,303.747],["Q",424,303.75,423.5,303.75],["Q",423,303.75,422,304.25],["Q",421,304.75,420.5,306.25],["Q",420,307.75,419.5,308.25],["Q",419,308.75,418,309.25],["Q",417,309.75,415.5,311.25],["Q",414,312.75,412.5,314.75],["Q",411,316.75,409,318.25],["Q",407,319.75,405.5,320.75],["Q",404,321.75,402.5,322.75],["Q",401,323.75,399.5,325.25],["Q",398,326.75,397.5,326.75],["L",397,326.75]]}
  ]
}
```