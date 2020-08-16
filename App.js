import 'react-native-gesture-handler';
import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StyleSheet, StatusBar, AsyncStorage, Platform } from 'react-native';
import { RegisterScreen } from './components/Register'
import LoginScreen from './components/Login'
import { MainScreen } from './components/MainScreen'
import { ForgotPassword } from './components/ForgotPassword'
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry, Layout } from '@ui-kitten/components';
import { default as beepTheme } from './utils/theme.json';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { ThemeContext } from './utils/theme-context';
import { UserContext } from './utils/UserContext.js';
import * as SplashScreen from 'expo-splash-screen';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { updatePushToken } from "./utils/Notifications";

const Stack = createStackNavigator();
let initialScreen;

async function startSplash() {
    try {
      await SplashScreen.preventAutoHideAsync();
    } catch (e) {
      console.warn(e);
    }
}

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: {},
            theme: "light"
        };
    }

    toggleTheme = () => {
        const nextempTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setState({theme: nextempTheme});
        AsyncStorage.setItem('@theme', nextempTheme);
    };

    setUser = (user) => {
        this.setState({user: user});
    }
    
    componentDidMount() {
        //Ensure native splash screen stays up
        startSplash();

        //When App loads initially, get token from AsyncStorage
        AsyncStorage.multiGet(['@user', '@theme']).then((result) => {
            let tempUser = null;
            let sTheme = this.state.theme;

            //if a user is defined
            if(result[0][1]) {
                //Because user is logged in, send them to Main initially
                initialScreen = "Main";
                //Take user from AsyncStorage and put it in our context
                tempUser = JSON.parse(result[0][1]);
                //If user is on a mobile device and user object has a token, sub them to notifications
                if ((Platform.OS == "ios" || Platform.OS == "android") && tempUser.token) {
                    updatePushToken(tempUser.token);
                }
            }
            else {
                //This mean no one is logged in, send them to login page initally
                initialScreen = "Login";
            }

            if(result[1][1]) {
                //re-render may happen, if a re-render happens, this code will not run agian because
                //initialScreen has been defined. 
                sTheme = result[1][1];
            }
            
            //finaly setState once we know what data we have to minimize renders
            this.setState({
                user: tempUser,
                theme: sTheme
            });
          }, (error) => {
            //AsyncStorage could not get data from storage
            console.log("[App.js] [AsyncStorage] ", error);
        });
    }

    render () {
        if (!initialScreen) {
            console.log("[App.js] Rendering Splash Screen");
            return null;
        }

        console.log("[App.js] Rendering App with Intial Screen: ", initialScreen);
        let user = this.state.user;
        let setUser = this.setUser;

        let theme = this.state.theme;
        let toggleTheme = this.toggleTheme;

        return (
            <UserContext.Provider value={{user, setUser}}>
                <ThemeContext.Provider value={{theme, toggleTheme}}>
                    <IconRegistry icons={EvaIconsPack} />
                    <ApplicationProvider {...eva} theme={{ ...eva[this.state.theme], ...beepTheme }}>
                        <Layout style={styles.statusbar}>
                            {Platform.OS == "ios" ?
                                <StatusBar barStyle={(this.state.theme === 'light' ? 'dark' : 'light') + "-content"} />
                                :
                                <StatusBar translucent barStyle={(this.state.theme === 'light' ? 'dark' : 'light') + "-content"} backgroundColor={(this.state.theme === "dark") ? "#222b45" : "#ffffff"} />
                            }
                        </Layout>
                        <NavigationContainer>
                            <Stack.Navigator initialRouteName={initialScreen} screenOptions={{ headerShown: false }} >
                                <Stack.Screen name="Login" component={LoginScreen} />
                                <Stack.Screen name="Register" component={RegisterScreen} />
                                <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
                                <Stack.Screen name="Main" component={MainScreen} />
                            </Stack.Navigator>
                        </NavigationContainer>
                    </ApplicationProvider>
                </ThemeContext.Provider>
            </UserContext.Provider>
        );
    }
}

const styles = StyleSheet.create({
    statusbar: {
        paddingTop: getStatusBarHeight(true)
    }
});
