Project Initialization
======================

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

Android Build APK
=================
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

TODO:
=====
- why closeproducer is not called
- test on iOS
- implement git
- implement chat messages
- implement whiteboard using: https://github.com/wobsoriano/rn-perfect-sketch-canvas
- fix screen sharing Start/Stop
- implement login
- implement room choice
- explore expo compilation


IN PROGRESS:
============
- implement chat with: https://github.com/FaridSafi/react-native-gifted-chat

DONE:
=====
- if room is empty crashes
- transform roomclient to functional component... please read the mediasoup example in order to understand.