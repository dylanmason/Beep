import React, { Component } from 'react';
import { StyleSheet, AsyncStorage, Linking, TouchableWithoutFeedback } from 'react-native';
import { Icon, Layout, Text, Button, Input, CheckBox, Modal, Card } from '@ui-kitten/components';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import socket from '../utils/Socket'
import * as SplashScreen from 'expo-splash-screen';
import { YellowBox } from 'react-native';

YellowBox.ignoreWarnings([
  'Non-serializable values were found in the navigation state',
]);

const PhoneIcon = (props) => (
  <Icon {...props} name='phone-call-outline'/>
);

const TextIcon = (props) => (
  <Icon {...props} name='message-square-outline'/>
);

const VenmoIcon = (props) => (
  <Icon {...props} name='credit-card-outline'/>
);

const LeaveIcon = (props) => (
  <Icon {...props} name='person-remove-outline'/>
);

const BackIcon = (props) => (
  <Icon {...props} name='arrow-back-outline'/>
);

const GetIcon = (props) => (
  <Icon {...props} name='person-done-outline'/>
);

const FindIcon = (props) => (
  <Icon {...props} name='search'/>
);

export class MainFindBeepScreen extends Component {

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
            pickBeeper: true
        }
    }

    /*
    async retrieveData () {
        try {
            const data = await AsyncStorage.multiGet(["@username", "@token", "@id"]);

            this.setState({
                username: data[0][1],
                token: data[1][1],
                id: data[2][1]
            });

            //Once we know things like the user's id, we can now get the status of the rider
            this.getInitialRiderStatus();
        }
        catch (error) {
          console.log("[FindBeep.js] [AsyncStorage] ", error);
        }
    }
    */

    retrieveData () {
        AsyncStorage.multiGet(["@username", "@token", "@id"], (error, data) => {
            this.setState({
                username: data[0][1],
                token: data[1][1],
                id: data[2][1]
            });

            //Once we know things like the user's id, we can now get the status of the rider
            this.getInitialRiderStatus();
        });

    }

    async doneSplash () {
        await SplashScreen.hideAsync();
    }

    componentDidMount () {
        //Run retrieveData to get user's data and save it in states
        this.retrieveData();

        socket.on('updateRiderStatus', data => {
            console.log("[FindBeep.js] [Socket.io] Socket.io told us to update rider status.");
            this.getRiderStatus();
        });
    }

    getInitialRiderStatus() {
        //We will need to use user's token to update their status
        let token = this.state.token;

        //Data we will POST to beeper status enpoint API
        var data = {
            "token": token
        }

        fetch("https://beep.nussman.us/api/rider/status", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body:  JSON.stringify(data)
        })
        .then(
            function(response)
            {
                if (response.status !== 200)
                {
                    console.log('[FindBeep.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        if (data.status === "success") {
                            //if the rider is accepted, we can have more personal info about the beeper
                            if (data.isAccepted) {
                                this.setState({
                                    isAccepted: data.isAccepted,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    queueID: data.queueID,
                                    beepersID: data.beepersID,
                                    foundBeep: true,
                                    beepersQueueSize: data.beepersQueueSize,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate,
                                    beepersPhone: data.beepersPhone,
                                    beepersVenmo: data.beepersVenmo,
                                    ridersQueuePosition: data.ridersQueuePosition,
                                    isLoading: false
                                });
                            }
                            else {
                                this.setState({
                                    isAccepted: data.isAccepted,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    queueID: data.queueID,
                                    beepersID: data.beepersID,
                                    foundBeep: true,
                                    beepersQueueSize: data.beepersQueueSize,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate,
                                    isLoading: false
                                });
                            }

                            this.enableGetRiderStatus();
                        }
                        else {
                            console.log("[FindBeep.js] [API] " , data.message);
                            //this.setState({isLoading: false, foundBeep: false, isAccepted: false});
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[FindBeep.js] [API] Error fetching from the Beep API: ", error);
        });
        this.doneSplash();
    }

    getRiderStatus() {
        //We will need to use user's token to update their status
        let token = this.state.token;

        //Data we will POST to beeper status enpoint API
        var data = {
            "token": token
        }

        fetch("https://beep.nussman.us/api/rider/status", {
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
                    console.log('[FindBeep.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        if (data.status === "success") {
                            if (data.isAccepted) {
                                this.setState({
                                    isAccepted: data.isAccepted,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    queueID: data.queueID,
                                    beepersID: data.beepersID,
                                    foundBeep: true,
                                    beepersQueueSize: data.beepersQueueSize,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate,
                                    beepersPhone: data.beepersPhone,
                                    beepersVenmo: data.beepersVenmo,
                                    ridersQueuePosition: data.ridersQueuePosition,
                                    state: data.state
                                });
                            }
                            else {
                                this.setState({
                                    isAccepted: data.isAccepted,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    queueID: data.queueID,
                                    beepersID: data.beepersID,
                                    foundBeep: true,
                                    beepersQueueSize: data.beepersQueueSize,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate
                                });
                            }
                        }
                        else {
                            console.log("[FindBeep.js] [API] " , data.message);
                            this.setState({isLoading: false, foundBeep: false, isAccepted: false, beepersID: ''});
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
            "token": this.state.token,
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
            body:  JSON.stringify(data)
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
                                beepersID: data.beepersID,
                                beepersFirstName: data.beepersFirstName,
                                beepersLastName: data.beepersLastName,
                                beepersQueueSize: data.beepersQueueSize + 1,
                                beepersSinglesRate: data.beepersSinglesRate,
                                beepersGroupRate: data.beepersGroupRate,
                                queueID: data.queueID,
                                foundBeep: true,
                                isLoading: false
                            });

                            //tell socket server to listen for updates
                            this.enableGetRiderStatus();
                        }
                        else {
                            //alert(data.message);
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
        if (this.state.pickBeeper) {
            const navigationStuff = this.props.navigation;
            console.log("[FindBeep.js] Rider wants to pick their own beeper.");
            navigationStuff.navigate('PickBeepScreen', {
                handlePick: (id) => this.chooseBeep(id)
            });
            return;
        }
        this.setState({isLoading: true});

        var data = {
            "token": this.state.token
        }

        fetch("https://beep.nussman.us/api/rider/find", {
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
                    console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        console.log("[FindBeep.js] Rider API Responce: ", data);

                        if (data.status === "success") {
                            this.setState({
                                beepersID: data.beepersID,
                                beepersFirstName: data.beepersFirstName,
                                beepersLastName: data.beepersLastName,
                                beepersQueueSize: data.beepersQueueSize,
                                beepersSinglesRate: data.beepersSinglesRate,
                                beepersGroupRate: data.beepersGroupRate,
                                beepersCapacity: data.beepersCapacity,
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

        let { status } = await Location.requestPermissionsAsync();

        if (status !== 'granted') {
            //TODO: improve this alert
            alert("You must enable location to use this feature.");
            //If we don't have location permission, DO NOT continue
            return;
        }

        //get location
        let location = await Location.getCurrentPositionAsync({});

        console.log("[FindBeep.js] Setting Origin Location to ", location);

        //Make a string we will use to populate the textbox
        let locationString = location.coords.latitude + "," + location.coords.longitude;

        //Update Origin Location
        this.setState({ startLocation: locationString });
    }

    leaveQueue = () => {
        this.setState({isLoading: true});
        let token = this.state.token;

        var data = {
            "token": token,
            "beepersID": this.state.beepersID
        }

        fetch("https://beep.nussman.us/api/rider/leave", {
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
        //Tell our socket to push updates to user
        socket.emit('getRiderStatus', this.state.beepersID);
    }

    disableGetRiderStatus = () => {
        //Tell our socket to push updates to user
        socket.emit('stopGetRiderStatus');
    }

    render () {
        const CurrentLocationIcon = (props) => (
            <TouchableWithoutFeedback onPress={this.useCurrentLocation}>
                <Icon {...props} name='pin'/>
            </TouchableWithoutFeedback>
        );

        console.log("[MainFindBeep.js] Rendering Main Find Beep");

        if (!this.state.foundBeep) {
            if (this.state.beepersID) {
                return(
                    <Layout style={styles.container}>
                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beepersFirstName} {this.state.beepersLastName}</Text>
                            <Text appearance='hint'>is avalible to beep you!</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beepersFirstName}'s Rates</Text>
                            <Layout style={styles.rateGroup}>
                                <Layout style={styles.rateLayout}>
                                    <Text appearance='hint'>Single</Text>
                                    <Text>${this.state.beepersSinglesRate}</Text>
                                </Layout>
                                <Layout style={styles.rateLayout} >
                                    <Text appearance='hint'>Group</Text>
                                    <Text>${this.state.beepersGroupRate}</Text>
                                </Layout>
                            </Layout>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text appearance='hint'>{this.state.beepersFirstName}'s rider capacity is</Text>
                            <Text category='h6'>{this.state.beepersCapacity}</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text appearance='hint'>{this.state.beepersFirstName}'s total queue size is</Text>
                            <Text category='h6'>{this.state.beepersQueueSize}</Text>
                        </Layout>
                        {!this.state.isLoading ?
                            <Button
                                style={styles.buttons}
                                accessoryRight={GetIcon}
                                onPress={() => this.chooseBeep(this.state.beepersID)}
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
                            onPress={() => this.setState({'beepersID': ''})}
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
                            <Text category='h6'>{this.state.beepersFirstName} {this.state.beepersLastName}</Text>
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
                                {this.state.state == 3 ?
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
                                <Text>You are at the top of {this.state.beepersFirstName}'s queue.</Text>
                                <Text appearance='hint'>{this.state.beepersFirstName} is currently serving you.</Text>


                                </>

                                :
                                <>
                                <Text category='h6'>{this.state.ridersQueuePosition}</Text>
                                <Text appearance='hint'>is your potition in {this.state.beepersFirstName}'s queue.</Text>
                                </>
                            }
                        </Layout>

                        <Button
                            status='basic'
                            accessoryRight={PhoneIcon}
                            style={styles.buttons}
                            title="Text Beeper"
                            onPress={() =>{ Linking.openURL('tel:' + this.state.beepersPhone); } }
                        >
                        Call Beeper
                        </Button>

                        <Button
                            status='basic'
                            accessoryRight={TextIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('sms:' + this.state.beepersPhone); } }
                        >
                        Text Beeper
                        </Button>
                        <Button
                            status='info'
                            accessoryRight={VenmoIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('venmo://paycharge?txn=pay&recipients='+ this.state.beepersVenmo + '&amount= + this.state.beepersGroupRate + &note=Beep'); } }
                        >
                        Pay Beeper with Venmo
                        </Button>
                    </Layout>
                );
            }
            else {
                return (
                    <Layout style={styles.container}>

                        <Layout style={styles.group}>
                        <Text appearance='hint'>Waiting on</Text>
                        <Text category='h6'>{this.state.beepersFirstName} {this.state.beepersLastName}</Text>
                        <Text appearance='hint'>to accept your request.</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beepersFirstName}'s Rates</Text>
                            <Layout style={styles.rateGroup}>
                                <Layout style={styles.rateLayout}>
                                    <Text appearance='hint'>Single</Text>
                                    <Text>${this.state.beepersSinglesRate}</Text>
                                </Layout>
                                <Layout style={styles.rateLayout} >
                                    <Text appearance='hint'>Group</Text>
                                    <Text>${this.state.beepersGroupRate}</Text>
                                </Layout>
                            </Layout>
                        </Layout>

                        <Layout style={styles.group}>
                        <Text appearance='hint'>{this.state.beepersFirstName}'s total queue size is</Text>
                        <Text category='h6'>{this.state.beepersQueueSize}</Text>
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
