import React, { Component } from 'react';
import { Layout, Text, Divider, List, ListItem, Button, TopNavigation, TopNavigationAction, Spinner } from '@ui-kitten/components';
import { StyleSheet } from 'react-native';
import { config } from "../utils/config";
import { BackIcon, RefreshIcon, GetIcon } from '../utils/Icons';

export class PickBeepScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            beeperList: []
        }
    }

    getBeeperList = () => {
        fetch(config.apiUrl + "/rider/list", {
            method: "GET",
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            }
        })
        .then(
            function(response) {
                if (response.status !== 200) {
                    console.log('Looks like our API is not responding correctly. Status Code: ' + response.status);
                    return;
                }
                response.json().then(
                    function(data) {
                        console.log("[PickBeep.js] Rider API Responce: ", data);

                        if (data.status === "success") {
                            this.setState({isLoading: false, beeperList: data.beeperList});
                        }
                        else {
                            alert(data.message);
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("Error fetching from the Beep (Rider) API: ", error);
        });
    }

    componentDidMount () {
        this.getBeeperList();
    }

    goBack (id) {
        const { navigation, route } = this.props;
        route.params.handlePick(id);
        navigation.goBack();
    }

    render() {
        const BackAction = () => (
            <TopNavigationAction icon={BackIcon} onPress={() =>this.props.navigation.goBack()}/>
        );

        const RefreshAction = () => (
            <TopNavigationAction icon={RefreshIcon} onPress={() => this.getBeeperList()}/>
        );

        const renderItem = ({ item, index }) => (
            <ListItem
                onPress={() => this.goBack(item.id)}
                title={`${item.first} ${item.last}`}
                description={`${item.queueSize} in ${item.first}'s queue\nRider Capacity: ${item.capacity}\nSingles: $${item.singlesRate}\nGroups: $${item.groupRate}`}
                accessoryRight={() => {
                    if (item.isStudent) {
                        return (
                            <Button appearance="outline" size='tiny' accessoryRight={GetIcon}>Student</Button>
                        );
                    }
                    return null;
                }}
            />
        );
        
        if (!this.state.isLoading) {
            if (this.state.beeperList && this.state.beeperList.length != 0) {
                return (
                    <>
                        <TopNavigation title='Beeper List' alignment='center' accessoryLeft={BackAction} accessoryRight={RefreshAction}/>
                        <List
                            data={this.state.beeperList}
                            ItemSeparatorComponent={Divider}
                            renderItem={renderItem}
                        />
                    </>
                );
            }
            else {
                return (
                    <>
                        <TopNavigation title='Beeper List' alignment='center' accessoryLeft={BackAction}/>
                        <Layout style={styles.container}>
                            <Text category='h5'>Nobody is beeping!</Text>
                            <Text appearance='hint'>Nobody is giving rides right now. Check back later!</Text>
                        </Layout>
                    </>
                );
            }
        }
        else {
            return (
                <>
                <TopNavigation title='Beeper List' alignment='center' accessoryLeft={BackAction}/>
                <Layout style={styles.container}>
                    <Spinner size='large' />
                </Layout>
                </>
            );
        }
    } 
}

const styles = StyleSheet.create({
    container: {
        height: '100%',
        alignItems: "center",
        justifyContent: 'center'
    }
});
