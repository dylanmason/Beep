import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Icon, Layout, Text, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';

export class RegisterScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            first: '',
            last: '',
            email: '',
            phone: '',
            venmo: '',
            username: '',
            password: '',
        }
    }

    async retrieveData () {
        try {
            //When we load Register.js this will happen
            //Get tokenid and expoPushToken from AsyncStorage
            //We get tokenid on login page because if it is set, that means
            //someone logged out while offline.
            let tokenid = await AsyncStorage.getItem('@tokenid');
            //Load expoPushToken
            let expoPushToken = await AsyncStorage.getItem('@expoPushToken');
            //Store the Expo Notification token in a state
            this.setState({expoPushToken: expoPushToken});
            //Log the Expo Token to console
            console.log("[Register.js] [Notifications] Got Expo Push Token on Sign Up Page Initialization: " , expoPushToken);

            if (tokenid !== null) {
                //Token is NOT null, this means a previous user on this device logged out while offline.
                //We must safely revoke their token.
                console.log("There was a tokenid stored in memory, this means user logged out while offline. We need to deactivate their token by tokenid.");

                //POST to our token API
                fetch("https://beep.nussman.us/api/auth/token", {
                    method: "POST",
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ "tokenid": tokenid })
                })
                .then(
                    function(response) {
                        if (response.status !== 200) {
                            console.log('[Register.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                            return;
                        }
                        response.json().then(
                            function(data) {
                                //Hopefully the token was revoked server-side
                                //This API's ouput is not important, just log it
                                //so we know that this function is still working when needed
                                console.log("[Register.js] [API] Token Revoker API Responce: ", data);
                            }
                        )
                    }
                )
                .catch((error) => {
                     console.log("[Register.js] [API] Error fetching from the Beep (Token) API: ", error);
                });
            }
        }
        catch (error) {
            //If we reach this, we could not pull nessisary data from AsyncStorage
            console.log("[Register.js] [AsyncStorage] ", error);
        }
    }

    handleRegister () {
        this.setState({isLoading: true});
        //Before we login, call retrieveData
        //retrieveData should handle an offline login by tokenid
        //It also gets the Expo push token and stores it in a state so we can use it here
        this.retrieveData();

        //Define our Main Navigation, use this so send user to Main upon login
        const navigationStuff = this.props.navigation;

        //We will POST this data from our states
        var data = {
            "first": this.state.first,
            "last": this.state.last,
            "email": this.state.email,
            "phone": this.state.phone,
            "venmo": this.state.venmo,
            "username": this.state.username,
            "password": this.state.password
        }

        //POST to our signup API
        fetch("https://beep.nussman.us/api/auth/signup", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[Register.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data) {
                        //Log what our Signup API returns for debugging
                        console.log("[Register.js] [API] Signup API Responce: ", data);

                        if (data.status === "success") {
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
                            const capacity = ["@capacity", "" + data.capacity];
                            const first = ["@first", data.first];
                            const last = ["@last", data.last];
                            const email = ["@email", data.email];
                            const phone = ["@phone", data.phone];
                            const venmo = ["@venmo", data.venmo];

                            try {
                                //Store data in AsyncStorage
                                AsyncStorage.multiSet([idData, usernameData, tokenData, tokenidData, singlesRate, groupRate, capacity, first, last, email, phone, venmo]);
                            }
                            catch (e) {
                                console.log("[Register.js] [AsyncStorage] Could not store signup data: ", e);
                            }
                            
                            //async function that will send Expo Push Token to db
                            if (this.state.expoPushToken) {
                                //send push token to server it is exists (not null)
                                this.uploadToken(data.token);
                            }

                            //Signup has been completed. We are ready to send user into main app.
                            //Use our Navigation we defined earlier to RESET the navigation stack where Main is the root
                            navigationStuff.reset({
                                index: 0,
                                routes: [
                                  { name: 'Main' },
                                ],
                            })
                        }
                        else {
                            //TODO: Provide our user's with better sign up errors Ex. 'Password too short!' or 'You must enter a username!'
                            this.setState({isLoading: false});
                            alert("Error creating new account.");
                        }
                    }.bind(this)
                )
            }.bind(this)
        )
        .catch((error) => {
             console.log("[Register.js] [API] Error fetching from the Beep (Signup) API: ", error);
        });
    }

    async uploadToken (userToken) {
        //Now that the user IS successfully logged in, we need to send their expo push token to our DB
        //POST to our push token API
        fetch("https://beep.nussman.us/api/auth/push", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": data.token,
                "pushToken": this.state.expoPushToken
            })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[Register.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        //This process of sending our push token to the API should be done silently
                        //Therefore, just log the responce.
                        console.log("[Register.js] [API] Expo Push Token API Responce: ", data);
                    }
                )
            }
        )
        .catch((error) => {
             console.log("[Register.js] [API] Error updating push token with Beep API: ", error);
        });
    }

    render () {
        const BackIcon = (props) => (
             <Icon {...props} name='arrow-back'/>
        );

        const BackAction = () => (
            <TopNavigationAction icon={BackIcon} onPress={() =>this.props.navigation.goBack()}/>
        );

        return (
            <>
                <TopNavigation title='' alignment='center' accessoryLeft={BackAction}/>
                <Layout style={styles.container}>
                    <Text style={styles.title} category='h6'>Sign Up</Text>
                    <Layout style={styles.form}>
                        <Input
                            textContentType="givenName"
                            placeholder="First Name"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({first:text})}
                            onSubmitEditing={()=>this.secondTextInput.focus()} />
                        <Input
                            textContentType="familyName"
                            placeholder="Last Name"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({last:text})}
                            ref={(input)=>this.secondTextInput = input}
                            onSubmitEditing={()=>this.thirdTextInput.focus()} />
                        <Input
                            textContentType="emailAddress"
                            placeholder="Email"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({email:text})}
                            ref={(input)=>this.thirdTextInput = input}
                            onSubmitEditing={()=>this.fourthTextInput.focus()} />
                        <Input
                            textContentType="telephoneNumber"
                            placeholder="Phone Number"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({phone:text})}
                            ref={(input)=>this.fourthTextInput = input}
                            onSubmitEditing={()=>this.fifthTextInput.focus()} />

                        <Input
                            textContentType="username"
                            placeholder="Venmo Username"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({venmo:text})}
                            ref={(input)=>this.fifthTextInput = input}
                            onSubmitEditing={()=>this.sixthTextInput.focus()} />

                        <Input
                            textContentType="username"
                            placeholder="Username"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({username:text})}
                            ref={(input)=>this.sixthTextInput = input}
                            onSubmitEditing={()=>this.seventhTextInput.focus()} />
                        <Input
                            textContentType="password"
                            placeholder="Password"
                            returnKeyType="go"
                            secureTextEntry={true}
                            ref={(input)=>this.seventhTextInput = input}
                            onChangeText={(text) => this.setState({password:text})}
                            onSubmitEditing={() => this.handleRegister()} />
                    {!this.state.isLoading ? 
                        <Button
                          buttonStyle={styles.button}
                          onPress={() => this.handleRegister()}
                        >
                        Sign Up
                        </Button>
                        :
                        <Button appearance='outline'>
                            Loading
                        </Button>
                    }
                    </Layout>
                </Layout>
            </>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
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
