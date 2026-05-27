import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import BiometricScreen from '../screens/auth/BiometricScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator({ onAuthSuccess }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="SignIn" children={(props) => <SignInScreen {...props} />} />
      <Stack.Screen name="OTP" children={(props) => <OTPScreen {...props} />} />
      <Stack.Screen name="Biometric" children={(props) => <BiometricScreen {...props} onAuthSuccess={onAuthSuccess} />} />
    </Stack.Navigator>
  );
}
