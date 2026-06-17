import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
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

const PRIMARY = '#1652F0';

function HomeStackNav() {
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
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8ECEF',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 66,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home:         focused ? 'home'              : 'home-outline',
            Transactions: focused ? 'receipt'           : 'receipt-outline',
            Security:     focused ? 'shield-checkmark'  : 'shield-checkmark-outline',
            Profile:      focused ? 'person'            : 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"         component={HomeStackNav} />
      <Tab.Screen name="Transactions" component={TxStackNav} />
      <Tab.Screen name="Security"     component={SecurityStackNav} />
      <Tab.Screen name="Profile"      component={ProfileScreen} />
    </Tab.Navigator>
  );
}
