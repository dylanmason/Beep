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
    retrieveData = async () => {
        try {
            //TODO: improve the perfomance of loading this data, in the future, find a way
            //to not even use AsyncStorage on every single new screen
            let username = await AsyncStorage.getItem('@username');
            let token = await AsyncStorage.getItem('@token');
            let first = await AsyncStorage.getItem('@first');
            let last = await AsyncStorage.getItem('@last');
            let email = await AsyncStorage.getItem('@email');
            let phone = await AsyncStorage.getItem('@phone');
            let venmo = await AsyncStorage.getItem('@venmo');

            this.setState({token: token});
            this.setState({username: username});
            this.setState({first: first});
            this.setState({last: last});
            this.setState({email: email});
            this.setState({phone: phone});
            this.setState({venmo: venmo});
        }
        catch (error) {
          console.log("[FindBeep.js] [AsyncStorage] ", error);
        }
    }

    handleUpdate() {
        //Define our Main Navigation, use this so send user to Main upon login
        const navigationStuff = this.props.navigation;

        //We will POST this data from our states
        var data = {
            "token": this.state.token,
            "first": this.state.first,
            "last": this.state.last,
            "email": this.state.email,
            "phone": this.state.phone,
            "venmo": this.state.venmo
        }

        //POST to our signup API
        fetch("https://beep.nussman.us/api/account/edit", {
               method: "POST",
               headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
               },
               body:  JSON.stringify(data)
            })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[EditProfile.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }

                response.json().then(
                    function(data)
                    {
                        console.log("[EditProfile.js] [API] Update Profile API Responce: ", data);

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
                            console.log("Successfully updated account info");
                            navigationStuff.goBack();
                        }
                        else {
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
                <TopNavigation title='Edit Profile' alignment='center' leftControl={BackAction()}/>
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
