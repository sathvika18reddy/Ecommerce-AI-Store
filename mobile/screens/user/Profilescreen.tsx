import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGlobalStyles, getColors, spacing, radius } from '../../styles/global';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../App';
import { API_URL } from '@env';

const API = API_URL;

export default function ProfileScreen() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [pinError, setPinError] = useState(false);

  const local = {
    container: { padding: spacing.md, backgroundColor: colors.background, paddingBottom: 40 },
    label: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
    value: { fontSize: 15, fontWeight: '500' as const, color: colors.textPrimary, marginTop: 2 },
    sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: colors.textPrimary, marginBottom: 4 },
    sectionSub: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
    pinInput: {
      borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
      padding: spacing.md, fontSize: 24, textAlign: 'center' as const,
      letterSpacing: 12, marginBottom: spacing.md, marginTop: spacing.sm,
      backgroundColor: colors.surface, color: colors.textPrimary,
    },
    pinMsg: { marginTop: spacing.sm, fontSize: 13, color: pinError ? colors.error : colors.success },
    logoutBtn: {
      backgroundColor: colors.errorBg, padding: spacing.md, borderRadius: radius.md,
      alignItems: 'center' as const, borderWidth: 1,
      borderColor: colors.error + '40', marginTop: spacing.sm,
    },
    logoutText: { color: colors.error, fontWeight: '700' as const, fontSize: 15 },
    themeRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'space-between' as const, paddingVertical: spacing.xs,
    },
    themeSubLabel: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
    rowGap: { flexDirection: 'row' as const, gap: spacing.sm, marginTop: spacing.xs },
  };

  const fetchProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/profile`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUser(data); setName(data.name); setEmail(data.email);
    } catch { Alert.alert('Error', 'Could not fetch profile.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchProfile(); }, []);

  const updateProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (res.ok) { setEdit(false); fetchProfile(); Alert.alert('Success', 'Profile updated!'); }
      else { Alert.alert('Error', 'Could not update profile.'); }
    } catch { Alert.alert('Error', 'Server error.'); }
  };

  const setPaymentPin = async () => {
    if (!/^\d{4}$/.test(pin)) { setPinError(true); setPinMsg('PIN must be exactly 4 digits.'); return; }
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/user/set-pin`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok) { setPinError(false); setPinMsg('✅ PIN set successfully!'); setPin(''); }
      else { setPinError(true); setPinMsg(data.message || 'Failed to set PIN.'); }
    } catch { setPinError(true); setPinMsg('Server error.'); }
  };

  if (loading) {
    return (
      <View style={g.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={local.container}>
      <Text style={g.heading}>Profile</Text>

      <View style={g.card}>
        {edit ? (
          <>
            <TextInput value={name} onChangeText={setName} style={g.input} placeholder="Name" placeholderTextColor={colors.textMuted} />
            <TextInput value={email} onChangeText={setEmail} style={g.input} placeholder="Email" placeholderTextColor={colors.textMuted} autoCapitalize="none" />
            <View style={local.rowGap}>
              <TouchableOpacity style={[g.btnSecondary, { flex: 1 }]} onPress={() => setEdit(false)}>
                <Text style={g.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[g.btnPrimary, { flex: 1 }]} onPress={updateProfile}>
                <Text style={g.btnPrimaryText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={local.label}>Name</Text>
            <Text style={local.value}>{user?.name}</Text>
            <Text style={local.label}>Email</Text>
            <Text style={local.value}>{user?.email}</Text>
            <Text style={local.label}>Role</Text>
            <Text style={local.value}>{user?.role}</Text>
            <TouchableOpacity style={[g.btnPrimary, { marginTop: spacing.md }]} onPress={() => setEdit(true)}>
              <Text style={g.btnPrimaryText}>Edit Profile</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={g.card}>
        <Text style={local.sectionTitle}>Payment PIN</Text>
        <Text style={local.sectionSub}>Set a 4-digit PIN for payments.</Text>
        <TextInput
          value={pin}
          onChangeText={(t) => { setPin(t.replace(/\D/g, '')); setPinMsg(''); setPinError(false); }}
          maxLength={4} keyboardType="numeric" secureTextEntry
          placeholder="••••" placeholderTextColor={colors.textMuted}
          style={local.pinInput}
        />
        <TouchableOpacity style={[g.btnPrimary, pin.length !== 4 && g.btnDisabled]} disabled={pin.length !== 4} onPress={setPaymentPin}>
          <Text style={g.btnPrimaryText}>Set PIN</Text>
        </TouchableOpacity>
        {pinMsg !== '' && <Text style={local.pinMsg}>{pinMsg}</Text>}
      </View>

      <View style={g.card}>
        <Text style={local.sectionTitle}>Appearance</Text>
        <View style={local.themeRow}>
          <Text style={local.themeSubLabel}>{isDark ? '🌙 Dark mode' : '☀️ Light mode'}</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: colors.border, true: colors.primary }} />
        </View>
      </View>

      <TouchableOpacity style={local.logoutBtn} onPress={logout}>
        <Text style={local.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}