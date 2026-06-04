import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import HomeScreen from '../screens/main/HomeScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import TransactionDetailScreen from '../screens/main/TransactionDetailScreen';
import SendMoneyScreen from '../screens/main/SendMoneyScreen';
import SecurityScreen from '../screens/main/SecurityScreen';
import FraudScenarioScreen from '../screens/main/FraudScenarioScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const TxStack = createNativeStackNavigator();
const SecurityStack = createNativeStackNavigator();

function TabIcon({ name, focused }) {
  const icons = { Home: '🏠', Transactions: '💳', Security: '🛡️', Profile: '👤' };
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{icons[name]}</Text>
    </View>
  );
}

function HomeStackNav({ onSignOut }) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="SendMoney" component={SendMoneyScreen} />
    </HomeStack.Navigator>
  );
}

function TxStackNav() {
  return (
    <TxStack.Navigator screenOptions={{ headerShown: false }}>
      <TxStack.Screen name="TxList" component={TransactionsScreen} />
      <TxStack.Screen name="TxDetail" component={TransactionDetailScreen} />
    </TxStack.Navigator>
  );
}

function SecurityStackNav() {
  return (
    <SecurityStack.Navigator screenOptions={{ headerShown: false }}>
      <SecurityStack.Screen name="SecurityMain" component={SecurityScreen} />
      <SecurityStack.Screen name="FraudScenario" component={FraudScenarioScreen} />
    </SecurityStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarActiveTintColor: '#4338ca',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home" children={() => <HomeStackNav onSignOut={onSignOut} />} />
      <Tab.Screen name="Transactions" component={TxStackNav} />
      <Tab.Screen name="Security" component={SecurityStackNav} />
      <Tab.Screen name="Profile" children={() => <ProfileScreen onSignOut={onSignOut} />} />
    </Tab.Navigator>
  );
}
