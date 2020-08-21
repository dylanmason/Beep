import React, { Component } from 'react';
import { Platform, StyleSheet, AsyncStorage } from 'react-native';
import { Layout, Text, Button, Input } from '@ui-kitten/components';
import * as SplashScreen from 'expo-splash-screen';
import { UserContext } from '../utils/UserContext.js';
import { removeOldToken } from '../utils/OfflineToken.js';
import { getPushToken } from '../utils/Notifications.js';
import { config } from '../utils/config';
import { LoginIcon, SignUpIcon, QuestionIcon, LoadingIndicator } from '../utils/Icons';
import { parseError } from "../utils/errors";

export default class LoginScreen extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            username: "",
            password: ""
        };
    }

    componentDidMount() {
        SplashScreen.hideAsync();
    }

    async handleLogin() {
        this.setState({ isLoading: true });

        removeOldToken();

        let expoPushToken;

        if (Platform.OS == "ios" || Platform.OS == "android") {
            expoPushToken = await getPushToken();
        }

        console.log("[Login.js] Logging in and posting this push token with it", expoPushToken);

        fetch(config.apiUrl + "/auth/login", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": this.state.username,
                "password": this.state.password,
                "expoPushToken": expoPushToken
            })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    alert("First error: " + response.status)
                    console.log('[Login.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        //Log what our login API returns for debugging
                        console.log("[Login.js] [API] Login API Responce: ", data);

                        if (data.status === "success") {
                            this.context.setUser(data);
                            AsyncStorage.setItem("@user", JSON.stringify(data));

                            this.props.navigation.reset({
                                index: 0,
                                routes: [
                                    { name: 'Main' },
                                ],
                            });
                        }
                        else {
                            this.setState({ isLoading: false });
                            alert(parseError(data.message));
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[Login.js] [API] Error fetching from the Beep (Login) API: ", error);
             alert("Second error: " + error)
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
                        onChangeText={(text) => this.setState({username: text})}
                        onSubmitEditing={() => this.secondTextInput.focus()}
                        blurOnSubmit={true}
                    />
                    <Input
                        textContentType="password"
                        placeholder="Password"
                        returnKeyType="go"
                        secureTextEntry={true}
                        onChangeText={(text) => this.setState({password: text})}
                        ref={(input)=>this.secondTextInput = input}
                        onSubmitEditing={() => this.handleLogin()}
                        blurOnSubmit={true}
                    />
                    {!this.state.isLoading ?
                        <Button
                            accessoryRight={LoginIcon}
                            onPress={() => this.handleLogin()}
                        >
                        Login
                        </Button>
                        :
                        <Button appearance='outline' accessoryRight={LoadingIndicator}>
                            Loading
                        </Button>
                    }
                </Layout>
                <Text style={{marginTop: 30, marginBottom: 10 }}> Don't have an account? </Text>
                <Button
                    size="small"
                    onPress={() => this.props.navigation.navigate('Register')}
                    appearance="outline"
                    accessoryRight={SignUpIcon}
                >
                Sign Up
                </Button>
                <Text style={{marginTop: 20, marginBottom: 10}}> Forgot your password? </Text>
                <Button
                    size="small"
                    onPress={() => this.props.navigation.navigate('ForgotPassword')}
                    appearance="outline"
                    accessoryRight={QuestionIcon}
                >
                Forgot Password
                </Button>
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
    },
});
