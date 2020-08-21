import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Text, Spinner } from '@ui-kitten/components';

const ThemeIcon = (props) => (
  <Icon {...props} name='color-palette'/>
);

const LogoutIcon = (props) => (
  <Icon {...props} name='log-out'/>
);

const ProfileIcon = (props) => (
  <Icon {...props} name='person'/>
);

const PasswordIcon = (props) => (
  <Icon {...props} name='lock'/>
);

const ForwardIcon = (props) => (
  <Icon {...props} name='arrow-ios-forward'/>
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

const LeaveIcon = (props) => (
  <Icon {...props} name='person-remove-outline'/>
);

const BackIcon = (props) => (
  <Icon {...props} name='arrow-back-outline'/>
);

const GetIcon = (props) => (
  <Icon {...props} name='person-done-outline'/>
);

const FindIcon = (props) => (
  <Icon {...props} name='search'/>
);

const AcceptIcon = (props) => (
  <Icon {...props} name='checkmark-circle-outline'/>
);

const DenyIcon = (props) => (
  <Icon {...props} name='close-circle-outline'/>
);

const MapsIcon = (props) => (
  <Icon {...props} name='map-outline'/>
);

const DollarIcon = () => (
  <Text>$</Text>
);

const ShareIcon = (props) => (
  <Icon {...props} name='share-outline'/>
);

const EditIcon = (props) => (
  <Icon {...props} name='edit-outline'/>
);

const RefreshIcon = (props) => (
  <Icon {...props} name='refresh-outline'/>
);
const LoginIcon = (props) => (
  <Icon {...props} name='log-in-outline'/>
);

const SignUpIcon = (props) => (
  <Icon {...props} name='person-add-outline'/>
);

const QuestionIcon = (props) => (
  <Icon {...props} name='question-mark-outline'/>
);

const EmailIcon = (props) => (
  <Icon {...props} name='email-outline'/>
);

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

const LoadingIndicator = () => (
  <View style={styles.indicator}>
    <Spinner size='small'/>
  </View>
);

export {
    ThemeIcon,
    LogoutIcon,
    ProfileIcon,
    PasswordIcon,
    ForwardIcon,
    PhoneIcon, 
    TextIcon, 
    VenmoIcon,
    LeaveIcon,
    BackIcon,
    GetIcon,
    FindIcon,
    AcceptIcon,
    DenyIcon,
    MapsIcon,
    DollarIcon,
    ShareIcon,
    EditIcon,
    RefreshIcon,
    LoginIcon,
    SignUpIcon,
    QuestionIcon,
    EmailIcon,
    AcceptIndicator,
    DenyIndicator,
    LoadingIndicator
};


const styles = StyleSheet.create({
    indicator: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
