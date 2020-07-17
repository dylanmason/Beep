import React, { Component } from 'react';
import * as Location from 'expo-location';
import { StyleSheet, AsyncStorage, Linking, Platform, AppState } from 'react-native';
import { Card, Layout, Text, Button, Input, Toggle, List, ListItem, Modal } from '@ui-kitten/components';
import socket from '../utils/Socket'
import { UserContext } from '../utils/UserContext.js';
import {
    PhoneIcon,
    TextIcon,
    VenmoIcon,
    AcceptIcon,
    DenyIcon,
    MapsIcon,
    DollarIcon
} from '../utils/Icons.js';

export class StartBeepingScreen extends Component {
    static contextType = UserContext;

    state = {
        showStartBeepingError: false,
        isBeeping: this.context.user.isBeeping,
        queue: [],
        capacity: "" + this.context.user.capacity,
        singlesRate: this.context.user.singlesRate,
        groupRate: this.context.user.groupRate
    };

    /**
     * Get User's Data from AsyncStorage
     */
    retrieveData = async () => {
        //Upon loading user data into states, get User's bepper status
        //to make sure our toggle switch is accurate with our database
        fetch('https://beep.nussman.us/api/beeper/status/' + this.context.user.id)
        .then((response) => response.json())
        .then(
            async (responseJson) => {
                console.log("[StartBeeping.js] [API] Load Beeper's State Responce: ", responseJson);
                if (this.state.isBeeping !== responseJson.isBeeping) {
                    this.setState({isBeeping: responseJson.isBeeping});
                }

                if(responseJson.isBeeping) {
                    //if user turns 'isBeeping' on (to true), subscribe to rethinkdb changes
                    this.enableGetQueue();
                    this.getQueue();
                    let { status } = await Location.requestPermissionsAsync();
                    if (status !== 'granted') {
                        //if we have no location access, dont let the user beep
                        //TODO: we only disable beeping client side, should we push false to server also?
                        this.setState({isBeeping: false});
                        this.disableGetQueue();
                        alert("ERROR: You must allow location to beep!");
                    }
                }
                else {
                    //if user turns 'isBeeping' off (to false), unsubscribe to rethinkdb changes
                    //this.setState({isBeeping: false});
                    this.disableGetQueue();
                }
            }
        )
        .catch((error) =>
        {
            console.error("[StartBeeping.js] [API] ", error);
        });
    }

    componentDidMount () {
        //get user information and set toggle switch to correct status on mount
        this.retrieveData();

        AppState.addEventListener("change", this.handleAppStateChange);

        socket.on("updateQueue", queue => {
            console.log("[StartBeeping.js] [Socket.io] Socktio.io told us to update queue!");
            this.getQueue();
        });
    }

    componentWillUnmount() {
        AppState.removeEventListener("change", this.handleAppStateChange);
    }

    handleAppStateChange = nextAppState => {
        if (nextAppState === "active" && !socket.connected && this.state.isBeeping) {
            console.log("socket is not connected but user is beeping! We need to resubscribe and get our queue.");
            this.enableGetQueue();
            this.getQueue();
        }
    }

