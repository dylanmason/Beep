import React, { useState, useContext, useRef } from 'react';
import { StyleSheet, AsyncStorage, View } from 'react-native';
import { Layout, Text, Button, Input, Modal, Card } from '@ui-kitten/components';
import * as SplashScreen from 'expo-splash-screen';
import { UserContext } from '../utils/UserContext.js';
import { removeOldToken } from '../utils/OfflineToken.js';

export default function LoginScreen({ navigation }) {
    const {user, setUser} = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const inputEl = useRef(null);
    const onButtonClick = () => {
        // `current` points to the mounted text input element
        inputEl.current.focus();
    };

    SplashScreen.hideAsync();

    async function handleLogin() {
        setIsLoading(true);

        removeOldToken();

        let expoPushToken = await AsyncStorage.getItem('@expoPushToken');

        fetch("https://beep.nussman.us/api/auth/login", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "username": username,
                "password": password,
                "expoPushToken": expoPushToken
            })
        })
        .then(
            function(response) {

                if (response.status !== 200) {
                    console.log('[Login.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data) {
                        //Log what our login API returns for debugging
                        console.log("[Login.js] [API] Login API Responce: ", data);

                        if (data.status === "success") {
                            setUser(data);
                            AsyncStorage.setItem("@user", JSON.stringify(data));
                            navigation.reset({
                                index: 0,
                                routes: [
                                    { name: 'Main' },
                                ],
                            });
                        }
                        else {
                            //Use Native Alert to tell user a login error.
                            //This is where we tell user "Incorrect Password" and such
                            setError(data.message);
                            setIsLoading(false);
                        }
                    }
                );
            }
        )
        .catch((error) => {
             console.log("[Login.js] [API] Error fetching from the Beep (Login) API: ", error);
        });
    }

    return (
        <Layout style={styles.container}>
            <Text style={styles.title} category='h6'>Login</Text>
            <Layout style={styles.form}>
                <Input
                    textContentType="username"
                    placeholder="Username"
                    returnKeyType="next"
                    onChangeText={(text) => setUsername(text)}
                    onSubmitEditing={onButtonClick}
                    blurOnSubmit={false}
                />
                <Input
                    textContentType="password"
                    placeholder="Password"
                    returnKeyType="go"
                    secureTextEntry={true}
                    onChangeText={(text) => setPassword(text)}
                    onSubmitEditing={handleLogin}
                    ref={inputEl}
                />
                {!isLoading ?
                    <Button
                      onPress={handleLogin}
                    >
                    Login
                    </Button>
                    :
                    <Button appearance='outline'>
                        Loading
                    </Button>
                }
            </Layout>
            <Text style={{marginTop: 50, marginBottom: 20}}> Don't have an account? </Text>
            <Button
                onPress={() => navigation.navigate('Register')}
            >
            Sign Up
            </Button>
            <Modal visible={error}>
                <Card disabled={true}>
                <Text>
                    {error}
                </Text>
                    <Button onPress={() => setError(null)}>
                    Close
                    </Button>
                </Card>
            </Modal>
        </Layout>
    );
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
    indicator: {
        marginTop: 10
    },
});
