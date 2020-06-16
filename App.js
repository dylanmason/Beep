import 'react-native-gesture-handler';
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Platform, StyleSheet, StatusBar, AsyncStorage, Vibration } from 'react-native';
import { RegisterScreen } from './components/Register'
import { LoginScreen } from './components/Login'
import { MainScreen } from './components/MainScreen'
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry, Layout } from '@ui-kitten/components';
import { default as beepTheme } from './utils/theme.json';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { ThemeContext } from './utils/theme-context';
import * as SplashScreen from 'expo-splash-screen';

const Stack = createStackNavigator();
var initialScreen;

async function registerForPushNotificationsAsync() {
    if (Constants.isDevice) {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[App.js] [Push Notifications] Failed to get push token for push notification!');
            return;
        }

        //Get Token from Expo Push Notifications
        pushToken = await Notifications.getExpoPushTokenAsync();
        //Put Expo Notification Token in a state
        //setExpoPushToken(pushToken);
        //Store our push token in AsyncStorage
        AsyncStorage.setItem('@expoPushToken', pushToken);
        //Log that we saved a notification token in storage
        console.log("[Notifications] Wrote Expo Push Token to AsyncStorage: ", pushToken);
    }

    if (Platform.OS === 'android') {
        Notifications.createChannelAndroidAsync('default', {
            name: 'default',
            sound: true,
            priority: 'max',
            vibrate: [0, 250, 250, 250],
        });
    }
}

function _handleNotification(notification) {
    //Vibrate when we recieve a notification
    Vibration.vibrate();
    //Log the entire notification to the console
    console.log("[App.js] [Notifications] Notification Recieved: ", notification);
    //Store the most recent notification in a state
    //setNotification(notification);
}

async function startSplash() {
    // Prevent native splash screen from autohiding
    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (e) {
      console.warn(e);
    }
}

export default function App() {
    startSplash();

    const [expoPushToken, setExpoPushToken] = React.useState('');
    const [notification, setNotification] = React.useState({});
    const [token, setToken] = React.useState('');
    const [theme, setTheme] = React.useState('light');

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        AsyncStorage.setItem('@theme', nextTheme);
    };

    AsyncStorage.getItem('@theme').then((theme) => {
        if(theme) {
            setTheme(theme);
        }
      }, (error) => {
        //AsyncStorage could not get data from storage
        console.log("[App.js] [AsyncStorage] ", error);
    });


    //If we haven't deturmined an initial screen, run this code
    //We DONT want to run this code if we already know what screen to load
    if (initialScreen == null) {
        //When App loads initially, get token from AsyncStorage
        AsyncStorage.getItem('@token').then((token) => {
            if(token) {
                //Register for Expo Push Notifications
                registerForPushNotificationsAsync();
                //Add Listiner for Push Notifications
                Notifications.addListener(_handleNotification);
                //Token found in AsyncStorage!
                //This means a user is logged in on this device!
                //Because user is logged in, send them to Main initially
                initialScreen = "Main";
                //Log this to console
                console.log("[App.js] [Auth] Token found in storage: ", token);
                //Store token in state
                setToken(token);
            }
            else
            {
                //No Token found in AsyncStorage
                //This mean no one is logged in, send them to login page initally
                initialScreen = "Login";
                //Log this to console
                console.log("[App.js] [Auth] No token found, send user to Login");
                setToken(null);
            }
          }, (error) => {
            //AsyncStorage could not get data from storage
            console.log("[App.js] [AsyncStorage] ", error);
        });

        //We are checking if a token exists in AsyncStorage
        console.log("[App.js] Rendering Loading Screen");
        return(null);
    }

    //Loading is done! Render our main app
    console.log("[App.js] Rendering App with Intial Screen: ", initialScreen);

    return (
        <>
        <IconRegistry icons={EvaIconsPack} />
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ApplicationProvider {...eva} theme={{ ...eva[theme], ...beepTheme }}>
                <Layout style={styles.statusbar}>
                    <StatusBar barStyle={(theme === 'light' ? 'dark' : 'light') + "-content"} />
                </Layout>
                <NavigationContainer>
                    <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }} >
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Register" component={RegisterScreen} />
                        <Stack.Screen name="Main" component={MainScreen} />
                    </Stack.Navigator>
                </NavigationContainer>
            </ApplicationProvider>
        </ThemeContext.Provider>
        </>
    );
}

const styles = StyleSheet.create({
    statusbar: {
        paddingTop: Platform.OS === 'ios' ? 20 : 0
    }
});
