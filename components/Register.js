import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Icon, Layout, Text, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { UserContext } from '../utils/UserContext.js';
import { removeOldToken } from '../utils/OfflineToken.js';
import { config } from "../utils/config";
 
export class RegisterScreen extends Component {
    static contextType = UserContext;

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

    async handleRegister () {
        this.setState({isLoading: true});
        //Before we login, call retrieveData
        //retrieveData should handle an offline login by tokenid
        //It also gets the Expo push token and stores it in a state so we can use it here
        removeOldToken();

        //Load expoPushToken
        let expoPushToken = await AsyncStorage.getItem('@expoPushToken');

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
            "password": this.state.password,
            "expoPushToken": expoPushToken
        }

        //POST to our signup API
        fetch(config.apiUrl + "/auth/signup", {
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
                            this.context.setUser(data);
                            AsyncStorage.setItem("@user", JSON.stringify(data));
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
