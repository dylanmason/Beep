import React, { Component } from 'react';
import { StyleSheet, TouchableOpacity, AsyncStorage } from 'react-native';
import { Toggle, Layout, Text, Button, Input } from '@ui-kitten/components';
import { ThemeContext } from './theme-context';

async function logout(navigation) {

    var token = await AsyncStorage.getItem('@token');

    //Data we will POST to our Logout API endpoint
    var data = {
        "token": token
    }

    //POST to our Logout API
    fetch("https://beep.nussman.us/api/auth/logout", {
           method: "POST",
           headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
           },
           body:  JSON.stringify(data)
        })
        .then(
            function(response)
            {
                if (response.status !== 200)
                {
                    console.log('[Settings.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data)
                    {
                        //Log the result from the Logout API to debug
                        console.log("[Settings.js] [API] Logout API Responce: ", data);

                        if (data.status == "success")
                        {
                            //Logout was successfull
                            console.log("[Settings.js] [Logout] We have internet connection.");
                            //Define the keys we want to unset
                            let keys = ['@username', '@id', '@token', '@tokenid', '@singlesRate' , '@groupRate'];
                            //Using AsyncStorage, remove keys on logout.
                            //IMPORTANT: we do NOT remove the expo push token beause we need that for any other user that may login
                            //We can't remove it because it is only set on App.js when we initialize notifications, we may not re-run that code
                            AsyncStorage.multiRemove(keys, (err) => {
                                console.log("[Settings.js] [Logout] Removed all from storage except our push token.");
                            });
                        }
                        else
                        {
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
        let keys = ['@username', '@id', '@token', '@singlesRate' , '@groupRate'];
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
    })
}

export function SettingsScreen({ navigation }) {
    const themeContext = React.useContext(ThemeContext);
    return (
        <Layout style={styles.container}>
            <Button onPress={themeContext.toggleTheme}>Toggle Theme</Button>
            <Button onPress={() => logout(navigation)}>Logout</Button>
        </Layout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
