import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Layout, Text, Button, Input, Modal, Card } from '@ui-kitten/components';

export class LoginScreen extends Component {

    constructor(props)
    {
        super(props);
        this.state = {
            showLoginError: false,
            username: '',
            password: '',
        }
    }

    retrieveData = async () => {
        try
        {
            //When we load Login.js this will happen
            //Get tokenid and expoPushToken from AsyncStorage
            //We get tokenid on login page because if it is set, that means
            //someone logged out while offline.
            let tokenid = await AsyncStorage.getItem('@tokenid');
            //Load expoPushToken
            let expoPushToken = await AsyncStorage.getItem('@expoPushToken');
            //Store the Expo Notification token in a state
            this.setState({expoPushToken: expoPushToken});
            //Log the Expo Token to console
            console.log("[Login.js] [Notifications] Got Expo Push Token on Login Page Initialization: " , expoPushToken);

            if (tokenid !== null)
            {
                //Token is NOT null, this means a previous user on this device logged out while offline.
                //We must safely revoke their token.
                console.log("[Login.js] [Auth] There was a tokenid stored in memory, this means user logged out while offline. We need to deactivate their token by tokenid.");

                //Post tokenid so we can safely remove the token server-side
                var data = {
                    "tokenid": tokenid
                }
                //POST to our token API
                fetch("https://beep.nussman.us/api/auth/token", {
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
                                console.log('[Login.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                                return;
                            }
                            response.json().then(
                                function(data)
                                {
                                    //Hopefully the token was revoked server-side
                                    //This API's ouput is not important, just log it
                                    //so we know that this function is still working when needed
                                    console.log("[Login.js] [API] Token Revoker API Responce: ", data);
                                }
                            );
                        }
                    )
                .catch((error) => {
                     console.log("[Login.js] [API] Error fetching from the Beep (Token) API: ", error);
                });
            }
        }
        catch (error)
        {
            //If we reach this, we could not pull nessisary data from AsyncStorage
            console.log("[Login.js] [AsyncStorage] ", error);
        }
    };

    handleLogin()
    {
        //Before we login, call retrieveData
        //retrieveData should handle an offline login by tokenid
        //It also gets the Expo push token and stores it in a state so we can use it here
        this.retrieveData();

        //Define our Main Navigation, use this so send user to Main upon login
        const navigationStuff = this.props.navigation;

        //POST this login data from states
        var data = {
           "username": this.state.username,
           "password": this.state.password
        }

        //POST to our login API
        fetch("https://beep.nussman.us/api/auth/login", {
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
                        console.log('[Login.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }

                    response.json().then(
                        function(data)
                        {
                            //Log what our login API returns for debugging
                            console.log("[Login.js] [API] Login API Responce: ", data);

                            if (data.status === "success")
                            {
                                //Upon login, we will store these four items:
                                //id: the user's id in our db
                                //username: the user's username in our db
                                //token: user's auth token in our token db
                                //tokenid: the token for the token, used for offline logout
                                const idData = ["@id", data.id];
                                const usernameData = ["@username", data.username];
                                const tokenData = ["@token", data.token];
                                const tokenidData = ["@tokenid", data.tokenid];
                                const singlesRate = ["@singlesRate", "" + data.singlesRate];
                                const groupRate = ["@groupRate", "" + data.groupRate];
                                const first = ["@first", data.first];
                                const last = ["@last", data.last];
                                const email = ["@email", data.email];
                                const phone = ["@phone", data.phone];
                                const venmo = ["@venmo", data.venmo];
                                
                                try {
                                    //Store data in AsyncStorage
                                    AsyncStorage.multiSet([idData, usernameData, tokenData, tokenidData, singlesRate, groupRate, first, last, email, phone, venmo]);
                                }
                                catch (e) {
                                    console.log("[Login.js] [AsyncStorage] Could not store login data: ", e);
                                }

                                //Now that the user IS successfully logged in, we need to send their expo push token to our DB
                                var data = {
                                    "token": data.token,
                                    "pushToken": this.state.expoPushToken
                                }

                                //POST to our push token API
                                fetch("https://beep.nussman.us/api/auth/push", {
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
                                                console.log('[Login.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                                                return;
                                            }
                                            response.json().then(
                                                function(data)
                                                {
                                                    //This process of sending our push token to the API should be done silently
                                                    //Therefore, just log the responce.
                                                    console.log("[Login.js] [API] Expo Push Token API Responce: ", data);
                                                }
                                            );
                                        }
                                    )
                                .catch((error) => {
                                     console.log("[Login.js] [API] Error updating push token with Beep API: ", error);
                                });

                                //Login has been completed. We are ready to send user into main app.
                                //Use our Navigation we defined earlier to RESET the navigation stack where Main is the root
                                navigationStuff.reset({
                                    index: 0,
                                    routes: [
                                      { name: 'Main' },
                                    ],
                                  })
                            }
                            else
                            {
                                //Use Native Alert to tell user a login error.
                                //This is where we tell user "Incorrect Password" and such
                                //alert(data.message);
                                this.setState({loginError: data.message});
                                this.setState({showLoginError: true});
                            }
                        }.bind(this)
                    );
                }.bind(this)
            )
        .catch((error) => {
             console.log("[Login.js] [API] Error fetching from the Beep (Login) API: ", error);
        });
    }

    render () {
        return (
            <Layout style={styles.container}>
                <Text style={styles.title} category='h6'>Login</Text>
                <Layout style={styles.form}>
                    <Input
                        textContentType="username"
                        placeholder="Username"
                        returnKeyType="next"
                        onChangeText={(text) => this.setState({username:text})}
                        onSubmitEditing={()=>this.secondTextInput.focus()} />
                    <Input
                        textContentType="password"
                        placeholder="Password"
                        returnKeyType="go"
                        secureTextEntry={true}
                        ref={(input)=>this.secondTextInput = input}
                        onChangeText={(text) => this.setState({password:text})}
                        onSubmitEditing={() => this.handleLogin()} />
                    <Button
                      onPress={() => this.handleLogin()}
                    >
                    Login
                    </Button>
                </Layout>
                <Text style={{marginTop: 50, marginBottom: 20}}> Don't have an account? </Text>
                <Button
                    onPress={() => this.props.navigation.navigate('Register')}
                >
                Sign Up
                </Button>

                <Modal visible={this.state.showLoginError}>
                    <Card disabled={true}>
                    <Text>
                        {this.state.loginError}
                    </Text>
                        <Button onPress={() => this.setState({showLoginError: false})}>
                        Close
                        </Button>
                    </Card>
                </Modal>

            </Layout>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 100
    },
    form: {
        justifyContent: "center",
        width: "83%",
        marginTop: 20,
    },
    title: {
        fontSize: 40,
        padding: 15,
    }
});
