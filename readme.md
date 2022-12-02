RoomXR React Native Client
==========================
This is the Android / iOS client that connects with RoomXR Server, built with React Native, Mediasoup and Socket.io. 


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

if using react navigation, please follow the instructions on prerequisites on: https://reactnavigation.org/docs/getting-started/ (add override in mainactivity)  
any way the code changes are reflected to git, so it should be present as is.

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
- Implement Device Chooser (camera and audio)...
- Implement QRCode Reader
- test on iOS
- implement whiteboard using: https://github.com/wobsoriano/rn-perfect-sketch-canvas
- implement login
- implement room choice
- explore expo compilation
- implement voice recognition with: pocketsphynx


IN PROGRESS:
============
- implement chat with: https://github.com/FaridSafi/react-native-gifted-chat
- investigate why closeproducer is not called

DONE:
=====
- implement git (done with github)
- if room is empty crashes
- fix screen sharing Start/Stop
- transform roomclient to functional component, please read the mediasoup example in order to understand.
- Implement Screen Navigation System using: https://reactnative.dev/docs/navigation or reactnavigation.org
- Implement Univet Glasses Stream
- Implement Orientation lock to Landscape mode


ChangeList:
===========



USB CAMERA TEST
===============

- install ReactNativeUsbModule from: https://github.com/andy-shea/react-native-usb
- follow the readme instruction in order to modify but not this one: "Add new ReactNativeUsbPackage() to the list returned by the getPackages() method"  
  otherwise an error will occur
- change ReactNativeUsbModule.java and the others .java accordingly with the file stored in the changes folder (they are .txt files)
- add UsbCapturer.java from changes directory
- add to the build gradle of webrtcnative the folowing:  
'''implementation("com.serenegiant:common:${commonLibVersion}") {
	    exclude module: 'support-v4'
    }'''
- it's better the following;
''' implementation 'com.licheedev:usbcameracommon:1.0.1' '''





NOTES
=====
A normal external USB Camera works as is with no usb external libraries, i.e. the one on the helmet is working properly



