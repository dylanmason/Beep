import React, { Component } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Spinner } from "@ui-kitten/components";
import { UserContext } from '../utils/UserContext.js';
import { config } from "../utils/config";
import { AcceptIcon, DenyIcon } from "../utils/Icons";

const AcceptIndicator = () => (
  <View style={styles.indicator}>
    <Spinner status="success" size='small'/>
  </View>
);

const DenyIndicator = () => (
  <View style={styles.indicator}>
    <Spinner status="danger" size='small'/>
  </View>
);

export default class AcceptDenyButton extends Component {
    static contextType = UserContext;

    constructor(props) {
        super(props);
        this.state = {
            isLoading: false,
        };
    }

    UNSAFE_componentWillReceiveProps() {
        this.setState({isLoading: false});
    }

    updateStatus(queueID, riderID, value) {
        this.setState({ isLoading: true });

        fetch(config.apiUrl + "/beeper/queue/status", {
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
                            alert(data.message);
                            this.setState({isLoading: false});
                        }
                    }.bind(this)
                );
            }.bind(this)
        )
        .catch((error) => {
             console.log("[StartBeeping.js] [API] Error fetching from the Beep API: ", error);
        });
    }
    

    render() {
        if (this.state.isLoading) {
            return(
                <Button style={styles.button} appearance="outline" status={(this.props.type == "accept") ? "success" : "danger" } accessoryLeft={(this.props.type == "accept") ? AcceptIndicator : DenyIndicator }>
                    Loading
                </Button>
            );
        }

        return (
            <Button style={styles.button} status={(this.props.type == "accept") ? "success" : "danger" } accessoryLeft={(this.props.type == "accept") ? AcceptIcon : DenyIcon } onPress={()=> this.updateStatus(this.props.item.id, this.props.item.riderid, this.props.type)}>
                {(this.props.type == "accept") ? "Accept" : "Deny" }
            </Button>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    button: {
        margin: 2,
    },
    indicator: {
        justifyContent: 'center',
        alignItems: 'center',
    },
});
