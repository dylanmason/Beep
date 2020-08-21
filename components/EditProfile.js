import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Icon, Layout, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { UserContext } from '../utils/UserContext.js';
import { config } from "../utils/config";
import { EditIcon, LoadingIndicator } from "../utils/Icons";
import { parseError } from "../utils/errors";

export class EditProfileScreen extends Component {
    static contextType = UserContext;

    state = {
        isLoading: false,
        token: this.context.user.token,
        username: this.context.user.username,
        first: this.context.user.first,
        last: this.context.user.last,
        email: this.context.user.email,
        phone: this.context.user.phone,
        venmo: this.context.user.venmo
    };

    handleUpdate () {
        this.setState({ isLoading: true });

        //Define our Main Navigation, use this so send user back a page
        const navigationStuff = this.props.navigation;

        //POST to our edit profile API
        fetch(config.apiUrl + "/account/edit", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": this.state.token,
                "first": this.state.first,
                "last": this.state.last,
                "email": this.state.email,
                "phone": this.state.phone,
                "venmo": this.state.venmo
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

                            let tempUser = JSON.parse(JSON.stringify(this.context.user));
                            tempUser.first = this.state.first;
                            tempUser.last = this.state.last;
                            tempUser.email = this.state.email;
                            tempUser.phone = this.state.phone;
                            tempUser.venmo = this.state.venmo;
                            AsyncStorage.setItem('@user', JSON.stringify(tempUser));
                            this.context.setUser(tempUser);

                            navigationStuff.goBack();
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
                <TopNavigation title='Edit Profile' alignment='center' accessoryLeft={BackAction}/>
                <Layout style={styles.container}>
                    <Layout style={styles.form}>
                        <Input
                            label="Username"
                            value={this.state.username}
                            textContentType="username"
                            placeholder="Username"
                            disabled={true} />
                        <Input
                            label="First Name"
                            value={this.state.first}
                            textContentType="givenName"
                            placeholder="First Name"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({first:text})}
                            onSubmitEditing={()=>this.secondTextInput.focus()} />
                        <Input
                            label="Last Name"
                            value={this.state.last}
                            textContentType="familyName"
                            placeholder="Last Name"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({last:text})}
                            ref={(input)=>this.secondTextInput = input}
                            onSubmitEditing={()=>this.thirdTextInput.focus()} />
                        <Input
                            label="Email"
                            value={this.state.email}
                            textContentType="emailAddress"
                            placeholder="Email"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({email:text})}
                            ref={(input)=>this.thirdTextInput = input}
                            onSubmitEditing={()=>this.fourthTextInput.focus()} />
                        <Input
                            label="Phone Number"
                            value={this.state.phone}
                            textContentType="telephoneNumber"
                            placeholder="Phone Number"
                            returnKeyType="next"
                            onChangeText={(text) => this.setState({phone:text})}
                            ref={(input)=>this.fourthTextInput = input}
                            onSubmitEditing={()=>this.fifthTextInput.focus()} />
                        <Input
                            label="Venmo Username"
                            value={this.state.venmo}
                            textContentType="username"
                            placeholder="Venmo Username"
                            returnKeyType="go"
                            onChangeText={(text) => this.setState({venmo:text})}
                            ref={(input)=>this.fifthTextInput = input}
                            onSubmitEditing={() => this.handleUpdate()} />
                        {!this.state.isLoading ?
                            <Button
                                onPress={() => this.handleUpdate()}
                                accessoryRight={EditIcon}
                            >
                                Update Profile
                            </Button>
                            :
                            <Button
                                appearance="outline"
                                accessoryRight={LoadingIndicator}
                            >
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
