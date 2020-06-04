import React, { Component } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { FindBeepScreen } from './FindBeep';
import { SettingsScreen } from './Settings';
import { StartBeepingScreen } from './StartBeeping';
import { EditProfileScreen } from './EditProfile';
import { BottomNavigation, BottomNavigationTab, Icon } from '@ui-kitten/components';

const { Navigator, Screen } = createBottomTabNavigator();

const MapIcon = (props) => (
  <Icon {...props} name='map'/>
);

const CarIcon = (props) => (
  <Icon {...props} name='car-outline'/>
);

const SettingsIcon = (props) => (
  <Icon {...props} name='settings'/>
);

const BottomTabBar = ({ navigation, state }) => (
    <BottomNavigation
        selectedIndex={state.index}
        onSelect={index => navigation.navigate(state.routeNames[index])}
    >
        <BottomNavigationTab icon={MapIcon} title='Find a Beep'/>
        <BottomNavigationTab icon={CarIcon} title='Start Beeping'/>
        <BottomNavigationTab icon={SettingsIcon} title='Settings'/>
  </BottomNavigation>
);

export class MainScreen extends Component {
    render() {
       return (
            <Navigator tabBar={props => <BottomTabBar {...props} />}>
                <Screen name='Get a Beep' component={FindBeepScreen}/>
                <Screen name='Start Beeping' component={StartBeepingScreen}/>
                <Screen name='Settings' component={SettingsScreen}/>
            </Navigator>
        );
    }
}
