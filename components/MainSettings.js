import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, AsyncStorage } from 'react-native';
import { Icon, Toggle, Layout, Text, Button, Input, Menu, MenuItem } from '@ui-kitten/components';
import { ThemeContext } from '../utils/theme-context';
import socket from '../utils/Socket';
import { UserContext } from '../utils/UserContext.js';

const ThemeIcon = (props) => (
  <Icon {...props} name='color-palette'/>
);

const LogOutIcon = (props) => (
  <Icon {...props} name='log-out'/>
);

const ProfileIcon = (props) => (
  <Icon {...props} name='person'/>
);

const PasswordIcon = (props) => (
  <Icon {...props} name='lock'/>
);

const ForwardIcon = (props) => (
  <Icon {...props} name='arrow-ios-forward'/>
);

export function MainSettingsScreen({ navigation }) {
    const themeContext = React.useContext(ThemeContext);
    const userContext = React.useContext(UserContext);

    async function logout() {
        //POST to our Logout API
        fetch("https://beep.nussman.us/api/auth/logout", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": userContext.user.token
            })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[Settings.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data) {
                        //Log the result from the Logout API to debug
                        console.log("[Settings.js] [API] Logout API Responce: ", data);

                        if (data.status == "success") {
                            //Logout was successfull
                            console.log("[Settings.js] [Logout] We have internet connection.");
                            //Define the keys we want to unset
                            let keys = ['@user'];
                            //Using AsyncStorage, remove keys on logout.
                            //IMPORTANT: we do NOT remove the expo push token beause we need that for any other user that may login
                            //We can't remove it because it is only set on App.js when we initialize notifications, we may not re-run that code
                            AsyncStorage.multiRemove(keys, (err) => {
                                console.log("[Settings.js] [Logout] Removed all from storage except our push token.");
                            });
                            //these two emits tell our socket server that we no longer want the rethinkdb watcher open
                            socket.emit('stopGetQueue');
                            socket.emit('stopGetRiderStatus');
                            //this tells our client to stop listening to updates
                            socket.off('updateRiderStatus');
                            socket.off('updateQueue');
                        }
                        else {
                            //Our API returned an error, we didn't logout.
                            //Use Native Alert to tell user they were not logged out
                            alert("Could not logout!");
                        }
                    }
                );
            }
        )
        .catch((error) => {
            //The fetch encountered an error.
            console.log("[Settings.js] [Logout] We have no internet!");
            //Define the keys we will remove from storage
            //IMPORTANT: notice how we did NOT remove the 'tokenid'
            //This is because use is offline, we will remove it upon the next signin or signup
            //Also, we still keep expoPushToken
            let keys = ['@user'];
            AsyncStorage.setItem("@tokenid", userContext.user.tokenid);
            //Remove data from AsyncStorage
            AsyncStorage.multiRemove(keys, (err) => {
                console.log("Removed all except tokenid and expoPushToken from storage.");
            });
        });

        //Now that we have completed the logout procedue, send them to the Login page.
        navigation.reset({
            index: 0,
            routes: [
                { name: 'Login' },
            ],
            key: null
        });
    }

    return (
        <Layout style={styles.wrapper}>
            <Layout style={styles.container}>
                {/*
                <Layout style={styles.row}>
                    <Text category='h1'>Hello, </Text>
                    <Text category='h1'>{userContext.user.first}!</Text>
                </Layout>
                */}
                <Button
                    onPress={themeContext.toggleTheme}
                    accessoryLeft={ThemeIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Toggle Theme
                </Button>
                <Button
                    onPress={() => navigation.navigate("EditProfileScreen")}
                    accessoryLeft={ProfileIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Edit Profile
                </Button>
                <Button
                    onPress={() => navigation.navigate("ChangePasswordScreen")}
                    accessoryLeft={PasswordIcon}
                    accessoryRight={ForwardIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Change Password
                </Button>
                <Button
                    onPress={logout}
                    accessoryLeft={LogOutIcon}
                    style={styles.button}
                    appearance='ghost'
                >
                    Logout
                </Button>
            </Layout>
        </Layout>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: '35%',
        marginTop: 20 
    },
    container: {
        flex: 1,
        width: '95%',
        justifyContent: 'center',
    },
    wrapper: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
    },
    button: {
        marginBottom: 10 
    }
});
