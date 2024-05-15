# RoomXR React Native Client

This is the Android / iOS client that connects with RoomXR Server, built with React Native, Mediasoup and Socket.io. 
It is also composed of a lot of native android code in order to connect to different glasses.

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

## Reset and Clean project
every time we add some package we have to reset and rebuild the   
project, we can do by executing the following codes from project's root:   
```
watchman watch-del-all
cd .\android\
.\gradlew clean
cd ..
rm -r node_modules/
rm yarn.loc
yarn cache clean --force
rm -r $TMPDIR/metro-* 
rm -r $TMPDIR/haste-* 
yarn install
```

## Procedure for App Update
Every time we publish a new version we have to update the auto-update system
This system rely on checking a file on Holomask Server and decide if there is a new
version available.
We need to update a lot of things:
- /android/app/build.grade , update versionCode and versionName adding 1 to both
- test-version-arm64-v8a.json , change apkurl to the correspondant folder on server
- test-version-win_x64.json , change apkurl to the correspondant folder on server
- test-version-armeabi-v7a.json , change apkurl to the correspondant folder on server
- compile apks
- put apks on server
- update also the config page in RoomXR PRO...


## Todo:
- [LOW] Implement Device Chooser (camera and audio)...
- [LOW] test on iOS
- [EVA] implement login
- [EVA] implement room choice
- [LOW] explore expo compilation
- [LOW] implement voice recognition with: pocketsphynx
- [EVA] implement chat with: https://github.com/FaridSafi/react-native-gifted-chat
- [EVA] possibility to remove reanimated2 dependency
- [LOW] Save usb option to the persistent memory
- [FIX] Evaluate why scannerpage crashes sometimes, maybe because it searches for back camera and   
  not always is present
- [FIX] First chat message is not displayed on the Univet glasses
- [FIX] Change camera required parameter in AndroidManifest to true to check if it resolves the cases in which the camera does not reconnect



## In Progress:
take photo while streaming... (bah)



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
- (Whiteboard) Laser pointer
- (Whiteboard) Rect tool
- (Whiteboard) Oval tool
- (Whiteboard) Text tool
- (Whiteboard) Line tool
- [FIX] make usb permissions generic for all phones
- [FIX] reach univet USB in every phone
- (Whiteboard) implement resolution independent whiteboard
- [FIX] Manage socket.io disconnection gracely
- Implement QRCode Reader
- Save config to internal storage
- GUI redesign
- [FIX] drawing order wrong
- QRCode Guest generation on GUI
- [FIX] mirrored self camera and screenshare wrong
- [FIX] clean display after disconnection
- Clean Chat Button on GUI
- [FIX] require permission only in case of USB Glasses
- [FIX] loopback does not stop when leave mainpage
- Live Pointer on Univet Glasses
- Toggle Display on Univet Glasses
- Toggle LoopBack on Univet Glasses
- [FIX] lowered targetsdk to 30 in order to avoid errors on Android 12,13
- LoopBack disabled by default
- Univet custom buttons (video and loopback) showed only if USB Case
- [FIX] clean board whenever screen sharing starts
- [FIX] Manage audio peripherals switch automatically
- [FIX] Clean the board if a full picture arrive
- (Whiteboard) implement Decals
- [FIX] Decals show base64 decode error
- [FIX] paths dont move in sync at all, stay in place.
- give possibility to hide miniature preview of other partecipants by touching it
- [FIX] hide pointer after a clearscreen
- [FIX] blend mode to srcOver
- [FIX] dynamic interface with better buttons
- [FIX] manage difference between screenshot , images and decals
- [FIX] manage the correct exit from glasses, deleting pointers and other stuff
- [FIX] Evaluate disconnect and riconnect the Univet glasses cases, it should gracely manage those states
  at the moment we could also try to remove ReactNAtiveUsbMOdule at all and do everything at UvcCapturer level...
- [ENH] added new autoupdate mechanism
- [FIX] fixed crash when eraser was used on images
- [FIX] fixed crash when chat was cleared (only on EPSON MOVERIO)
- [ENH] add locking mechanism for UI
- [FIX] fixed crash when eraser was used on lines, circles, rects
- [ENH] add volume buttons on UI to compensate for phones that limit physical buttons to media volume instead of call volume


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

### Ver. 0.3 Alpha:
- (Whiteboard) Laser Pointer integrated
- (Whiteboard) Basic image exchange on whiteboard
- (Whiteboard) Rect, Oval, Line, Text tool integrated

### Ver. 0.4 Beta:
- [FIX] make usb permissions generic for all phones
- [FIX] reach univet USB in every phone
- (Whiteboard) implement resolution independent whiteboard

### Ver. 0.5 Beta:
- [FIX] Manage socket.io disconnection gracely
- Implement QRCode Reader

