import React, { useState } from 'react';
import { View, Text, TextInput, Alert, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getGlobalStyles, getColors, spacing } from '../styles/global';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '@env';

const API = API_URL;

export default function SignupScreen() {
  const { isDark } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);
  const navigation = useNavigation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.'); return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.'); return;
    }
    try {
      const res = await fetch(`${API}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'user' }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Account created! Please log in.', [
          { text: 'OK', onPress: () => (navigation as any).replace('Login') },
        ]);
      } else {
        Alert.alert('Signup Failed', data.message || 'Please try again.');
      }
    } catch { Alert.alert('Error', 'Could not connect to server.'); }
  };

  return (
    <ScrollView contentContainerStyle={g.container}>
      <View style={[g.card, { marginTop: 40 }]}>
        <Text style={g.heading}>Create Account 🚀</Text>
        <Text style={g.subText}>Join us today</Text>
        <View style={{ marginTop: 20 }}>
          <TextInput placeholder="Full Name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} style={g.input} />
          <TextInput placeholder="Email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={g.input} />
          <TextInput placeholder="Password" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry style={g.input} />
          <TextInput placeholder="Confirm Password" placeholderTextColor={colors.textMuted} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={g.input} />
        </View>
        <Text onPress={handleSignup} style={[g.btnPrimary, { marginTop: 10 }]}>
          <Text style={g.btnPrimaryText}>Sign Up</Text>
        </Text>
        <Text
          onPress={() => (navigation as any).replace('Login')}
          style={[g.subText, { textAlign: 'center', marginTop: 20 }]}
        >
          Already have an account?{' '}
          <Text style={g.accentText}>Login</Text>
        </Text>
      </View>
    </ScrollView>
  );
}