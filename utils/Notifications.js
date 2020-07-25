import { Notifications } from 'expo';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import { Vibration } from 'react-native';

export async function registerForPushNotificationsAsync() {
    let pushToken;

    if (Constants.isDevice) {
        const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);

        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[App.js] [Push Notifications] Failed to get push token for push notification!');
            return null;
        }

        //Get Token from Expo Push Notifications
        pushToken = await Notifications.getExpoPushTokenAsync();

        //define a listener to handle notifications
        Notifications.addListener(_handleNotification);
    }

    if (Platform.OS === 'android') {
        Notifications.createChannelAndroidAsync('default', {
            name: 'default',
            sound: true,
            priority: 'max',
            vibrate: [0, 250, 250, 250],
        });
    }

    return pushToken;
}

export function _handleNotification(notification) {
    //Vibrate when we recieve a notification
    Vibration.vibrate();
    //Log the entire notification to the console
    console.log("[App.js] [Notifications] Notification Recieved: ", notification);
}
