import React, { Component } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainFindBeepScreen } from './MainFindBeep' 
import { PickBeepScreen } from './PickBeep'

const Stack = createStackNavigator();

export class FindBeepScreen extends Component {
    render () {
        return (
            <Stack.Navigator screenOptions={{ headerShown: false }} >
                <Stack.Screen name="MainFindBeepScreen" component={MainFindBeepScreen} />
                <Stack.Screen name="PickBeepScreen" component={PickBeepScreen} />
            </Stack.Navigator>
        );
    }
}
