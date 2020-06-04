import React, { Component } from 'react';
import { Layout, Text, Divider, List, ListItem, Icon, TopNavigation, TopNavigationAction } from '@ui-kitten/components';
import { YellowBox } from 'react-native';

YellowBox.ignoreWarnings([
  'Non-serializable values were found in the navigation state',
]);

export class PickBeepScreen extends Component {

    constructor(props) {
        super(props);
        this.state = {
            beeperList: []
        }
    }

    getBeeperList = () => {
        fetch("https://beep.nussman.us/api/rider/list", {
           method: "GET",
           headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
           }
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
                        console.log("[PickBeep.js] Rider API Responce: ", data);

                        if (data.status === "success") {
                            this.setState({beeperList: data.beeperList});
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
        navigation.goBack();
        route.params.handlePick(id);
    }

    render() {
        const BackIcon = (props) => (
             <Icon {...props} name='arrow-back'/>
        );

        const BackAction = () => (
            <TopNavigationAction icon={BackIcon} onPress={() =>this.props.navigation.goBack()}/>
        );

        const renderItem = ({ item, index }) => (
            <ListItem
            onPress={() => this.goBack(item.id)}
            title={`${item.first} ${item.last}`}
            description={`${item.queueSize} in ${item.first}'s queue`}
            />
        );

        return (
            <>
                <TopNavigation title='Beeper List' alignment='center' leftControl={BackAction()}/>
                <List
                    data={this.state.beeperList}
                    ItemSeparatorComponent={Divider}
                    renderItem={renderItem}
                />
            </>
        );
    } 
}
