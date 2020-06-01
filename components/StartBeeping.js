import React, { Component } from 'react';
import * as Location from 'expo-location';
import { StyleSheet, AsyncStorage, Linking, Platform } from 'react-native';
import { Card, Icon, Layout, Text, Button, Input, Toggle, List, ListItem, Modal } from '@ui-kitten/components';
import socket from '../utils/Socket'

const AcceptIcon = (props) => (
  <Icon {...props} name='checkmark-circle-outline'/>
);

const DenyIcon = (props) => (
  <Icon {...props} name='close-circle-outline'/>
);

const PhoneIcon = (props) => (
  <Icon {...props} name='phone-call-outline'/>
);

const TextIcon = (props) => (
  <Icon {...props} name='message-square-outline'/>
);

const VenmoIcon = (props) => (
  <Icon {...props} name='credit-card-outline'/>
);

const MapsIcon = (props) => (
  <Icon {...props} name='map-outline'/>
);


export class StartBeepingScreen extends Component {

    state = {
        showStartBeepingError: false,
        isBeeping: false
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
            let singlesRate = await AsyncStorage.getItem('@singlesRate');
            let groupRate = await AsyncStorage.getItem('@groupRate');

            if (id !== null)
            {
                this.setState({username: username});
                this.setState({token: token});
                this.setState({tokenid: tokenid});
                this.setState({id: id});
                this.setState({singlesRate: singlesRate});
                this.setState({groupRate: groupRate});

                console.log("[StartBeeping.js] Fetch beeper status for user id: ", id);

                //Upon loading user data into states, get User's bepper status
                //to make sure our toggle switch is accurate with our database
                fetch('https://beep.nussman.us/api/beeper/status/' + id)
                .then((response) => response.json())
                .then(async (responseJson) =>
                {
                    console.log("[StartBeeping.js] [API] Load Beeper's State Responce: ", responseJson);
                    console.log("[StartBeeping.js] [API] Changing isBeeping to: ", responseJson.isBeeping);
                    this.setState({isBeeping: (responseJson.isBeeping == "1")});
                    if((responseJson.isBeeping == "1"))
                    {
                        //if user turns 'isBeeping' on (to true), subscribe to rethinkdb changes
                        this.enableGetQueue();
                        this.getQueue();
                        let { status } = await Location.requestPermissionsAsync();
                        if (status !== 'granted') {
                            this.setState({isBeeping: false});
                            alert("ERROR: You must allow location to beep!");
                        }
                    }
                    else
                    {
                        //if user turns 'isBeeping' off (to false), unsubscribe to rethinkdb changes
                        this.disableGetQueue();
                    }
                })
                .catch((error) =>
                {
                    console.error("[StartBeeping.js] [API] ", error);
                });
            }
        }
        catch (error)
        {
          console.log("[StartBeeping.js] [AsyncStorage] ", error);
        }
    };

    componentDidMount ()
    {
        //get user information and set toggle switch to correct status on mount
        this.retrieveData();
        socket.on("updateQueue", queue => {
            console.log("[StartBeeping.js] [Socket.io] Socktio.io told us to update queue!");
            this.getQueue();
        });
    }

    getQueue() {

            //We will need to use user's token to update their status
            let token = this.state.token;

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
                    function(response)
                    {
                        if (response.status !== 200)
                        {
                            console.log('[StartBeeping.js] [API]  Looks like our API is not responding correctly. Status Code: ' + response.status);
                            return;
                        }
                        response.json().then(
                            function(data)
                            {
                                if (data.status === "success")
                                {
                                    //We sucessfuly updated beeper status in database
                                    this.setState({queue: data.queue});
                                }
                                else
                                {
                                    alert(data.message);
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

        console.log("[StartBeeping.js] [Client] isBeeping: " + value);

        //Update the toggle switch's value into a isBeeping state
        this.setState({isBeeping: value});

        if (value)
        {
            let { status } = await Location.requestPermissionsAsync();
            if (status !== 'granted') {
                this.setState({isBeeping: !this.state.isBeeping});
                alert("ERROR: You must allow location to beep!");
                return;
            }
            //if user turns 'isBeeping' on (to true), subscribe to rethinkdb changes
            this.enableGetQueue();
        }
        else
        {
            //if user turns 'isBeeping' off (to false), unsubscribe to rethinkdb changes
            this.disableGetQueue();
        }

        //Data we will POST to beeper status enpoint API
        var data = {
            "token": this.state.token,
            "isBeeping": value,
            "singlesRate": this.state.singlesRate,
            "groupRate": this.state.groupRate
        }

        fetch("https://beep.nussman.us/api/beeper/status", {
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
                            if (data.status === "success")
                            {
                                //We sucessfuly updated beeper status in database
                                console.log("[StartBeeping.js] [API] Successfully updated beeper's status!");
                                this.getQueue();
                            }
                            else
                            {
                                //Unupdate the toggle switch because something failed
                                //We redo our actions so the client does not have to wait on server to update the switch
                                this.setState({isBeeping: !this.state.isBeeping});
                                //we also need to resubscribe to the socket
                                if (this.state.isBeeping) {
                                    this.enableGetQueue(); 
                                }
                                //Use native popup to tell user why they could not change their status
                                this.setState({startBeepingError: data.message});
                                this.setState({showStartBeepingError: true});
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
        //tell the socket server we want to get updates of our queue
        socket.emit('getQueue', this.state.id);
    }

    disableGetQueue = () => {
        //tell socket.io to close cursor
        socket.emit('stopGetQueue');
    }

    AcceptDeny = (queueID, riderID, value) => {

        let token = this.state.token;

        var data = {
            "token": token,
            "value": value,
            "queueID": queueID,
            "riderID": riderID
        }

        fetch("https://beep.nussman.us/api/beeper/queue/status", {
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
                            console.log("[StartBeeping.js] [API] Accept or Deny API Responce: ", data);

                            if (data.status === "error")
                            {
                                this.setState({startBeepingError: data.message});
                                this.setState({showStartBeepingError: true});
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
        AsyncStorage.setItem('@singlesRate', value);
        console.log("[StartBeeping.js] Setting singles rate to: ", value);
    }

    updateGroup = (value) => {
        this.setState({groupRate: value});
        AsyncStorage.setItem('@groupRate', value);
        console.log("[StartBeeping.js] Setting group rate to: ", value);
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

    render ()
    {
        if(!this.state.isBeeping)
        {
            return (
                <Layout style={styles.container}>
                    <Toggle
                        style={styles.toggle}
                        onChange = {this.toggleSwitch}
                        checked = {this.state.isBeeping}
                    >
                    Beeping Toggle
                    </Toggle>
                    <Input
                        label='Singles Rate'
                        caption='Riders who need a ride alone will pay this price.'
                        placeholder='Singles Rate'
                        keyboardType='numeric'
                        style={styles.inputs}
                        value={this.state.singlesRate}
                        onChangeText={(value) => this.updateSingles(value)}
                    />
                    <Input
                        label='Group Rate'
                        caption='Riders who ride in a group will each pay this price.'
                        placeholder='Group Rate'
                        keyboardType='numeric'
                        style={styles.inputs}
                        value={this.state.groupRate}
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
        else
        {
                return (
                    <Layout style={styles.container}>
                        <Toggle
                            style={styles.toggle}
                            onChange = {this.toggleSwitch}
                            checked = {this.state.isBeeping}
                        >
                        Beeping Toggle
                        </Toggle>
                        <List
                            style={styles.list}
                            data={this.state.queue}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({item}) =>

                            item.isAccepted == false ?

                                <Card>
                                    <Layout style={styles.groupConatiner}>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Rider</Text>
                                            <Text>{item.personalInfo.first} {item.personalInfo.last}</Text>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Entered Queue</Text>
                                            <Text>{new Date(item.timeEnteredQueue * 1000).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</Text>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Group Size</Text>
                                            <Text>{item.groupSize}</Text>
                                        </Layout>
                                    </Layout>
                                    <Layout style={styles.groupConatiner}>
                                        <Layout style={styles.layout}>
                                            <Button style={styles.adbutton} title="Accept" status='success' icon={AcceptIcon} onPress={()=> this.AcceptDeny(item.id, item.riderid, "accept")} >
                                                Accept
                                            </Button>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Button style={styles.adbutton} title="Deny" status='danger' icon={DenyIcon} onPress={()=> this.AcceptDeny(item.id, item.riderid, "deny")}  >
                                                Deny
                                            </Button>
                                        </Layout>
                                    </Layout>
                                </Card>

                               :
                                
                                <Card>
                                    <Layout style={styles.groupConatiner}>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Rider</Text>
                                            <Text>{item.personalInfo.first} {item.personalInfo.last}</Text>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Group Size</Text>
                                            <Text>{item.groupSize}</Text>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Pick Up </Text>
                                            <Text>{item.origin} </Text>
                                        </Layout>
                                        <Layout style={styles.layout}>
                                            <Text category='h6'>Drop Off </Text>
                                            <Text>{item.destination} </Text>
                                        </Layout>
                                    </Layout>
                                    <Button
                                        status='basic'
                                        style={styles.buttons}
                                        icon={PhoneIcon}
                                        onPress={() =>{ Linking.openURL('tel:' + item.personalInfo.phone); } }
                                    >
                                    Call Rider
                                    </Button>

                                    <Button
                                        status='basic'
                                        style={styles.buttons}
                                        icon={TextIcon}
                                        onPress={() =>{ Linking.openURL('sms:' + item.personalInfo.phone); } }
                                    >
                                    Text Rider
                                    </Button>
                                    <Button
                                        status='info'
                                        style={styles.buttons}
                                        icon={VenmoIcon}
                                        onPress={() =>{ Linking.openURL('venmo://paycharge?txn=pay&recipients='+ item.personalInfo.venmo + '&amount= + this.state.beepersGroupRate + &note=Beep'); } }
                                    >
                                    Request Money from Rider with Venmo
                                    </Button>
                                    <Button
                                        status='success'
                                        style={styles.buttons}
                                        icon={MapsIcon}
                                        onPress={() => this.handleDirections(item.origin, item.destination) }
                                    >
                                    Get Directions for Beep
                                    </Button>
                                    <Button onPress={()=> this.AcceptDeny(item.id, item.riderid,"complete")} >
                                    Done Beeping Rider
                                    </Button>
                                </Card>
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
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 30
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
        justifyContent: 'center',
        alignItems: 'center',
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
    }
});