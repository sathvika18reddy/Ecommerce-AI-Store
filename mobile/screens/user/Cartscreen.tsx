import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, Modal, TextInput, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { decode } from 'base-64';
import { useIsFocused } from '@react-navigation/native';
import { getGlobalStyles, getColors, spacing, radius } from '../../styles/global';
import { useTheme } from '../../context/ThemeContext';
import { useAppDispatch } from '../../store/hooks';
import { setTotalItems } from '../../store/cartSlice';
import { API_URL } from '@env';

const API = API_URL;

type CartItem = {
  id: number;
  product_id: number;
  name: string;
  price: number;
  discount_price?: number;
  quantity: number;
  stock: number;
  image_url?: string;
};

type PaymentStage =
  | 'idle' | 'initiating' | 'verifying' | 'processing'
  | 'success' | 'error' | 'pin_error' | 'blocked';

export default function CartScreen() {
  const { isDark } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);
  const dispatch = useAppDispatch();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pin, setPin] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [payStage, setPayStage] = useState<PaymentStage>('idle');
  const [payMessage, setPayMessage] = useState('');
  const socketRef = useRef<Socket | null>(null);

  const local = {
    image: {
      width: 80, height: 80, borderRadius: radius.md,
      backgroundColor: colors.surface, marginRight: spacing.sm,
    },
    imagePlaceholder: {
      width: 80, height: 80, borderRadius: radius.md,
      backgroundColor: colors.surface,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      marginRight: spacing.sm,
    },
    cardRow: { flexDirection: 'row' as const, alignItems: 'center' as const },
    productName: { fontSize: 15, fontWeight: '600' as const, color: colors.textPrimary },
    discountPrice: { fontSize: 14, fontWeight: 'bold' as const, color: colors.success },
    originalPrice: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' as const },
    stepper: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 },
    stepBtn: {
      width: 32, height: 32, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      backgroundColor: colors.surface,
    },
    stepBtnDisabled: { opacity: 0.3 },
    stepBtnText: { fontSize: 18, fontWeight: 'bold' as const, color: colors.textPrimary },
    qty: { fontSize: 15, fontWeight: '600' as const, minWidth: 20, textAlign: 'center' as const, color: colors.textPrimary },
    itemTotal: { fontSize: 15, fontWeight: 'bold' as const, color: colors.textPrimary },
    remove: { fontSize: 12, color: colors.error, marginTop: 4 },
    totalText: { fontSize: 18, fontWeight: 'bold' as const, marginBottom: spacing.sm, color: colors.textPrimary },
    statusBanner: { marginTop: spacing.sm, borderRadius: radius.sm, padding: spacing.sm, alignItems: 'center' as const },
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    modalBox: {
      backgroundColor: colors.card, borderRadius: radius.lg,
      padding: spacing.lg, width: 300,
      borderWidth: 1, borderColor: colors.border,
    },
    modalTitle: { fontSize: 18, fontWeight: 'bold' as const, marginBottom: 4, color: colors.textPrimary },
    pinInput: {
      borderWidth: 2, borderColor: colors.border, borderRadius: radius.md,
      padding: spacing.md, fontSize: 24, textAlign: 'center' as const,
      letterSpacing: 12, marginBottom: spacing.md, marginTop: spacing.sm,
      backgroundColor: colors.surface, color: colors.textPrimary,
    },
    modalBtns: { flexDirection: 'row' as const, gap: spacing.sm },
  };

  const stageColors: Record<PaymentStage, string> = {
    idle: colors.card, initiating: colors.infoBg,
    verifying: colors.warningBg, processing: isDark ? '#1e1b4b' : '#f5f3ff',
    success: colors.successBg, error: colors.errorBg,
    pin_error: colors.warningBg, blocked: colors.errorBg,
  };

  const stageTextColors: Record<PaymentStage, string> = {
    idle: colors.textPrimary, initiating: colors.info,
    verifying: colors.warning, processing: '#7c3aed',
    success: colors.success, error: colors.error,
    pin_error: colors.warning, blocked: colors.error,
  };

  const fetchCart = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const cartItems = Array.isArray(data) ? data : [];
      setItems(cartItems);
      dispatch(setTotalItems(cartItems.reduce((sum: number, i: CartItem) => sum + i.quantity, 0)));
    } catch {
      Alert.alert('Error', 'Could not fetch cart.');
    } finally {
      setLoading(false);
    }
  };

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) { setPayStage('idle'); fetchCart(); }
  }, [isFocused]);

  const updateQty = async (cartId: number, delta: number, current: number, stock: number) => {
    const next = current + delta;
    if (next < 1 || next > stock) return;
    setItems((prev) => {
      const updated = prev.map((item) => item.id === cartId ? { ...item, quantity: next } : item);
      dispatch(setTotalItems(updated.reduce((sum, i) => sum + i.quantity, 0)));
      return updated;
    });
    const token = await AsyncStorage.getItem('token');
    await fetch(`${API}/cart/${cartId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: next }),
    });
  };

  const removeItem = async (cartId: number) => {
    const token = await AsyncStorage.getItem('token');
    await fetch(`${API}/cart/${cartId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== cartId);
      dispatch(setTotalItems(updated.reduce((sum, i) => sum + i.quantity, 0)));
      return updated;
    });
  };

  const getUserIdFromToken = async (): Promise<number> => {
    const token = await AsyncStorage.getItem('token');
    if (!token) return 0;
    try { return JSON.parse(decode(token.split('.')[1])).id; }
    catch { return 0; }
  };

  const submitPayment = async () => {
    if (pin.length !== 4) return;
    setShowPinModal(false);
    setPayStage('initiating');
    setPayMessage('Initiating payment...');
    const userId = await getUserIdFromToken();
    const socket = io(API, { transports: ['websocket'] });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('start_payment', { userId, pin }));
    socket.on('payment_update', ({ stage, message }: { stage: PaymentStage; message: string }) => {
      setPayStage(stage);
      setPayMessage(message);
      if (stage === 'success') {
        setItems([]);
        dispatch(setTotalItems(0));
        socket.disconnect();
        Alert.alert('🎉 Success', 'Order placed successfully!');
      }
      if (stage === 'error' || stage === 'blocked') socket.disconnect();
    });
    socket.on('connect_error', () => {
      setPayStage('error');
      setPayMessage('Could not connect to payment server.');
    });
  };

  const effectivePrice = (item: CartItem) => item.discount_price ?? item.price;
  const total = items.reduce((sum, i) => sum + effectivePrice(i) * i.quantity, 0);

  if (loading) {
    return (
      <View style={g.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={g.container}>
      {items.length === 0 ? (
        <Text style={g.empty}>Your cart is empty.</Text>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item }) => (
              <View style={[g.card, local.cardRow]}>
                {item.image_url ? (
                  <Image source={{ uri: item.image_url }} style={local.image} resizeMode="cover" />
                ) : (
                  <View style={local.imagePlaceholder}>
                    <Text style={{ fontSize: 32 }}>🛍️</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={g.rowBetween}>
                    <Text style={[local.productName, { flex: 1, marginRight: spacing.sm }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={local.itemTotal}>₹{effectivePrice(item) * item.quantity}</Text>
                  </View>
                  {item.discount_price ? (
                    <View style={g.row}>
                      <Text style={local.discountPrice}>₹{item.discount_price}</Text>
                      <Text style={local.originalPrice}> ₹{item.price}</Text>
                    </View>
                  ) : (
                    <Text style={g.subText}>₹{item.price} each</Text>
                  )}
                  <View style={[g.rowBetween, { marginTop: spacing.sm }]}>
                    <View style={local.stepper}>
                      <TouchableOpacity
                        style={[local.stepBtn, item.quantity <= 1 && local.stepBtnDisabled]}
                        onPress={() => updateQty(item.id, -1, item.quantity, item.stock)}
                        disabled={item.quantity <= 1}
                      >
                        <Text style={local.stepBtnText}>−</Text>
                      </TouchableOpacity>
                      <Text style={local.qty}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={[local.stepBtn, item.quantity >= item.stock && local.stepBtnDisabled]}
                        onPress={() => updateQty(item.id, +1, item.quantity, item.stock)}
                        disabled={item.quantity >= item.stock}
                      >
                        <Text style={local.stepBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item.id)}>
                      <Text style={local.remove}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          />
          <View style={g.card}>
            <Text style={local.totalText}>Total: ₹{total.toFixed(2)}</Text>
            <TouchableOpacity
              style={[g.btnPrimary, payStage !== 'idle' && payStage !== 'error' && payStage !== 'pin_error' && g.btnDisabled]}
              onPress={() => { setPin(''); setShowPinModal(true); }}
              disabled={payStage !== 'idle' && payStage !== 'error' && payStage !== 'pin_error'}
            >
              <Text style={g.btnPrimaryText}>Pay Now</Text>
            </TouchableOpacity>
            {payStage !== 'idle' && (
              <View style={[local.statusBanner, { backgroundColor: stageColors[payStage] }]}>
                <Text style={{ color: stageTextColors[payStage], fontWeight: '600' }}>{payMessage}</Text>
              </View>
            )}
          </View>
        </>
      )}

      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={local.modalOverlay}>
          <View style={local.modalBox}>
            <Text style={local.modalTitle}>Enter Payment PIN</Text>
            <Text style={g.subText}>4-digit PIN to confirm payment</Text>
            <TextInput
              value={pin}
              onChangeText={(t) => setPin(t.replace(/\D/g, ''))}
              maxLength={4} keyboardType="numeric" secureTextEntry
              style={local.pinInput} placeholder="••••"
              placeholderTextColor={colors.textMuted}
            />
            <View style={local.modalBtns}>
              <TouchableOpacity style={[g.btnSecondary, { flex: 1 }]} onPress={() => { setShowPinModal(false); setPin(''); }}>
                <Text style={g.btnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[g.btnPrimary, { flex: 1 }, pin.length !== 4 && g.btnDisabled]}
                onPress={submitPayment} disabled={pin.length !== 4}
              >
                <Text style={g.btnPrimaryText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}