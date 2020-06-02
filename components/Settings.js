import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainSettingsScreen } from './MainSettings' 
import { EditProfileScreen } from './EditProfile'

const Stack = createStackNavigator();

export class SettingsScreen extends Component {
    render () {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }} >
                <Stack.Screen name="MainSettingsScreen" component={MainSettingsScreen} />
                <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
            </Stack.Navigator>
        );
    }
}
