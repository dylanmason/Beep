import 'react-native-gesture-handler';
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, AsyncStorage, Vibration } from 'react-native';
import { RegisterScreen } from './Register'
import { LoginScreen } from './Login'
import { MainScreen } from './MainScreen'
import { SplashScreen } from './SplashScreen'
import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { default as beepTheme } from './theme.json';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { ThemeContext } from './theme-context';

const Stack = createStackNavigator();
var initialScreen;

async function registerForPushNotificationsAsync()
{
    if (Constants.isDevice)
    {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted')
        {
            const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
            finalStatus = status;
        }
        if (finalStatus !== 'granted')
        {
            alert('Failed to get push token for push notification!');
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
    else
    {
        alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android')
    {
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
};

export default function App() {

    const [isLoading, setIsLoading] = React.useState(true);
    const [expoPushToken, setExpoPushToken] = React.useState('');
    const [notification, setNotification] = React.useState({});
    const [token, setToken] = React.useState('');
    const [theme, setTheme] = React.useState('light');

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        //TODO: Push theme to API to store in DB
        setTheme(nextTheme);
    };

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
                setIsLoading(false);
            }
          }, (error) => {
            //AsyncStorage could not get data from storage
            console.log("[App.js] [AsyncStorage] ", error);
        });

        //We are checking if a token exists in AsyncStorage
        console.log("[App.js] Rendering Loading Screen");
        return(
            <>
                <SplashScreen/>
            </>
        );
    }

    //Loading is done! Render our main app
    console.log("[App.js] Rendering App with Intial Screen: ", initialScreen);

    return (
        <>
        <StatusBar barStyle={(theme === 'light' ? 'dark' : 'light') + "-content"} />
        <IconRegistry icons={EvaIconsPack} />
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            <ApplicationProvider {...eva} theme={{ ...eva[theme], ...beepTheme }}>
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
