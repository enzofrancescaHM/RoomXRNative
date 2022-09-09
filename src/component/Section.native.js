import type { Node } from 'react';
import React, { Component } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from 'react-native';

const Section = ({ children, title }): Node => {
    const isDarkMode = useColorScheme() === 'dark';
    return (
        <View style={styles.sectionContainer}>
            <Text
                style={[
                    styles.sectionTitle,
                    {
                        color: isDarkMode ? '#FFFFFF' : '#000000',
                    },
                ]}>
                {title}
            </Text>
            <Text
                style={[
                    styles.sectionDescription,
                    {
                        color: isDarkMode ? '#FFFFFF' : '#000000',
                    },
                ]}>
                {children}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    body: {
        backgroundColor: 'black',
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
        
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: '400',
    },
    highlight: {
        fontWeight: '700',
    },
});


export default Section;