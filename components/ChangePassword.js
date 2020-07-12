import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Icon, Layout, Text, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { UserContext } from '../utils/UserContext.js';

export class ChangePasswordScreen extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);
        this.state = {
            password: '',
            password2: ''
        }
    }

    async handleChangePassword () {

        if (this.state.password !== this.state.password2) {
            alert("Your passwords do not match!");
            return;
        }

        //Define our Main Navigation, use this so send user back a page
        const navigationStuff = this.props.navigation;
        //get token to autheticate with api
        const token = await AsyncStorage.getItem("@token");

        //POST to our edit profile API
        fetch("https://beep.nussman.us/api/account/password", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": this.context.user.token,
                "password": this.state.password
            })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[EditProfile.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data) {
                        if (data.status === "success") {
                            navigationStuff.goBack();
                        }
                        else {
                            //TODO: modal popup or something better
                            alert("Error updating new password.");
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[EditProfile.js] [API] Error fetching from the Beep (Edit Profile) API: ", error);
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
                <TopNavigation title='Change Password' alignment='center' accessoryLeft={BackAction}/>
                <Layout style={styles.container}>
                    <Layout style={styles.form}>
                        <Input
                            secureTextEntry={true}
                            label="New Password"
                            textContentType="password"
                            placeholder="New Password"
                            onChangeText={(text) => this.setState({password: text})}
                            onSubmitEditing={()=>this.secondTextInput.focus()} />
                        <Input
                            secureTextEntry={true}
                            label="Repeat New Password"
                            textContentType="password"
                            placeholder="New Password"
                            returnKeyType="go"
                            onChangeText={(text) => this.setState({password2: text})}
                            ref={(input)=>this.secondTextInput = input}
                            onSubmitEditing={() => this.handleChangePassword()} />
                        <Button
                          buttonStyle={styles.button}
                            onPress={() => this.handleChangePassword()}
                        >
                            Change Password
                        </Button>
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
