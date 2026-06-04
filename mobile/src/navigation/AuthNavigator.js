import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/auth/SplashScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import SetPinScreen from '../screens/auth/SetPinScreen';
import BiometricScreen from '../screens/auth/BiometricScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash"    component={SplashScreen}    />
      <Stack.Screen name="SignIn"    component={SignInScreen}     />
      <Stack.Screen name="OTP"       component={OTPScreen}        />
      <Stack.Screen name="SetPin"    component={SetPinScreen}     />
      <Stack.Screen name="Biometric" component={BiometricScreen}  />
    </Stack.Navigator>
  );
}
