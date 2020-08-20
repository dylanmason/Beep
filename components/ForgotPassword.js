import React, { Component } from 'react';
import { config } from "../utils/config";
import { Layout, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { StyleSheet } from "react-native";
import { BackIcon, EmailIcon } from "../utils/Icons";
import { parseError } from "../utils/errors";

export class ForgotPassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            status: {},
            email: ''
        }
    }

    handleForgotPassword () {
        this.setState({isLoading: true});

        fetch(config.apiUrl + "/auth/password/forgot", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ "email": this.state.email })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[ForgotPassword.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data) {
                        this.setState({
                            isLoading: false
                        });

                        if (data.status == "success") {
                            alert(data.message);
                        } 
                        else {
                            alert(parseError(data.message));
                        }

                        if (data.status == "success") {
                            this.props.navigation.goBack();
                        }
                    }.bind(this)
                )
            }.bind(this)
        )
        .catch((error) => {
             console.log("[ForgotPassword.js] [API] Error fetching from the Beep (Signup) API: ", error);
        });
    }

    render () {
        const BackAction = () => (
            <TopNavigationAction icon={BackIcon} onPress={() =>this.props.navigation.goBack()}/>
        );

        return (
            <>
                <TopNavigation title='Forgot Password' alignment='center' accessoryLeft={BackAction}/>
                <Layout style={styles.container}>
                    <Layout style={styles.form}>
                        <Input
                            textContentType="emailAddress"
                            placeholder="example@ridebeep.app"
                            returnKeyType="go"
                            onChangeText={(text) => this.setState({email:text})}
                            onSubmitEditing={() => this.handleForgotPassword()} />
                    {!this.state.isLoading ? 
                        <Button onPress={() => this.handleForgotPassword()} accessoryRight={EmailIcon}>
                            Send Password Reset Email
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
    }
});
