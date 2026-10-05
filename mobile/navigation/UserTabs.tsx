import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Feather from 'react-native-vector-icons/Feather';
import { useAppSelector } from '../store/hooks';
import { getColors } from '../styles/global';
import { useTheme } from '../context/ThemeContext';

import ProductsScreen from '../screens/user/Productsscreen';
import CartScreen from '../screens/user/Cartscreen';
import OrderScreen from '../screens/user/Ordersscreen';
import ProfileScreen from '../screens/user/Profilescreen';

export type TabParamList = {
  Products: undefined;
  Cart: undefined;
  Order: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function UserTabs() {
  const cartCount = useAppSelector(state => state.cart.totalItems);
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // ── header ──────────────────────────────────────────
        headerStyle: {
          backgroundColor: colors.card,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.textPrimary,
          fontSize: 20,
          fontWeight: '800',
          letterSpacing: 0.3,
        },
        headerTintColor: colors.textPrimary,

        // ── tab bar ─────────────────────────────────────────
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },

        // ── icons ───────────────────────────────────────────
        tabBarIcon: ({ color, size, focused }) => {
          let iconName: string;
          switch (route.name) {
            case 'Products': iconName = 'shopping-bag'; break;
            case 'Cart':     iconName = 'shopping-cart'; break;
            case 'Order':    iconName = 'package'; break;
            case 'Profile':  iconName = 'user'; break;
            default:         iconName = 'circle';
          }

          return (
            <View>
              <Feather
                name={iconName}
                size={focused ? size + 2 : size}
                color={color}
              />
              {route.name === 'Cart' && cartCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  backgroundColor: colors.error,
                  borderRadius: 10,
                  minWidth: 18,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  paddingHorizontal: 3,
                }}>
                  <Text style={{
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: '800',
                  }}>
                    {cartCount > 99 ? '99+' : cartCount}
                  </Text>
                </View>
              )}
            </View>
          );
        },
      })}
    >
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarLabel: 'Shop',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Cart',
          headerTitle: '🛒  Cart',
        }}
      />
      <Tab.Screen
        name="Order"
        component={OrderScreen}
        options={{
          tabBarLabel: 'Orders',
          headerTitle: '📦  Orders',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: '👤  Profile',
        }}
      />
    </Tab.Navigator>
  );
}