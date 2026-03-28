import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { useSelector } from 'react-redux';

import { Colors } from '../constants/Colors';
import {
  AppTabParamList,
  HomeStackParamList,
  ProfileStackParamList,
  ChatsStackParamList,
  SearchStackParamList,
} from '../types';
import HomeScreen from '../screens/HomeScreen';
import RequestDetailScreen from '../screens/RequestDetailScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import { RootState } from '../redux/store';

const BottomTab = createBottomTabNavigator<AppTabParamList>();

export default function BottomTabNavigator() {
  const unreadNotifCount = useSelector(
    (state: RootState) => state.notifications.unreadCount
  );
  const chats = useSelector((state: RootState) => state.chats.chats);
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const userId = user?.sub || user?.id || '';

  const unreadChatCount = React.useMemo(() => {
    return chats.reduce((sum, c) => {
      if (c.donorId !== userId && c.requesterId !== userId) return sum;
      return (
        sum + c.messages.filter((m) => m.senderId !== userId && !m.read).length
      );
    }, 0);
  }, [chats, userId]);

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: Colors.Primary,
        tabBarInactiveTintColor: Colors.TextSecondary,
        tabBarStyle: {
          backgroundColor: Colors.White,
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 0,
        },
        headerShown: false,
      }}>
      <BottomTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <BottomTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarBadge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Chats"
        component={ChatsNavigator}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge: unreadChatCount > 0 ? unreadChatCount : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <BottomTab.Screen
        name="Profile"
        component={ProfileNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}

const HomeStack = createStackNavigator<HomeStackParamList>();

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen
        name="RequestDetail"
        component={RequestDetailScreen}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

const ChatsStack = createStackNavigator<ChatsStackParamList>();

function ChatsNavigator() {
  return (
    <ChatsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChatsStack.Screen name="ChatList" component={ChatListScreen} />
      <ChatsStack.Screen name="Chat" component={ChatScreen} />
    </ChatsStack.Navigator>
  );
}

const ProfileStack = createStackNavigator<ProfileStackParamList>();

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="CreateRequest" component={CreateRequestScreen} />
    </ProfileStack.Navigator>
  );
}
