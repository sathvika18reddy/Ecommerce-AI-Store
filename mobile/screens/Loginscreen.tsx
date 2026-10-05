import React, { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getGlobalStyles, getColors, spacing } from '../styles/global';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../App';
import { API_URL } from '@env';

const API = API_URL;



export default function LoginScreen() {
  const { isDark } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);
  const navigation = useNavigation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // fraud guard
        if (data.role !== 'user') {
          await fetch(`${API}/log-fraud`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, attempted_role: data.role, platform: 'mobile' }),
          });
          Alert.alert('Access Denied', 'This app is for customers only. Your attempt has been logged.');
          return;
        }
        await login(data.token, data.role);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch { Alert.alert('Error', 'Server error'); }
  };

  return (
    <View style={g.container}>
      <View style={[g.card, { marginTop: 60 }]}>
        <Text style={g.heading}>Welcome Back 👋</Text>
        <Text style={g.subText}>Login to continue</Text>
        <View style={{ marginTop: 20 }}>
          <TextInput
            placeholder="Email" placeholderTextColor={colors.textMuted}
            value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address"
            style={g.input}
          />
          <TextInput
            placeholder="Password" placeholderTextColor={colors.textMuted}
            value={password} onChangeText={setPassword}
            secureTextEntry style={g.input}
          />
        </View>
        <Text onPress={handleLogin} style={[g.btnPrimary, { marginTop: 10 }]}>
          <Text style={g.btnPrimaryText}>Login</Text>
        </Text>
        <Text
          onPress={() => (navigation as any).replace('Signup')}
          style={[g.subText, { textAlign: 'center', marginTop: 20 }]}
        >
          Don't have an account?{' '}
          <Text style={g.accentText}>Sign Up</Text>
        </Text>
      </View>
    </View>
  );
}