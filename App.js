import 'react-native-gesture-handler';
import React, { Component } from 'react';
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

export default class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            user: {},
            theme: "light"
        };
    }

    toggleTheme = () => {
        const nextTheme = this.state.theme === 'light' ? 'dark' : 'light';
        this.setState({theme: nextTheme});
        AsyncStorage.setItem('@theme', nextTheme);
    };

    setUser = (user) => {
        this.setState({user: user});
    }
    
    //If we haven't deturmined an initial screen, run this code
    //We DONT want to run this code if we already know what screen to load
    componentDidMount() {
        startSplash();

        if (initialScreen == null) {
            //When App loads initially, get token from AsyncStorage
            AsyncStorage.multiGet(['@user', '@theme']).then((result) => {
                let sUser = null;
                let sTheme = this.state.theme;
                //if a user is defined
                if(result[0][1]) {
                    //Because user is logged in, send them to Main initially
                    initialScreen = "Main";
                    //Take user from AsyncStorage and put it in our context
                    sUser = JSON.parse(result[0][1]);
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
                
                this.setState({
                    user: sUser,
                    theme: sTheme
                });
              }, (error) => {
                //AsyncStorage could not get data from storage
                console.log("[App.js] [AsyncStorage] ", error);
            });
        }
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
                            <StatusBar barStyle={(this.state.theme === 'light' ? 'dark' : 'light') + "-content"} />
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
        );
    }
}

const styles = StyleSheet.create({
    statusbar: {
        paddingTop: getStatusBarHeight(true)
    }
});
