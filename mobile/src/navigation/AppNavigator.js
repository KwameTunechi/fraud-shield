import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/auth/SplashScreen';

export default function AppNavigator() {
  const { user, loading } = useAuth();

  // Show splash while restoring session from secure storage
  if (loading) return <SplashScreen static />;

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {user ? <MainNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </View>
  );
}
