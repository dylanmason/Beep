import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, StatusBar, AsyncStorage } from 'react-native';
import { RegisterScreen } from './components/Register'
import LoginScreen from './components/Login'
import { MainScreen } from './components/MainScreen'
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry, Layout } from '@ui-kitten/components';
import { default as beepTheme } from './utils/theme.json';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { ThemeContext } from './utils/theme-context';
import { UserContext } from './utils/UserContext.js';
import * as SplashScreen from 'expo-splash-screen';
import { registerForPushNotificationsAsync } from './utils/Notifications.js';
import { getStatusBarHeight } from 'react-native-status-bar-height';

const Stack = createStackNavigator();
var initialScreen;

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

    const [user, setUser] = React.useState();
    const [theme, setTheme] = React.useState('light');
    const [isLoading, setIsLoading] = React.useState(true);

    const toggleTheme = () => {
        const nextTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(nextTheme);
        AsyncStorage.setItem('@theme', nextTheme);
    };
    
    //If we haven't deturmined an initial screen, run this code
    //We DONT want to run this code if we already know what screen to load
    if (initialScreen == null) {
        //When App loads initially, get token from AsyncStorage
        AsyncStorage.multiGet(['@user', '@theme']).then((result) => {
            //if a user is defined
            if(result[0][1]) {
                //Register for Expo Push Notifications
                registerForPushNotificationsAsync();
                //Because user is logged in, send them to Main initially
                initialScreen = "Main";
                //Take user from AsyncStorage and put it in our context
                setUser(JSON.parse(result[0][1]));
            }
            else {
                //This mean no one is logged in, send them to login page initally
                initialScreen = "Login";
            }

            if(result[1][1]) {
                //re-render may happen, if a re-render happens, this code will not run agian because
                //initialScreen has been defined. 
                setTheme(result[1][1]);
            }

            setIsLoading(false);
          }, (error) => {
            //AsyncStorage could not get data from storage
            console.log("[App.js] [AsyncStorage] ", error);
        });
    }

    if (isLoading) {
        //TODO: this renders 3 times >:(
        console.log("Loading...");
        return null;
    }

    //Loading is done! Render our main app
    console.log("[App.js] Rendering App with Intial Screen: ", initialScreen);

    return (
        <>
        <IconRegistry icons={EvaIconsPack} />
        <UserContext.Provider value={{user, setUser}}>
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
        </UserContext.Provider>
        </>
    );
}

const styles = StyleSheet.create({
    statusbar: {
        paddingTop: getStatusBarHeight(true)
    }
});
