import React, { Component } from 'react';
import { StyleSheet, AsyncStorage, Linking, TouchableWithoutFeedback, AppState } from 'react-native';
import { Icon, Layout, Text, Button, Input, CheckBox, Modal, Card } from '@ui-kitten/components';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import socket from '../utils/Socket'
import * as SplashScreen from 'expo-splash-screen';
import { UserContext } from '../utils/UserContext.js';
import {
    PhoneIcon, 
    TextIcon, 
    VenmoIcon,
    LeaveIcon,
    BackIcon,
    GetIcon,
    FindIcon,
    ShareIcon
} from '../utils/Icons.js';

export class MainFindBeepScreen extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
            showFindBeepError: false,
            foundBeep: false,
            isAccepted: false,
            groupSize: '1',
            startLocation: '',
            destination: '',
            pickBeeper: true,
            beeper: {}
        }
    }

    async doneSplash () {
        await SplashScreen.hideAsync();
    }

    componentDidMount () {
        this.getInitialRiderStatus(false);

        AppState.addEventListener("change", this.handleAppStateChange);

        socket.on('updateRiderStatus', data => {
            console.log("[FindBeep.js] [Socket.io] Socket.io told us to update rider status.");
            this.getRiderStatus();
        });
    }

    componentWillUnmount() {
        AppState.removeEventListener("change", this.handleAppStateChange);
    }

    handleAppStateChange = nextAppState => {
        if(nextAppState === "active" && !socket.connected && this.state.beeper.id) {
            this.getInitialRiderStatus(true);
            console.log("Socket.io is not conntected! We need to reconnect to continue to get updates");
        }
    }

    getInitialRiderStatus(isSocketCall) {
        fetch("https://beep.nussman.us/api/rider/status", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({"token": this.context.user.token})
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[FindBeep.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        if (data.status === "success") {
                            //if the rider is accepted, we can have more personal info about the beeper
                            if (data.isAccepted) {
                                this.setState({
                                    foundBeep: true,
                                    isAccepted: data.isAccepted,
                                    ridersQueuePosition: data.ridersQueuePosition,
                                    state: data.state,
                                    beeper: data.beeper,
                                    groupSize: data.groupSize,
                                    isLoading: false
                                });
                            }
                            else {
                                this.setState({
                                    foundBeep: true,
                                    isAccepted: data.isAccepted,
                                    groupSize: data.groupSize,
                                    beeper: data.beeper,
                                    isLoading: false
                                });
                            }

                            this.enableGetRiderStatus();
                        }
                        else {
                            //TODO this really should only happen on the socket reconnection, not initialy when the page
                            //is mounted... this setState might cause an unnessisary render ONLY for page mount
                            if (isSocketCall) {
                                this.setState({isLoading: false, foundBeep: false, isAccepted: false, beeper: {}});
                                this.disableGetRiderStatus();
                            }
                            console.log("[FindBeep.js] [API] " , data.message);
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
            console.log("[FindBeep.js] [API] Error fetching from the Beep API: ", error);
            //this line below feels very very very very very very dangerous
            //if an error is ever throw, we just recurse and run the funtion infinatly 
            //TODO fix this
            this.getInitialRiderStatus(true);
        });
        //TODO: is this a good spot to dismiss the splash page?
        this.doneSplash();
    }

    getRiderStatus() {
        fetch("https://beep.nussman.us/api/rider/status", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body:  JSON.stringify({ "token": this.context.user.token })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[FindBeep.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        if (data.status === "success") {
                            if (data.isAccepted) {
                                this.setState({
                                    foundBeep: true,
                                    isAccepted: data.isAccepted,
                                    ridersQueuePosition: data.ridersQueuePosition,
                                    state: data.state,
                                    beeper: data.beeper
                                });
                            }
                            else {
                                this.setState({
                                    foundBeep: true,
                                    isAccepted: data.isAccepted,
                                    beeper: data.beeper
                                });
                            }
                        }
                        else {
                            console.log("[FindBeep.js] [API] " , data.message);
                            this.setState({isLoading: false, foundBeep: false, isAccepted: false, beeper: {}});
                            this.disableGetRiderStatus();
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[FindBeep.js] [API] Error fetching from the Beep API: ", error);
        });
    }

    chooseBeep = (id) => {
        this.setState({isLoading: true});

        var data = {
            "token": this.context.user.token,
            "origin": this.state.startLocation,
            "destination": this.state.destination,
            "groupSize": this.state.groupSize,
            "beepersID": id
        }

        fetch("https://beep.nussman.us/api/rider/choose", {
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
                    console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        console.log("[FindBeep.js] Rider API Responce: ", data);

                        if (data.status === "success") {
                            this.setState({
                                beeper: data.beeper,
                                foundBeep: true,
                                isLoading: false
                            });

                            //tell socket server to listen for updates
                            this.enableGetRiderStatus();
                        }
                        else {
                            this.setState({isLoading: false, findBeepError: data.message, showFindBeepError: true});
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("Error fetching from the Beep (Rider) API: ", error);
        });
    }

    findBeep = () => {
        //if the "pick beeper" checbox is checked, run this code
        if (this.state.pickBeeper) {
            const navigationStuff = this.props.navigation;
            console.log("[FindBeep.js] Rider wants to pick their own beeper.");
            navigationStuff.navigate('PickBeepScreen', {
                handlePick: (id) => this.chooseBeep(id)
            });
            return;
        }

        this.setState({isLoading: true});

        fetch("https://beep.nussman.us/api/rider/find", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body:  JSON.stringify({"token": this.context.user.token})
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        console.log("[FindBeep.js] Rider API Responce: ", data);

                        if (data.status === "success") {
                            this.setState({
                                beeper: data.beeper,
                                isLoading: false
                            });
                        }
                        else {
                            this.setState({isLoading: false, findBeepError: data.message, showFindBeepError: true});
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("Error fetching from the Beep (Rider) API: ", error);
        });
    }

    useCurrentLocation = async () => {
        //TODO: find amore elegent solution to tell user we are loading location data
        this.setState({ startLocation: "Loading Current Location..." });
       
        //yeah this is probably bad to have here, but i dont care enough to move it
        Location.setApiKey("AIzaSyBgabJrpu7-ELWiUIKJlpBz2mL6GYjwCVI");

        let { status } = await Location.requestPermissionsAsync();

        if (status !== 'granted') {
            //TODO: improve this alert
            alert("You must enable location to use this feature.");
            //If we don't have location permission, DO NOT continue
            return;
        }

        //get location
        let position = await Location.getCurrentPositionAsync({});
        let location = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });

        let string;

        if (!location[0].name) {
            string = position.coords.latitude + ", "+ position.coords.longitude;
        }
        else {
            string = location[0].name + " " + location[0].street + " " + location[0].city + ", " + location[0].region + " " + location[0].postalCode;  
        }


        //Update Origin Location
        this.setState({ startLocation: string });
    }

    leaveQueue = () => {
        this.setState({isLoading: true});

        fetch("https://beep.nussman.us/api/rider/leave", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "token": this.context.user.token,
                "beepersID": this.state.beeper.id
            })
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('[StartBeeping.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        console.log("[StartBeeping.js] [API] Leave Queue Responce: ", data);
                        if (data.status === "error") {
                            alert(data.message);
                        }
                    }
                );
            }
        )
        .catch((error) => {
             console.log("[StartBeeping.js] [API] Error fetching from the Beep API: ", error);
        });
    }

    enableGetRiderStatus = () => {
        console.log("Subscribing to Socket.io for Rider Status");
        //Tell our socket to push updates to user
        socket.emit('getRiderStatus', this.state.beeper.id);
    }

    disableGetRiderStatus = () => {
        console.log("Unsubscribing to Socket.io for Rider Status");
        //Tell our socket to push updates to user
        socket.emit('stopGetRiderStatus');
    }

    handleVenmo = () => {
        if (this.state.groupSize > 1) {
            Linking.openURL('venmo://paycharge?txn=pay&recipients='+ this.state.beeper.venmo + '&amount=' + this.state.beeper.groupRate + '&note=Beep');
        }
        else {
            Linking.openURL('venmo://paycharge?txn=pay&recipients='+ this.state.beeper.venmo + '&amount=' + this.state.beeper.singlesRate + '&note=Beep');
        }
    }

    render () {
        const CurrentLocationIcon = (props) => (
            <TouchableWithoutFeedback onPress={this.useCurrentLocation}>
                <Icon {...props} name='pin'/>
            </TouchableWithoutFeedback>
        );

        console.log("[MainFindBeep.js] Rendering Main Find Beep");

        if (!this.state.foundBeep) {
            if (this.state.beeper.id) {
                return(
                    <Layout style={styles.container}>
                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beeper.first} {this.state.beeper.last}</Text>
                            <Text appearance='hint'>is avalible to beep you!</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beeper.first}'s Rates</Text>
                            <Layout style={styles.rateGroup}>
                                <Layout style={styles.rateLayout}>
                                    <Text appearance='hint'>Single</Text>
                                    <Text>${this.state.beeper.singlesRate}</Text>
                                </Layout>
                                <Layout style={styles.rateLayout} >
                                    <Text appearance='hint'>Group</Text>
                                    <Text>${this.state.beeper.groupRate}</Text>
                                </Layout>
                            </Layout>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text appearance='hint'>{this.state.beeper.first}'s rider capacity is</Text>
                            <Text category='h6'>{this.state.beeper.capacity}</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text appearance='hint'>{this.state.beeper.first}'s total queue size is</Text>
                            <Text category='h6'>{this.state.beeper.queueSize}</Text>
                        </Layout>
                        {!this.state.isLoading ?
                            <Button
                                style={styles.buttons}
                                accessoryRight={GetIcon}
                                onPress={() => this.chooseBeep(this.state.beeper.id)}
                            >
                            Get Beep
                            </Button>
                            :
                            <Button appearance='outline' style={styles.buttons}>
                                Loading
                            </Button>
                        }
                        <Button
                            status='basic'
                            style={styles.buttons}
                            accessoryRight={BackIcon}
                            onPress={() => this.setState({'beeper': {}})}
                        >
                        Go Back
                        </Button>
                        <Modal visible={this.state.showFindBeepError}>
                            <Card disabled={true}>
                            <Text>
                                {this.state.findBeepError}
                            </Text>
                                <Button onPress={() => this.setState({showFindBeepError: false})}>
                                Close
                                </Button>
                            </Card>
                        </Modal>
                    </Layout>
                );
            }
            else {
                return (
                    <Layout style={styles.container}>
                        <Input
                            label='Group Size'
                            style={styles.buttons}
                            placeholder='Group Size'
                            value={this.state.groupSize}
                            onChangeText={value => this.setState({groupSize: value})}
                        />
                        <Input
                            label='Pick-up Location'
                            style={styles.buttons}
                            placeholder='Pickup Location'
                            accessoryRight={CurrentLocationIcon}
                            value={this.state.startLocation}
                            onChangeText={value => this.setState({startLocation: value})}
                        />
                        <Input
                            label='Destination Location'
                            style={styles.buttons}
                            placeholder='Destination'
                            value={this.state.destination}
                            onChangeText={value => this.setState({destination: value})}
                        />
                        <CheckBox
                            checked={this.state.pickBeeper}
                            onChange={(value) => this.setState({pickBeeper: value})}
                        >
                            Pick your own beeper
                        </CheckBox>
                        {!this.state.isLoading ?
                            <Button
                                accessoryRight={FindIcon}
                                onPress={this.findBeep}
                                size='large'
                                style={{marginTop:15}}
                            >
                            Find a Beep
                            </Button>
                            :
                            <Button
                                size='large'
                                style={{marginTop:15}}
                                appearance='outline'
                            >
                                Loading
                            </Button>
                        }
                        <Modal visible={this.state.showFindBeepError}>
                            <Card disabled={true}>
                            <Text>
                                {this.state.findBeepError}
                            </Text>
                                <Button onPress={() => this.setState({showFindBeepError: false})}>
                                Close
                                </Button>
                            </Card>
                        </Modal>
                    </Layout>
                );
            }
        }
        else {
            if (this.state.isAccepted) {
                return (
                    <Layout style={styles.container}>
                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beeper.first} {this.state.beeper.last}</Text>
                            <Text appearance='hint'>is your beeper!</Text>
                        </Layout>

                        {(this.state.ridersQueuePosition == 0) ?
                            <Layout style={styles.group}>
                                <Text category='h6'>Current Status</Text>
                                {this.state.state == 0 ?
                                    <Text appearance='hint'>
                                        Beeper is getting ready to come get you.
                                    </Text>
                                    :
                                    null
                                }
                                {this.state.state == 1 ?
                                    <Text appearance='hint'>
                                        Beeper is on their way to get you.
                                    </Text>
                                    :
                                    null
                                }
                                {this.state.state == 2 ?
                                    <Text appearance='hint'>
                                        Beeper is here to pick you up!
                                    </Text>
                                    :
                                    null
                                }
                                {this.state.state >= 3 ?
                                    <Text appearance='hint'>
                                        You are currenly in the car with your beeper.
                                    </Text>
                                    :
                                    null
                                }
                            </Layout>
                            :
                            null
                        }

                        <Layout style={styles.group}>
                            {(this.state.ridersQueuePosition == 0) ?
                                <>
                                <Text>You are at the top of {this.state.beeper.first}'s queue.</Text>
                                <Text appearance='hint'>{this.state.beeper.first} is currently serving you.</Text>


                                </>

                                :
                                <>
                                <Text category='h6'>{this.state.ridersQueuePosition}</Text>
                                <Text appearance='hint'>is your potition in {this.state.beeper.first}'s queue.</Text>
                                </>
                            }
                        </Layout>

                        <Button
                            status='basic'
                            accessoryRight={PhoneIcon}
                            style={styles.buttons}
                            title="Text Beeper"
                            onPress={() =>{ Linking.openURL('tel:' + this.state.beeper.phone); } }
                        >
                        Call Beeper
                        </Button>

                        <Button
                            status='basic'
                            accessoryRight={TextIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('sms:' + this.state.beeper.phone); } }
                        >
                        Text Beeper
                        </Button>
                        <Button
                            status='info'
                            accessoryRight={VenmoIcon}
                            style={styles.buttons}
                            onPress={this.handleVenmo}
                        >
                        Pay Beeper with Venmo
                        </Button> 
                        {(this.state.groupSize > 1) ?

                        <Button
                            status='basic'
                            accessoryRight={ShareIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('sms:' + this.state.beeper.phone); } }
                        >
                        Share Venmo Info with Your Group
                        </Button>
                        
                        : null}
                    </Layout>
                );
            }
            else {
                return (
                    <Layout style={styles.container}>

                        <Layout style={styles.group}>
                        <Text appearance='hint'>Waiting on</Text>
                        <Text category='h6'>{this.state.beeper.first} {this.state.beeper.last}</Text>
                        <Text appearance='hint'>to accept your request.</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beeper.first}'s Rates</Text>
                            <Layout style={styles.rateGroup}>
                                <Layout style={styles.rateLayout}>
                                    <Text appearance='hint'>Single</Text>
                                    <Text>${this.state.beeper.singlesRate}</Text>
                                </Layout>
                                <Layout style={styles.rateLayout} >
                                    <Text appearance='hint'>Group</Text>
                                    <Text>${this.state.beeper.groupRate}</Text>
                                </Layout>
                            </Layout>
                        </Layout>

                        <Layout style={styles.group}>
                        <Text appearance='hint'>{this.state.beeper.first}'s total queue size is</Text>
                        <Text category='h6'>{this.state.beeper.queueSize}</Text>
                        </Layout>

                        {!this.state.isLoading ?
                            <Button
                                accessoryRight={LeaveIcon}
                                onPress={() => this.leaveQueue()}
                            >
                            Leave Queue
                            </Button>
                            :
                            <Button appearance='outline'>
                                Loading
                            </Button>
                        }
                    </Layout>
                );
            }
        }
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: 'center',
    },
    buttons: {
        marginBottom:5,
        width: "80%"
    },
    rowItem: {
        marginBottom:5,
        width: "95%"
    },
    group: {
        alignItems: "center",
        marginBottom: 16,
        width: '100%'
    },
    groupConatiner: {
        flexDirection: 'row',
        width: "80%",
        alignItems: "center",
        justifyContent: 'center',
    },
    rateGroup: {
        flexDirection: 'row',
        width: 120
    },
    layout: {
        flex: 1,
    },
    rateLayout: {
        flex: 1,
        alignItems: "center",
        justifyContent: 'center',
    },
});
