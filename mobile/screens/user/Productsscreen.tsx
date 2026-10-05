import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, Image, Modal, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';
import { getGlobalStyles, getColors, spacing, radius } from '../../styles/global';
import { useTheme } from '../../context/ThemeContext';
import { useAppDispatch } from '../../store/hooks';
import { setTotalItems } from '../../store/cartSlice';
import Feather from 'react-native-vector-icons/Feather';
import { Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URL } from '@env';

const API = API_URL;

type Product = {
  id: number;
  name: string;
  price: number;
  discount_price?: number;
  qty: number;
  image_url?: string;
  description:string;
};

type CartMap = {
  [product_id: number]: { cartId: number; quantity: number };
};

export default function ProductsScreen() {
  const { isDark } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);
  const dispatch = useAppDispatch();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartMap, setCartMap] = useState<CartMap>({});
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const getTotalQty = (map: CartMap) =>
    Object.values(map).reduce((sum, entry) => sum + entry.quantity, 0);

  // ── alternating pulse ──
  const pulse = useRef(new Animated.Value(1)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;


  const local = {
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'flex-end' as const,
    },
    modalSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      padding: spacing.lg, paddingBottom: 40,
      borderWidth: 1, borderColor: colors.border,
    },
    modalImage: {
      width: '100%' as any, height: 260, borderRadius: radius.md,
      backgroundColor: colors.surface, marginBottom: spacing.md,
    },
    modalImagePlaceholder: {
      width: '100%' as any, height: 260, borderRadius: radius.md,
      backgroundColor: colors.surface,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    modalProductName: {
      fontSize: 22, fontWeight: '800' as const,
      color: colors.textPrimary, marginBottom: spacing.sm,
    },
    modalPrice: { fontSize: 20, fontWeight: '700' as const, color: colors.textPrimary },
    modalDiscountPrice: { fontSize: 20, fontWeight: '700' as const, color: colors.success },
    modalOriginalPrice: {
      fontSize: 15, color: colors.textMuted,
      textDecorationLine: 'line-through' as const, marginLeft: 8,
    },
    modalStock: {
      fontSize: 15, color: colors.textMuted,
      marginTop: spacing.xs, marginBottom: spacing.lg,
    },
    closeBtn: {
      position: 'absolute' as const, top: spacing.md, right: spacing.md,
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: colors.surface,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      zIndex: 10,
    },
    closeBtnText: { fontSize: 16, color: colors.textPrimary, fontWeight: 'bold' as const },
    modalStepperRow: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'center' as const, gap: spacing.lg, marginTop: spacing.md,
    },
    modalStepBtn: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 2, borderColor: colors.primary,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      backgroundColor: colors.surface,
    },
    modalStepBtnText: { fontSize: 24, fontWeight: 'bold' as const, color: colors.primary },
    modalQty: {
      fontSize: 22, fontWeight: '800' as const,
      color: colors.textPrimary, minWidth: 40, textAlign: 'center' as const,
    },
    modalAddBtn: {
      backgroundColor: colors.primary, padding: spacing.md,
      borderRadius: radius.md, alignItems: 'center' as const,
      marginTop: spacing.md, shadowColor: colors.primary,
      shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
    },
    modalAddBtnDisabled: { backgroundColor: colors.disabled, shadowOpacity: 0, elevation: 0 },
    modalAddBtnText: { color: '#fff', fontWeight: '700' as const, fontSize: 16 },
    productCard: {
      flex: 1, width: 160, backgroundColor: colors.card,
      borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
      overflow: 'hidden' as const, shadowColor: colors.shadow,
      shadowOpacity: isDark ? 0.4 : 0.08, shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    productImage: { width: '100%' as any, height: 150, backgroundColor: colors.surface },
    productImagePlaceholder: {
      width: '100%' as any, height: 150, backgroundColor: colors.surface,
      justifyContent: 'center' as const, alignItems: 'center' as const,
    },
    productInfo: { padding: spacing.sm },
    productName: {
      fontSize: 13, fontWeight: '600' as const,
      color: colors.textPrimary, marginBottom: 4, lineHeight: 18,
    },
    price: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' as const },
    discountPrice: { fontSize: 14, fontWeight: 'bold' as const, color: colors.success },
    originalPrice: { fontSize: 11, color: colors.textMuted, textDecorationLine: 'line-through' as const },
    stock: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    outOfStock: { fontSize: 11, color: colors.error, marginTop: 2 },
    addBtn: {
      backgroundColor: colors.primary, paddingVertical: 6,
      borderRadius: radius.sm, alignItems: 'center' as const,
      shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2,
    },
    addBtnDisabled: { backgroundColor: colors.disabled, shadowOpacity: 0, elevation: 0 },
    addBtnText: { color: '#fff', fontWeight: '600' as const, fontSize: 12 },
    stepper: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    stepBtn: {
      width: 28, height: 28, borderRadius: 14,
      borderWidth: 1, borderColor: colors.primary,
      justifyContent: 'center' as const, alignItems: 'center' as const,
      backgroundColor: colors.surface,
    },
    stepBtnDisabled: { opacity: 0.3 },
    stepBtnText: { fontSize: 16, fontWeight: 'bold' as const, color: colors.primary },
    qty: { fontSize: 14, fontWeight: '700' as const, color: colors.textPrimary, textAlign: 'center' as const },
  };

  const fetchData = async (pageNum: number = 1, reset: boolean = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const token = await AsyncStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [productsRes, cartRes] = await Promise.all([
        fetch(`${API}/products?page=${pageNum}&limit=10`, { headers }),
        fetch(`${API}/cart`, { headers }),
      ]);

      const productsData = await productsRes.json();
      const cartData = await cartRes.json();

      const newProducts = Array.isArray(productsData) ? productsData : [];

      // if less than 10 returned, no more pages
      setHasMore(newProducts.length === 10);

      setProducts((prev) => reset || pageNum === 1 ? newProducts : [...prev, ...newProducts]);

      const map: CartMap = {};
      if (Array.isArray(cartData)) {
        cartData.forEach((item: any) => {
          map[item.product_id] = { cartId: item.id, quantity: item.quantity };
        });
      }
      setCartMap(map);
      dispatch(setTotalItems(getTotalQty(map)));
    } catch {
      Alert.alert('Error', 'Could not fetch data.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchData(nextPage);
  };

  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      Animated.loop(
        Animated.sequence([
          // dot grows, text dims
          Animated.parallel([
            Animated.timing(pulse, {
              toValue: 1.6,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 0.4,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          // dot shrinks, text brightens
          Animated.parallel([
            Animated.timing(pulse, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(textOpacity, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
      setPage(1);
      fetchData(1, true);
    }
  }, [isFocused]);

  const addToCart = async (product: Product) => {
    try {
      setAddingId(product.id);
      const token = await AsyncStorage.getItem('token');
      const res = await fetch(`${API}/cart`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, quantity: 1 }),
      });
      if (res.ok) {
        const cartRes = await fetch(`${API}/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const cartData = await cartRes.json();
        const map: CartMap = {};
        cartData.forEach((item: any) => {
          map[item.product_id] = { cartId: item.id, quantity: item.quantity };
        });
        setCartMap(map);
        dispatch(setTotalItems(getTotalQty(map)));
      } else {
        const data = await res.json();
        Alert.alert('Failed', data.message || 'Could not add to cart.');
      }
    } catch {
      Alert.alert('Error', 'Could not connect to server.');
    } finally {
      setAddingId(null);
    }
  };

  const updateQty = async (product: Product, delta: number) => {
    const entry = cartMap[product.id];
    if (!entry) return;
    const next = entry.quantity + delta;
    const token = await AsyncStorage.getItem('token');
    if (next < 1) {
      await fetch(`${API}/cart/${entry.cartId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartMap((prev) => {
        const updated = { ...prev };
        delete updated[product.id];
        dispatch(setTotalItems(getTotalQty(updated)));
        return updated;
      });
      return;
    }
    if (next > product.qty) return;
    const newMap = { ...cartMap, [product.id]: { ...entry, quantity: next } };
    setCartMap(newMap);
    dispatch(setTotalItems(getTotalQty(newMap)));
    await fetch(`${API}/cart/${entry.cartId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: next }),
    });
  };

  if (loading) {
    return (
      <View style={g.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={g.container}>

      {/* ── custom shop header ── */}
      <LinearGradient
        colors={isDark
          ? ['#1a1a2e', '#16213e', '#0f0f1a']
          : ['#eef0fb', '#e8eaf6', '#f4f4fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 20,
          paddingBottom: 25,
          paddingHorizontal: spacing.md,
          marginHorizontal: -spacing.md,
          marginTop: -spacing.md,
        }}
      >
        {/* ── logo row ── */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        }}>
          {/* logo + tagline */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Animated.Text style={{
            fontSize: 40,
            fontWeight: '900',
            color: colors.primary,
            letterSpacing: -1,
            opacity: textOpacity,
          }}>
            STAN
          </Animated.Text>
            {/* ── D: pulsing dot ── */}
            <Animated.View style={{
              width: 6, height: 6,
              borderRadius: 4,
              backgroundColor: colors.accent,
              marginBottom: 12,
              marginLeft: 2,
              transform: [{ scale: pulse }],
              shadowColor: colors.accent,
              shadowOpacity: 0.8,
              shadowRadius: 6,
              elevation: 4,
            }} />
            <View style={{ marginLeft: 8, marginBottom: 9 }}>
              <Text style={{
                fontSize: 10,
                color: colors.textMuted,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}>
                Your Store
              </Text>
            </View>
          </View>

          
        </View>

        {/* ── C: deals banner ── */}
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: radius.md,
            padding: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View>
            <Text style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}>
              Limited Time
            </Text>
            <Text style={{
              fontSize: 18,
              fontWeight: '800',
              color: '#fff',
              letterSpacing: -0.3,
            }}>
              Today's Best Deals 🔥
            </Text>
            <Text style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.75)',
              marginTop: 2,
            }}>
              Up to 30% off on select items
            </Text>
          </View>

          {/* decorative icon */}
          <View style={{
            width: 52, height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(255,255,255,0.15)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 26 }}>🛍️</Text>
          </View>
        </LinearGradient>
      </LinearGradient>

      {products.length === 0 ? (
        <Text style={g.empty}>No products available.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          showsVerticalScrollIndicator={false}          // ← fix 1
          columnWrapperStyle={{ gap: spacing.sm }}
          contentContainerStyle={{ paddingBottom: 20, gap: spacing.sm }}
          onEndReached={loadMore}                        // ← infinite scroll trigger
          onEndReachedThreshold={0.3}                   // ← trigger when 30% from bottom
          ListFooterComponent={                          // ← loading spinner at bottom
            loadingMore ? (
              <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : !hasMore && products.length > 0 ? (
              <Text style={[g.mutedText, { textAlign: 'center', paddingVertical: spacing.lg }]}>
                You've seen all products
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const inCart = cartMap[item.id];
            return (
              <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedProduct(item)}>
                <View style={local.productCard}>
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={local.productImage} resizeMode="cover" />
                  ) : (
                    <View style={local.productImagePlaceholder}>
                      <Text style={{ fontSize: 40 }}>🛍️</Text>
                    </View>
                  )}
                  <View style={local.productInfo}>
                    <Text style={local.productName} numberOfLines={1}>{item.name}</Text>
                    {item.discount_price ? (
                      <View>
                        <Text style={local.discountPrice}>₹{item.discount_price}</Text>
                        <Text style={local.originalPrice}>₹{item.price}</Text>
                      </View>
                    ) : (
                      <Text style={local.price}>₹{item.price}</Text>
                    )}
                    <Text style={item.qty > 0 ? local.stock : local.outOfStock}>
                      {item.qty > 0 ? `${item.qty} in stock` : '❌ Out of stock'}
                    </Text>
                    <View style={{ marginTop: spacing.sm }}>
                      {inCart ? (
                        <View style={local.stepper}>
                          <TouchableOpacity style={local.stepBtn} onPress={() => updateQty(item, -1)}>
                            <Text style={local.stepBtnText}>−</Text>
                          </TouchableOpacity>
                          <Text style={local.qty}>{inCart.quantity}</Text>
                          <TouchableOpacity
                            style={[local.stepBtn, inCart.quantity >= item.qty && local.stepBtnDisabled]}
                            onPress={() => updateQty(item, +1)}
                            disabled={inCart.quantity >= item.qty}
                          >
                            <Text style={local.stepBtnText}>+</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[local.addBtn, (item.qty === 0 || addingId === item.id) && local.addBtnDisabled]}
                          onPress={() => addToCart(item)}
                          disabled={item.qty === 0 || addingId === item.id}
                        >
                          <Text style={local.addBtnText}>
                            {addingId === item.id ? '...' : '+ Cart'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        {selectedProduct && (
          <View style={local.modalOverlay}>
            <ScrollView style={local.modalSheet} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={local.closeBtn} onPress={() => setSelectedProduct(null)}>
                <Text style={local.closeBtnText}>✕</Text>
              </TouchableOpacity>
              {selectedProduct.image_url ? (
                <Image source={{ uri: selectedProduct.image_url }} style={local.modalImage} resizeMode="cover" />
              ) : (
                <View style={local.modalImagePlaceholder}>
                  <Text style={{ fontSize: 60 }}>🛍️</Text>
                </View>
              )}
              <Text style={local.modalProductName}>{selectedProduct.name}</Text>
              <View style={g.row}>
                {selectedProduct.discount_price ? (
                  <>
                    <Text style={local.modalDiscountPrice}>₹{selectedProduct.discount_price}</Text>
                    <Text style={local.modalOriginalPrice}>₹{selectedProduct.price}</Text>
                  </>
                ) : (
                  <Text style={local.modalPrice}>₹{selectedProduct.price}</Text>
                )}
              </View>
              <Text style={local.modalStock}>
                {selectedProduct.qty > 0 ? `${selectedProduct.qty} in stock` : '❌ Out of stock'}
              </Text>
              {selectedProduct.description && (
                <View style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  padding: spacing.md,
                  marginBottom: spacing.md,
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700' as const,
                    color: colors.textSecondary,
                    marginBottom: 6,
                    textTransform: 'uppercase' as const,
                    letterSpacing: 0.8,
                  }}>
                    About this product
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    lineHeight: 22,
                  }}>
                    {selectedProduct.description}
                  </Text>
                </View>
              )}
              <View style={g.divider} />
              {cartMap[selectedProduct.id] ? (
                <>
                  <View style={local.modalStepperRow}>
                    <TouchableOpacity style={local.modalStepBtn} onPress={() => updateQty(selectedProduct, -1)}>
                      <Text style={local.modalStepBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={local.modalQty}>{cartMap[selectedProduct.id].quantity}</Text>
                    <TouchableOpacity
                      style={[local.modalStepBtn, cartMap[selectedProduct.id].quantity >= selectedProduct.qty && local.stepBtnDisabled]}
                      onPress={() => updateQty(selectedProduct, +1)}
                      disabled={cartMap[selectedProduct.id].quantity >= selectedProduct.qty}
                    >
                      <Text style={local.modalStepBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[g.mutedText, { textAlign: 'center', marginTop: spacing.sm }]}>
                    {cartMap[selectedProduct.id].quantity} item(s) in cart
                  </Text>
                </>
              ) : (
                <TouchableOpacity
                  style={[local.modalAddBtn, (selectedProduct.qty === 0 || addingId === selectedProduct.id) && local.modalAddBtnDisabled]}
                  onPress={() => addToCart(selectedProduct)}
                  disabled={selectedProduct.qty === 0 || addingId === selectedProduct.id}
                >
                  <Text style={local.modalAddBtnText}>
                    {addingId === selectedProduct.id ? 'Adding...' : '+ Add to Cart'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}