import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './screens/Loginscreen';
import SignupScreen from './screens/Signupscreen';
import UserTabs from './navigation/UserTabs';
import { ThemeProvider } from './context/ThemeContext';
import { Provider } from 'react-redux';
import { store } from './store/store';

const Stack = createNativeStackNavigator();

type AuthType = {
  isLoggedIn: boolean;
  login: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthType | null>(null);
export const useAuth = () => useContext(AuthContext)!;

export default function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if(await AsyncStorage.getItem('role')==='user'){
        setIsLoggedIn(!!token);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (token: string, role: string) => {
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('role', role);
    if(await AsyncStorage.getItem('role')==='user'){
      setIsLoggedIn(true);
    }
    else{
      Alert.alert("Login only for users");
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('role');
    setIsLoggedIn(false);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={store}> 
      <ThemeProvider>                                       {/* ← add */}
        <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isLoggedIn ? (
                <Stack.Screen name="User" component={UserTabs} />
              ) : (
                <>
                  <Stack.Screen name="Login" component={LoginScreen} />
                  <Stack.Screen name="Signup" component={SignupScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </AuthContext.Provider>                                       {/* ← add */}
      </ThemeProvider>
    </Provider>
  );
}