### Ver. 0.6 Beta:
- [FIX] Get real screen dimensions for all devices
- Implement Splash screen to collect relevant info
- Implement back button in QRCode reader to return without read
- Save config to internal storage

### Ver. 0.7 Beta:
- GUI redesign
- [FIX] drawing order wrong
- QRCode guest generation on GUI
- [FIX] mirrored self camera and screenshare wrong
- [FIX] clean display after disconnection
- Clean Chat Button on GUI
- [FIX] require permission only in case of USB Glasses
- [FIX] loopback does not stop when leave mainpage

### Ver. 0.8 Beta:
- Live Pointer on Univet Glasses
- Toggle Display on Univet Glasses
- Toggle LoopBack on Univet Glasses
- [FIX] lowered targetsdk to 30 in order to avoid errors on Android 12,13

### Ver. 0.8.5 Beta:
- LoopBack disabled by default
- Univet custom buttons (video and loopback) showed only if USB Case
- [FIX] clean board whenever screen sharing starts
- [FIX] Manage audio peripherals switch automatically

### Ver. 0.8.6 Beta:
- (Whiteboard) implement Decals
- [FIX] Clean the board if a full picture arrive
- [FIX] Decals show base64 decode error

### Ver. 0.8.6 Beta:
- [FIX] paths dont move in sync at all, stay in place.
- give possibility to hide miniature preview of other partecipants by touching it
- [FIX] hide pointer after a clearscreen
- [FIX] blend mode to srcOver
- [FIX] dynamic interface with better buttons
- [FIX] manage difference between screenshot , images and decals
- [FIX] manage the correct exit from glasses, deleting pointers and other stuff

### Ver. 1.0.0:
- [ENH] added new auto update mechanism

### Ver. 1.0.1:
- [FIX] fixed crash when eraser was used on images
- [FIX] fixed crash when chat was cleared (only on EPSON MOVERIO)
- [ENH] add locking mechanism for UI

### Ver. 1.0.2:
- [FIX] fixed crash when eraser was used on lines, circles, rects
- [ENH] add volume buttons on UI to compensate for phones that limit physical buttons to media volume instead of call volume


### Ver. 1.0.3:
- [ENH] add custom splash phrase instead of Holomask - Univet

## Univet Camera Procedure

1. install ReactNativeUsbModule from: https://github.com/andy-shea/react-native-usb
2. follow the readme instruction in order to modify but not this one: "Add new ReactNativeUsbPackage() to the list returned by the getPackages() method"  
  otherwise an error will occur
3. change ReactNativeUsbModule.java and the others .java accordingly with the file stored in the changes folder (they are .txt files)
4. add UsbCapturer.java from changes directory
5. add to the build gradle of reactnativeWebRTC the folowing:  
'''implementation("com.serenegiant:common:${commonLibVersion}") {
	    exclude module: 'support-v4'
    }'''
6. it's better the following;
''' implementation 'com.licheedev:usbcameracommon:1.0.1' '''
7. raise sdk in build.gradle of reactnativeWebRTC to 26 (please refer to the build.gradle put in the changes folder)
8. in general the whole project was raised to 26 minimum, the changes are in git, so nothing to change manually
9. The core of the connection with Univet Glasses is in the UsbCapturer.java file. In that file we connect both to UsbCamera and    
the display of glasses. This file and the other associated are in the ReactNativeWebRTC implementation so everytime something   
changes in that project we must fix it with our changes.

## React Univet Bridge

The communication between React Native and the glasses is made by adding some support functions in MediaDevices class that is already   
exposed to ReactNative, in particular if we would like to add showTextMessage function we must modify:
- INDEX.TS - extend the register globals by adding our new function
- MEDIADEVICES.TS - it's the bridge where the function is exported
- SHOWTEXTMESSAGE.TS - it's a new file where a bridge funcion is called from WebRTCModule.java (if the function involves a promise it is not necessary)
- WebRTCModule.java - here we call the GetUserMediaImpl.java that finally calls the real function in UsbCapturer.java
- GetUserMediaImpl.java - direct call to the real function in UsbCapturer.java

**NOTICE! if a new file is added, please add it to the changes section and also to the batch files tha copy the relevant changes to git.**

- to send notification to javascript from JAVA we can do the following:   
https://reactnative.dev/docs/native-modules-android#sending-events-to-javascript

## Phones compatible so far
- Epson control unit, it is compatible, but the USB camera of Univet Glasses is badly recognized and is null.  
  vendorID= 1155, DEV: eRGlassFb - PID: a306 - VID: 483  
  vendorID= 0, DEV: null - PID: 0 - VID: 0

- Galaxy XCover 4s, it is fully compatible  
  vendorID= 1155, DEV: eRGlassFb - PID: a306 - VID: 483  
  vendorID= 3141, DEV: USB 2.0 Camera - PID: 6366 - VID: c45


## Notes

