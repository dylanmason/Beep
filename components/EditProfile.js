import React, { Component } from 'react';
import { StyleSheet, AsyncStorage } from 'react-native';
import { Icon, Layout, Text, Button, Input, TopNavigation, TopNavigationAction } from '@ui-kitten/components';

export class EditProfileScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: '',
            first: '',
            last: '',
            email: '',
            phone: '',
            venmo: ''
        }
    }

    componentDidMount () {
        //Run retrieveData to get user's data and save it in states
        this.retrieveData();
    }

    /**
     * Get User's Data from AsyncStorage
     */
    async retrieveData () {
        try {
            const data = await AsyncStorage.multiGet(['@token', '@username', '@first', '@last', '@email', '@phone', '@venmo']);

            this.setState({
                token: data[0][1],
                username: data[1][1],
                first: data[2][1],
                last: data[3][1],
                email: data[4][1],
                phone: data[5][1],
                venmo: data[6][1]
            });
        }
        catch (error) {
          console.log("[FindBeep.js] [AsyncStorage] ", error);
        }
    }

    handleUpdate () {
        //Define our Main Navigation, use this so send user back a page
        const navigationStuff = this.props.navigation;

        //POST to our edit profile API
        fetch("https://beep.nussman.us/api/account/edit", {
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
                            const first = ["@first", this.state.first];
                            const last = ["@last", this.state.last];
                            const email = ["@email", this.state.email];
                            const phone = ["@phone", this.state.phone];
                            const venmo = ["@venmo", this.state.venmo];

                            try {
                                AsyncStorage.multiSet([first, last, email, phone, venmo]);
                            }
                            catch (e) {
                                console.log("[EditProfile.js] [AsyncStorage] Could not store signup data: ", e);
                            }

                            navigationStuff.goBack();
                        }
                        else {
                            //TODO: modal popup or something better
                            alert("Error updating acount info");
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
                        <Button
                          buttonStyle={styles.button}
                            onPress={() => this.handleUpdate()}
                        >
                        Update Profile
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
