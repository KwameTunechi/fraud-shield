import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

export default function AppNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {isAuthenticated
          ? <MainNavigator onSignOut={() => setIsAuthenticated(false)} />
          : <AuthNavigator onAuthSuccess={() => setIsAuthenticated(true)} />}
      </NavigationContainer>
    </View>
  );
}
