import * as React from 'react';
import { useContext, useState } from 'react';
import { StyleSheet, Text, Image, View, TouchableOpacity } from 'react-native';
// local project imports
import Store, { Context } from '../global/Store';

export function QRCodePage({ navigation }) {

    const [state, dispatch] = useContext(Context);

    const imageBack = require("../images/back.png");

    const [isActive, setIsActive] = useState(true);

    function onPressFunction() {
        // come back to start page
        dispatch({ type: 'SET_CURRENTPAGE', payload: 'StartPage' });
        navigation.replace('StartPage');
    }

    const styles = StyleSheet.create({
        mainContainer: {
            flex: 1,
            flexDirection: "column",
            height: "100%",
            padding: 2,
            backgroundColor: '#000000',
            alignItems: 'center'
        },
        buttonFacebookStyle: {
            position: "absolute",
            backgroundColor: '#ffffff33',
            borderWidth: 0.5,
            borderColor: '#fff',
            width: state.real_width / 2.5,
            height: state.real_height / 5,
            borderRadius: 5,
            margin: 5,
            flex: 1,
            flexDirection: "row",
        },
        buttonImageIconStyle: {
            height: state.real_height / 5,
            width: state.real_height / 5,
            resizeMode: 'stretch',
        },
        buttonTextStyle: {
            color: '#fff',
            fontSize: state.real_height / 10,
            marginLeft: "auto",
            marginRight: "auto",
            marginTop: "auto",
            marginBottom: "auto",
            textAlign: "center",
        },
        buttonIconSeparatorStyle: {
            backgroundColor: '#fff',
            width: 1,
            height: state.real_height / 5,
        },
        buttonContainerTop: {
            position: "absolute",
            top: 20,
            left: 20,
            width: state.real_width,
            height: state.real_height / 5,
            backgroundColor: 'f00',
            zIndex: 100,
            zOrder: 100,
        },
        barcodeTextURL: {
            fontSize: 20,
            color: 'white',
            fontWeight: 'bold',
        },
    });

    return (
        device != null &&
        (
            <>

                <View style={styles.buttonContainerTop}>
                    <TouchableOpacity
                        style={styles.buttonScannerStyle}
                        activeOpacity={0.9}
                        onPress={onPressFunction}>
                        <Image
                            source={imageBack}
                            style={styles.buttonImageIconStyle}
                        />
                    </TouchableOpacity>
                </View>
            </>
        )
    );
}