A normal external USB Camera works as is with no usb external libraries, i.e. the one on the helmet is working properly  
So, to use a normal USB UVC Compatible camera it is enough to click change camera in order to switch to the external one

## QRCode format definition
in order to connect to roomxr in the format  https://roomxr.eu:5001/join/holomask-test?name=ciccio&notify=0   
we have to conform to this qrcode format:

```
{
  "user":"pippo",
  "base":"https://roomxr.eu:5001",
  "room":"holomask-test"
}
```

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

### Image definition
```
{
  "angle": 0, 
  "backgroundColor": "", 
  "cropX": 0, "cropY": 0, 
  "crossOrigin": null, 
  "fill": "rgb(0,0,0)", 
  "fillRule": "nonzero", 
  "filters": [], 
  "flipX": false, "flipY": false, 
  "globalCompositeOperation": "source-over", 
  "height": 30, 
  "left": 131, 
  "opacity": 1, 
  "originX": "left", "originY": "top", 
  "paintFirst": "fill", 
  "scaleX": 2.62, "scaleY": 2.62, 
  "shadow": null, 
  "skewX": 0, "skewY": 0, 
  "src": "data:image/png;base64,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", 
  "stroke": null, "strokeDashArray": null, "strokeDashOffset": 0, "strokeLineCap": "butt", "strokeLineJoin": "miter", "strokeMiterLimit": 4, "strokeUniform": false, "strokeWidth": 0, 
  "top": 78, 
  "type": "image", 
  "version": "5.2.4", 
  "visible": true, 
  "width": 30}
```

### Rect definition
```
{
  "type":"rect",
  "version":"5.2.4",
  "originX":"left","originY":"top",
  "left":145,"top":58.5,
  "width":290,"height":194,
  "fill":"#FFFFFF77",
  "stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,
  "scaleX":1,"scaleY":1,
  "angle":0,
  "flipX":false,"flipY":false,
  "opacity":1,
  "shadow":null,
  "visible":true,
  "backgroundColor":"",
  "fillRule":"nonzero",
  "paintFirst":"fill",
  "globalCompositeOperation":"source-over",
  "skewX":0,"skewY":0,
  "rx":0,"ry":0}
```

### Ellipse defintion
```
 {
  "type":"ellipse",
  "version":"5.2.4",
  "originX":"left","originY":"top",
  "left":541,"top":221.5,
  "width":226,"height":205,
  "fill":"#FFFFFF77",
  "stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,
  "scaleX":1,"scaleY":1,
  "angle":0,
  "flipX":false,"flipY":false,
  "opacity":1,
  "shadow":null,
  "visible":true,
  "backgroundColor":"",
  "fillRule":"nonzero",
  "paintFirst":"fill",
  "globalCompositeOperation":"source-over",
  "skewX":0,"skewY":0,
  "rx":113,"ry":102.5}
```


### Line definition
```
{
  "type":"line",
  "version":"5.2.4",
  "originX":"left","originY":"top",
  "left":65,"top":54.5,
  "width":285,"height":204,
  "fill":"#FFFFFFFF",
  "stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"round","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,
  "scaleX":1,"scaleY":1,
  "angle":0,
  "flipX":false,"flipY":false,
  "opacity":1,
  "shadow":null,
  "visible":true,
  "backgroundColor":"",
  "fillRule":"nonzero",
  "paintFirst":"fill",
  "globalCompositeOperation":"source-over",
  "skewX":0,"skewY":0,
  "x1":142.5,"x2":-142.5,"y1":-102,"y2":102
  }
```

# Text definition
```
{
  "type":"text",
  "version":"5.2.4",
  "originX":"left","originY":"top",
  "left":100,"top":100,
  "width":89.52,"height":45.2,
  "fill":"#FFFFFFFF",
  "stroke":"#FFFFFFFF","strokeWidth":3,"strokeDashArray":null,"strokeLineCap":"butt","strokeDashOffset":0,"strokeLineJoin":"miter","strokeUniform":false,"strokeMiterLimit":4,
  "scaleX":1,"scaleY":1,
  "angle":0,
  "flipX":false,"flipY":false,
  "opacity":1,
  "shadow":null,
  "visible":true,
  "backgroundColor":"",
  "fillRule":"nonzero",
  "paintFirst":"fill",
  "globalCompositeOperation":"source-over",
  "skewX":0,"skewY":0,
  "fontFamily":"Comfortaa",
  "fontWeight":"normal","fontSize":40,
  "text":"ciao",
  "underline":false,
  "overline":false,
  "linethrough":false,
  "textAlign":"left",
  "fontStyle":"normal",
  "lineHeight":1.16,
  "textBackgroundColor":"",
  "charSpacing":0,
  "styles":[],
  "direction":"ltr",
  "path":null,
  "pathStartOffset":0,
  "pathSide":"left",
  "pathAlign":"baseline"
}
```