    getQueue() {
        //We will need to use user's token to update their status
        let token = this.context.user.token;

        //Data we will POST to beeper status enpoint API
        var data = {
            "token": token
        }

        fetch("https://beep.nussman.us/api/beeper/queue", {
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
                        console.log('[StartBeeping.js] [API]  Looks like our API is not responding correctly. Status Code: ' + response.status);
                        return;
                    }
                    response.json().then(
                        function(data) {
                            if (data.status === "success") {
                                //We sucessfuly updated beeper status in database
                                let currentIndex;
                                for(let i = 0;  i < data.queue.length; i++) {
                                    if (data.queue[i].isAccepted) {
                                        currentIndex = i;
                                        break;
                                    }
                                }
                                this.setState({queue: data.queue, currentIndex: currentIndex});
                            }
                            else {
                                console.warn(data.message, " Thread: ", this.state.username);
                            }
                        }.bind(this)
                    );
                }.bind(this)
            )
        .catch((error) => {
             console.log("[StartBeeping.js] [API] Error fetching from the Beep API: ", error);
        });
    }

    toggleSwitch = async (value) => {
        //Update the toggle switch's value into a isBeeping state
        this.setState({isBeeping: value});

        if (value) {
            let { status } = await Location.requestPermissionsAsync();
            if (status !== 'granted') {
                //TODO: should I ensure the db agrees 
                this.setState({isBeeping: !this.state.isBeeping});
                alert("ERROR: You must allow location to beep!");
                return;
            }
            //if user turns 'isBeeping' on (to true), subscribe to rethinkdb changes
            this.enableGetQueue();
        }
        else {
            //if user turns 'isBeeping' off (to false), unsubscribe to rethinkdb changes
            this.disableGetQueue();
        }

        fetch("https://beep.nussman.us/api/beeper/status", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body:  JSON.stringify({
                "token": this.context.user.token,
                "isBeeping": value,
                "singlesRate": this.state.singlesRate,
                "groupRate": this.state.groupRate,
                "capacity": this.state.capacity
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
                        if (data.status === "success") {
                            //We sucessfuly updated beeper status in database
                            console.log("[StartBeeping.js] [API] Successfully updated beeper's status!");
                            if (value) {
                                this.getQueue();
                            }

                            let tempUser = JSON.parse(JSON.stringify(this.context.user));
                            tempUser.isBeeping = value;
                            AsyncStorage.setItem('@user', JSON.stringify(tempUser));
                        }
                        else {
                            //Use native popup to tell user why they could not change their status
                            //Unupdate the toggle switch because something failed
                            //We redo our actions so the client does not have to wait on server to update the switch
                            this.setState({startBeepingError: data.message, showStartBeepingError: true, isBeeping: !this.state.isBeeping});
                            //we also need to resubscribe to the socket
                            if (this.state.isBeeping) {
                                this.enableGetQueue();
                            }
                            else {
                                this.disableGetQueue();
                            }
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[StartBeeping.js] [API] Error fetching from the Beep API: ", error);
        });
    }

    enableGetQueue = () => {
        console.log("Subscribing to Socket.io for Beeper's Queue");
        //tell the socket server we want to get updates of our queue
        socket.emit('getQueue', this.context.user.id);
    }

    disableGetQueue = () => {
        console.log("Unsubscribing to Socket.io for Beeper's Queue");
        //tell socket.io to close cursor
        socket.emit('stopGetQueue');
    }

    AcceptDeny = (queueID, riderID, value) => {
        fetch("https://beep.nussman.us/api/beeper/queue/status", {
            method: "POST",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body:  JSON.stringify({
                "token": this.context.user.token,
                "value": value,
                "queueID": queueID,
                "riderID": riderID
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
                        console.log("[StartBeeping.js] [API] Accept or Deny API Responce: ", data);

                        if (data.status === "error") {
                            this.setState({startBeepingError: data.message, showStartBeepingError: true});
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[StartBeeping.js] [API] Error fetching from the Beep API: ", error);
        });
    }

    updateSingles = (value) => {
        this.setState({singlesRate: value});

        let tempUser = JSON.parse(JSON.stringify(this.context.user));
        tempUser.singlesRate = value;
        AsyncStorage.setItem('@user', JSON.stringify(tempUser));
    }

    updateGroup = (value) => {
        this.setState({groupRate: value});

        let tempUser = JSON.parse(JSON.stringify(this.context.user));
        tempUser.groupRate = value;
        AsyncStorage.setItem('@user', JSON.stringify(tempUser));
    }

    updateCapacity = (value) => {
        this.setState({capacity: value});

        let tempUser = JSON.parse(JSON.stringify(this.context.user));
        tempUser.capacity = value;
        AsyncStorage.setItem('@user', JSON.stringify(tempUser));
    }

    handleDirections = (origin, dest) => {
        const platform = Platform.OS;
        if (platform == 'ios') {
            Linking.openURL('https://www.google.com/maps/dir/' + origin + '/' + dest + '/');
        }
        else {
            Linking.openURL('https://www.google.com/maps/dir/' + origin + '/' + dest + '/');
        }
    }

    render () {
        console.log("[StartBeeping.js] Rendering Start Beeping Screen");
        if(!this.state.isBeeping) {
            return (
                <Layout style={styles.container}>
                    <Toggle
                        style={styles.toggle}
                        onChange = {this.toggleSwitch}
                        checked = {this.state.isBeeping}
                    >
                    Toggle Beeping Status
                    </Toggle>
                    <Input
                        label='Max Capacity'
                        caption='The maximum number of people you can fit in your vehicle not including yourself.'
                        placeholder='Max Capcity'
                        keyboardType='numeric'
                        style={styles.inputs}
                        value={this.state.capacity}
                        onChangeText={(value) => this.updateCapacity(value)}
                    />
                    <Input
                        label='Singles Rate'
                        caption='Riders who need a ride alone will pay this price.'
                        placeholder='Singles Rate'
                        keyboardType='numeric'
                        style={styles.inputs}
                        value={this.state.singlesRate}
                        accessoryLeft={DollarIcon}
                        onChangeText={(value) => this.updateSingles(value)}
                    />
                    <Input
                        label='Group Rate'
                        caption='Riders who ride in a group will each pay this price.'
                        placeholder='Group Rate'
                        keyboardType='numeric'
                        style={styles.inputs}
                        value={this.state.groupRate}
                        accessoryLeft={DollarIcon}
                        onChangeText={(value) => this.updateGroup(value)}
                    />
                    <Modal visible={this.state.showStartBeepingError}>
                        <Card disabled={true}>
                        <Text>
                            {this.state.startBeepingError}
                        </Text>
                            <Button onPress={() => this.setState({showStartBeepingError: false})}>
                            Close
                            </Button>
                        </Card>
                    </Modal>
                </Layout>
            );
        }
        else {
            if (this.state.queue && this.state.queue.length != 0) {
                const renderItemAccessory = (id, riderid) => (
                    <Layout style={styles.row}>
                        <Button
                            size='small'
                            status='danger'
                            style={{marginRight: 5}}
                            onPress={()=> this.AcceptDeny(id, riderid, "deny")}
                        >
                            Deny
                        </Button>
                        <Button
                            size='small'
                            status='success'
                            onPress={()=> this.AcceptDeny(id, riderid, "accept")}
                        >
                            Accept
                        </Button>
                    </Layout>
                );
                const renderCurrentBeep = (id, riderid, state) => (
                    <Layout style={styles.row}>
                        <Button size='tiny' appearance='outline' style={{marginRight: 5}}>Current Beep</Button>
                        {(state == 0) ?
                            <Button
                                size='small'
                                onPress={()=> this.AcceptDeny(id, riderid, "next")}
                            >
                                i'm on the way
                            </Button>

                            :

                            null
                        }

                        {(state == 1) ?
                            <Button
                                size='small'
                                onPress={()=> this.AcceptDeny(id, riderid, "next")}
                            >
                                i'm here
                            </Button>

                            :

                            null
                        }

                        {(state == 2) ?
                            <Button
                                size='small'
                                onPress={()=> this.AcceptDeny(id, riderid, "next")}
                            >
                                i'm now beeping this rider
                            </Button>

                            :

                            null
                        }

                        {(state >= 3) ?
                            <Button
                                size='small'
                                onPress={()=> this.AcceptDeny(id, riderid, "complete")}
                            >
                                i'm done beeping rider
                            </Button>

                            :

                            null
                        }
                    </Layout>
                );
                return (
                    <Layout style={styles.container}>
                        <Toggle
                            style={styles.toggle}
                            onChange = {this.toggleSwitch}
                            checked = {this.state.isBeeping}
                        >
                        Toggle Beeping Status
                        </Toggle>
                        <List
                            style={styles.list}
                            data={this.state.queue}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({item, index}) =>
                                item.isAccepted ?

                                <>
                                {(this.state.currentIndex == index) ?
                                    <ListItem
                                        title={`${item.personalInfo.first} ${item.personalInfo.last}`}
                                        description={`Group Size: ${item.groupSize}\nPick Up: ${item.origin}\nDestination: ${item.destination}`}
                                        accessoryRight={() => renderCurrentBeep(item.id, item.riderid, item.state)}
                                    />
                                    :
                                    <ListItem
                                        title={`${item.personalInfo.first} ${item.personalInfo.last}`}
                                        description={`Group Size: ${item.groupSize}\nPick Up: ${item.origin}\nDestination: ${item.destination}`}
                                    />
                                }
                                </>

                                :

                                <ListItem
                                    title={`${item.personalInfo.first} ${item.personalInfo.last}`}
                                    description={`Group Size: ${item.groupSize}`}
                                    accessoryRight={() => renderItemAccessory(item.id, item.riderid)}
                                />
                            }
                        />
                        <Modal visible={this.state.showStartBeepingError}>
                            <Card disabled={true}>
                            <Text>
                                {this.state.startBeepingError}
                            </Text>
                                <Button onPress={() => this.setState({showStartBeepingError: false})}>
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
                        <Toggle
                            style={styles.toggle}
                            onChange = {this.toggleSwitch}
                            checked = {this.state.isBeeping}
                        >
                        Toggle Beeping Status
                        </Toggle>
                        <Layout style={styles.empty}>
                            <Text category='h5'>Your queue is empty</Text>
                            <Text appearance='hint'>If someone wants you to beep them, it will appear here. If your app is closed, you will recieve a push notification.</Text>
                        </Layout>
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
        paddingTop: 15 
    },
    title: {
        fontSize: 40,
        padding: 15,
    },
    buttons: {
        marginBottom:5,
    },
    list: {
        width: "90%",
        backgroundColor: 'transparent'
    },
    groupConatiner: {
        flex: 1,
        flexDirection: 'row',
        marginBottom:5,
    },
    layout: {
        flex: 1,
        backgroundColor: 'transparent'
    },
    adbutton: {
        width: "94%"
    },
    toggle: {
        marginBottom: 7
    },
    inputs: {
        width: "80%"
    },
    empty : {
        height: '80%',
        width: '80%',
        alignItems: "center",
        justifyContent: 'center',
    },
    emptyConatiner: {
        width: '85%'
    },
    row: {
        flexDirection: 'row'
    }
});
