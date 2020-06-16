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
        try {
            const data = await AsyncStorage.multiGet(["@username", "@token", "@id", "@singlesRate", "@groupRate", "@isBeeping", "@capacity"]);

            this.setState({
                username: data[0][1],
                token: data[1][1],
                id: data[2][1],
                singlesRate: data[3][1],
                groupRate: data[4][1],
                isBeeping: (data[5][1] == 'true'),
                capacity: data[6][1]
            });

            //Upon loading user data into states, get User's bepper status
            //to make sure our toggle switch is accurate with our database
            fetch('https://beep.nussman.us/api/beeper/status/' + data[2][1])
            .then((response) => response.json())
            .then(async (responseJson) =>
            {
                console.log("[StartBeeping.js] [API] Load Beeper's State Responce: ", responseJson);
                this.setState({isBeeping: responseJson.isBeeping});

                if(responseJson.isBeeping) {
                    //if user turns 'isBeeping' on (to true), subscribe to rethinkdb changes
                    this.enableGetQueue();
                    this.getQueue();
                    let { status } = await Location.requestPermissionsAsync();
                    if (status !== 'granted') {
                        this.setState({isBeeping: false});
                        this.disableGetQueue();
                        alert("ERROR: You must allow location to beep!");
                    }
                }
                else {
                    //if user turns 'isBeeping' off (to false), unsubscribe to rethinkdb changes
                    this.setState({isBeeping: false});
                    this.disableGetQueue();
                }
                AsyncStorage.setItem(
                    '@isBeeping',
                    '' + this.state.isBeeping
                );
            })
            .catch((error) =>
            {
                console.error("[StartBeeping.js] [API] ", error);
            });
        }
        catch (error) {
          console.log("[StartBeeping.js] [AsyncStorage] ", error);
        }
    }

    componentDidMount () {
        console.log("mounded StartBeeping");
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
                                let currentIndex;
                                for(let i = 0;  i < data.queue.length; i++) {
                                    if (data.queue[i].isAccepted) {
                                        currentIndex = i;
                                        break;
                                    }
                                }
                                this.setState({queue: data.queue, currentIndex: currentIndex});
                            }
                            else
                            {
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
            "groupRate": this.state.groupRate,
            "capacity": this.state.capacity
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
        AsyncStorage.setItem(
            '@isBeeping',
            '' +this.state.isBeeping
        );
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
        AsyncStorage.setItem('@singlesRate', value);
    }

    updateGroup = (value) => {
        this.setState({groupRate: value});
        AsyncStorage.setItem('@groupRate', value);
    }

    updateCapacity = (value) => {
        this.setState({capacity: value});
        AsyncStorage.setItem('@capacity', value);
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

                        {(state == 3) ?
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
