import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { Vibration, Platform } from 'react-native';
import { config } from '../utils/config';

export async function getPushToken() {

    const hasPermission = await getNotificationPermission();

    if(!hasPermission) {
        return null;
    }

    const pushToken = await Notifications.getExpoPushTokenAsync();
    const token = pushToken.data;

    if (Platform.OS === 'android') {
        Notifications.createChannelAndroidAsync('default', {
            name: 'default',
            sound: true,
            priority: 'max',
            vibrate: [0, 250, 250, 250],
        });
    }

    setNotificationHandlers();

    return token;
}

async function getNotificationPermission() {
    if (!Constants.isDevice) {
        return false;
    }

    const { status } = await Permissions.getAsync(Permissions.NOTIFICATIONS);

    let finalStatus = status;

    if (status !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('[App.js] [Push Notifications] Failed to get push token for push notification!');
        return false;
    }
    return true;
}

function setNotificationHandlers() {
    console.log("Now listening for notifications");
    //Handles forground
    Notifications.setNotificationHandler(handleNotification);

    //Notifications.addNotificationReceivedListener(handleNotification);
}

export async function updatePushToken(token) {
    fetch(config.apiUrl + "/account/pushtoken", {
        method: "POST",
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            "token": token,
            "expoPushToken": await getPushToken()
        })
    })
    .then(
        function(response) {
            if (response.status !== 200) {
                console.log('[Notifications.js] [API] Looks like our API is not responding correctly. Status Code: ' + response.status);
                return;
            }
            response.json().then(
                function(data) {
                    console.log(data);
                }
            );
        }
    )
    .catch((error) => {
        console.log("[Login.js] [API] Error fetching from the Beep (Login) API: ", error);
    });

}

function handleNotification(notification) {
    //Vibrate when we recieve a notification
    Vibration.vibrate();
    //Log the entire notification to the console
    console.log("[App.js] [Notifications] Notification Recieved: ", notification.data);
}
