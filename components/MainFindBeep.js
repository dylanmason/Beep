import React, { Component } from 'react';
import { StyleSheet, AsyncStorage, Linking } from 'react-native';
import { Icon, Layout, Text, Button, Input, CheckBox, Modal, Card } from '@ui-kitten/components';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import socket from '../utils/Socket'

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

const CurrentLocationIcon = (props) => (
  <Icon {...props} name='navigation-2-outline'/>
);

export class MainFindBeepScreen extends Component {
    /*
     * ~~~~~~
     * States
     * ~~~~~~
     * foundBeep - If the rider has found a beeper (Default: False)
     * isAccepted - If the driver has accepted this rider (Default: False)
    */
    state = {
        showFindBeepError: false,
        foundBeep: false,
        isAccepted: false,
        groupSize: '1',
        startLocation: '',
        destination: '',
        pickBeeper: false
    };

    /**
     * Get User's Data from AsyncStorage
     */
    retrieveData = async () => {
        try
        {
            let username = await AsyncStorage.getItem('@username');
            let token = await AsyncStorage.getItem('@token');
            let id = await AsyncStorage.getItem('@id');
            let tokenid = await AsyncStorage.getItem('@tokenid');

            if (id !== null)
            {
                this.setState({
                    username: username,
                    token: token,
                    tokenid: tokenid,
                    id: id
                });

                //Once we know things like the user's id, we can now get the status of the rider
                this.getInitialRiderStatus();
            }
        }
        catch (error)
        {
          console.log("[FindBeep.js] [AsyncStorage] ", error);
        }
    };

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
                        function(data)
                        {
                            if (data.status === "success")
                            {
                                //We sucessfuly gotten riders status from database
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

                                this.enableGetRiderStatus();

                                //if the rider is accepted, we can get more personal information from beeper
                                if (data.isAccepted) {
                                    this.setState({
                                        beepersPhone: data.beepersPhone,
                                        beepersVenmo: data.beepersVenmo,
                                        ridersQueuePosition: data.ridersQueuePosition
                                    });
                                }
                            }
                            else
                            {
                                console.log("[FindBeep.js] [API] " , data.message);
                                this.setState({foundBeep: false, isAccepted: false});
                            }
                        }.bind(this)
                    );
                }.bind(this)
            )
        .catch((error) => {
             console.log("[FindBeep.js] [API] Error fetching from the Beep API: ", error);
        });
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
                function(response)
                {
                    if (response.status !== 200)
                    {
                        console.log('[FindBeep.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data)
                        {
                            if (data.status === "success")
                            {
                                //We sucessfuly gotten riders status from database
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

                                //if the rider is accepted, we can get more personal information from beeper
                                if (data.isAccepted) {
                                    this.setState({
                                        beepersPhone: data.beepersPhone,
                                        beepersVenmo: data.beepersVenmo,
                                        ridersQueuePosition: data.ridersQueuePosition
                                    });
                                }
                            }
                            else
                            {
                                console.log("[FindBeep.js] [API] " , data.message);
                                this.setState({foundBeep: false, isAccepted: false});
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
                function(response)
                {
                    if (response.status !== 200)
                    {
                        console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data)
                        {
                            console.log("[FindBeep.js] Rider API Responce: ", data);

                            if (data.status === "success")
                            {
                                this.setState({
                                    beepersID: data.beepersID,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    beepersQueueSize: data.beepersQueueSize + 1,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate,
                                    queueID: data.queueID,
                                    foundBeep: true
                                });

                                //tell socket server to listen for updates
                                this.enableGetRiderStatus();
                            }
                            else
                            {
                                //alert(data.message);
                                this.setState({findBeepError: data.message, showFindBeepError: true});
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

        var data = {
            "token": this.state.token,
            "origin": this.state.startLocation,
            "destination": this.state.destination,
            "groupSize": this.state.groupSize
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
                function(response)
                {
                    if (response.status !== 200)
                    {
                        console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data)
                        {
                            console.log("[FindBeep.js] Rider API Responce: ", data);

                            if (data.status === "success")
                            {
                                this.setState({
                                    beepersID: data.beepersID,
                                    beepersFirstName: data.beepersFirstName,
                                    beepersLastName: data.beepersLastName,
                                    beepersQueueSize: data.beepersQueueSize + 1,
                                    beepersSinglesRate: data.beepersSinglesRate,
                                    beepersGroupRate: data.beepersGroupRate,
                                    queueID: data.queueID,
                                    foundBeep: true
                                });
                                //tell socket server to listen for updates
                                this.enableGetRiderStatus();
                            }
                            else
                            {
                                //alert(data.message);
                                this.setState({findBeepError: data.message, showFindBeepError: true});
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
                function(response)
                {
                    if (response.status !== 200)
                    {
                        console.log('[StartBeeping.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data)
                        {
                            console.log("[StartBeeping.js] [API] Leave Queue Responce: ", data);

                            if (data.status === "error")
                            {
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
        console.log("[MainFindBeep.js] Rendering Main Find Beep");
        if (!this.state.foundBeep)
        {
            return (
                <Layout style={styles.container}>
                    <Input
                        label='Group Size'
                        style={styles.buttons}
                        placeholder='Group Size'
                        value={this.state.groupSize}
                        onChangeText={value => this.setState({groupSize: value})}
                    />
                    <Layout style={styles.groupConatiner}>
                        <Layout style={styles.layout}>
                            <Input
                                label='Pick-up Location'
                                style={styles.rowItem}
                                placeholder='Pickup Location'
                                value={this.state.startLocation}
                                onChangeText={value => this.setState({startLocation: value})}
                            />
                        </Layout>
                        <Layout style={styles.layout, {width: '15%', marginTop: 15}}>
                            <Button
                                icon={CurrentLocationIcon}
                                onPress={this.useCurrentLocation}
                            >
                            </Button>
                        </Layout>
                    </Layout>
                    <Input
                        label='Destination Location'
                        style={styles.buttons}
                        placeholder='Destination'
                        value={this.state.destination}
                        onChangeText={value => this.setState({destination: value})}
                    />
                    <CheckBox text='Pick your own beeper' checked={this.state.pickBeeper} onChange={(value) => this.setState({pickBeeper: value})}>
                    </CheckBox>
                    <Button
                        onPress={this.findBeep}
                    >
                    Find a Beep
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
        else
        {
            if (this.state.isAccepted)
            {
                return (
                    <Layout style={styles.container}>
                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.beepersFirstName} {this.state.beepersLastName}</Text>
                            <Text appearance='hint'>is your beeper!</Text>
                        </Layout>

                        <Layout style={styles.group}>
                            <Text category='h6'>{this.state.ridersQueuePosition}</Text>
                            <Text appearance='hint'>is your potition in {this.state.beepersFirstName}'s queue.</Text>
                        </Layout>

                        <Button
                            status='basic'
                            icon={PhoneIcon}
                            style={styles.buttons}
                            title="Text Beeper"
                            onPress={() =>{ Linking.openURL('tel:' + this.state.beepersPhone); } }
                        >
                        Call Beeper
                        </Button>

                        <Button
                            status='basic'
                            icon={TextIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('sms:' + this.state.beepersPhone); } }
                        >
                        Text Beeper
                        </Button>
                        <Button
                            status='info'
                            icon={VenmoIcon}
                            style={styles.buttons}
                            onPress={() =>{ Linking.openURL('venmo://paycharge?txn=pay&recipients='+ this.state.beepersVenmo + '&amount= + this.state.beepersGroupRate + &note=Beep'); } }
                        >
                        Pay Beeper with Venmo
                        </Button>
                    </Layout>
                );
            }
            else
            {
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

                        <Button
                            icon={LeaveIcon}
                            onPress={() => this.leaveQueue()}
                        >
                        Leave Queue
                        </Button>
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
        marginBottom: 16
    },
    groupConatiner: {
        flexDirection: 'row',
        width: "80%",
        alignItems: "center",
        justifyContent: 'center',
    },
    rateGroup: {
        flexDirection: 'row',
        width: "80%"
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
