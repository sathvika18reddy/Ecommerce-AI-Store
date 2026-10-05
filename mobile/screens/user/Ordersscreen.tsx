import React, { useEffect, useState } from "react";
import {
  View, Text, Alert, FlatList, TouchableOpacity, ActivityIndicator,PermissionsAndroid
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { getGlobalStyles, getColors, spacing, radius } from '../../styles/global';
import { useTheme } from '../../context/ThemeContext';
import RNFS from "react-native-fs";
import Share from "react-native-share";
import ReactNativeBlobUtil from "react-native-blob-util";
import { API_URL } from '@env';

const API = API_URL;

type Order = {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  price: number;
  discount_price?: number;
  status: string;
  created_at: string;
};

type GroupedOrder = {
  created_at: string;
  status: string;
  items: Order[];
  groupTotal: number;
};

export default function OrdersScreen() {
  const { isDark } = useTheme();
  const g = getGlobalStyles(isDark);
  const colors = getColors(isDark);

  const [groupedOrders, setGroupedOrders] = useState<GroupedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [canBuyAgain, setCanBuyAgain] = useState(false);
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();

  const local = {
    headerRow: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, marginBottom: spacing.md },
    buyBtn: {
      paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
      backgroundColor: colors.primary, borderRadius: radius.md, alignItems: 'center' as const,
    },
    orderCard: {
      backgroundColor: colors.card, borderRadius: radius.md,
      padding: spacing.md, marginBottom: spacing.sm,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: colors.shadow, shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
    },
    orderHeader: {
      flexDirection: 'row' as const, justifyContent: 'space-between' as const,
      alignItems: 'center' as const, marginBottom: spacing.sm,
    },
    orderDate: { fontSize: 12, color: colors.textMuted },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
    itemRow: {
      flexDirection: 'row' as const, justifyContent: 'space-between' as const,
      alignItems: 'center' as const, paddingVertical: 4,
    },
    itemName: { fontSize: 14, fontWeight: '500' as const, color: colors.textPrimary, flex: 1 },
    itemQtyPrice: { fontSize: 13, color: colors.textSecondary, marginLeft: spacing.sm },
    discountPrice: { fontSize: 13, color: colors.success, fontWeight: '600' as const },
    originalPrice: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' as const },
    totalRow: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, marginTop: spacing.sm },
    totalText: { fontSize: 15, fontWeight: 'bold' as const, color: colors.textPrimary },
    printBtn: {
      flexDirection: 'row' as const, alignItems: 'center' as const,
      paddingVertical: 6, paddingHorizontal: spacing.sm,
      backgroundColor: colors.surface, borderRadius: radius.sm,
      borderWidth: 1, borderColor: colors.border,
    },
    printBtnText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
  };

  const groupOrders = (orders: Order[]): GroupedOrder[] => {
    const map: Record<string, GroupedOrder> = {};
    orders.forEach((order) => {
      const key = order.created_at;
      if (!map[key]) {
        map[key] = { created_at: order.created_at, status: order.status, items: [], groupTotal: 0 };
      }
      map[key].items.push(order);
      map[key].groupTotal += (order.discount_price ?? order.price) * order.quantity;
    });
    return Object.values(map).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const fetchOrders = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API}/orders`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setGroupedOrders(groupOrders(Array.isArray(data) ? data : []));
    setLoading(false);
  };

  const checkBuyAgain = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API}/orders/can-buy-again`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCanBuyAgain(data.available);
  };

  useEffect(() => {
    if (isFocused) { fetchOrders(); checkBuyAgain(); }
  }, [isFocused]);

  const handleBuyAgain = async () => {
    const token = await AsyncStorage.getItem("token");
    const res = await fetch(`${API}/cart/buy-again`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      Alert.alert("✅ Added to cart!");
      setTimeout(() => navigation.navigate("Cart"), 1500);
    } else {
      Alert.alert(data.message ?? "Failed to add to cart.");
    }
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case "pending": return <View style={g.badgePending}><Text style={g.badgePendingText}>Pending</Text></View>;
      case "shipped": return <View style={g.badgeShipped}><Text style={g.badgeShippedText}>Shipped</Text></View>;
      case "delivered": return <View style={g.badgeDelivered}><Text style={g.badgeDeliveredText}>Delivered</Text></View>;
      default: return (
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700' }}>{status}</Text>
        </View>
      );
    }
  };
  

  const handleDownloadInvoice = async (created_at: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const encodedDate = encodeURIComponent(created_at);

      const { config, fs } = ReactNativeBlobUtil;

      const fileName = `invoice-${Date.now()}.pdf`;

      const downloadPath = `${fs.dirs.DownloadDir}/${fileName}`;

      const res = await config({
        fileCache: true,
        appendExt: "pdf",
        path: downloadPath,

        // 🔥 THIS makes it visible in Downloads + shows notification
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadPath,
          description: "Downloading invoice...",
          mime: "application/pdf",
          mediaScannable: true,
        },
      }).fetch(
        "GET",
        `${API}/orders/invoice/${encodedDate}`,
        {
          Authorization: `Bearer ${token}`,
        }
      );

      Alert.alert("Downloaded", "Check your Downloads folder");
    } catch (err) {
      console.log(err);
      Alert.alert("Download failed");
    }
  };

  if (loading) {
    return (
      <View style={g.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[g.mutedText, { marginTop: spacing.sm }]}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={g.container}>
      {canBuyAgain && (
        <View style={local.headerRow}>
          <TouchableOpacity style={local.buyBtn} onPress={handleBuyAgain}>
            <Text style={g.btnPrimaryText}>🔁 Buy Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {groupedOrders.length === 0 ? (
        <Text style={g.empty}>No orders yet.</Text>
      ) : (
        <FlatList
          data={groupedOrders}
          keyExtractor={(item) => item.created_at}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item: group }) => (
            <View style={local.orderCard}>
              <View style={local.orderHeader}>
                <Text style={local.orderDate}>🕐 {new Date(group.created_at).toDateString()}</Text>
                {renderBadge(group.status)}
              </View>
              <View style={local.divider} />
              {group.items.map((item) => (
                <View key={item.id} style={local.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={local.itemName} numberOfLines={1}>{item.name}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 10 }}>
                    {item.discount_price ? (
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Text style={local.discountPrice}>₹{item.discount_price}</Text>
                        <Text style={local.originalPrice}>₹{item.price}</Text>
                      </View>
                    ) : null}
                    <Text style={local.itemQtyPrice}>
                      {item.quantity} × ₹{item.discount_price ?? item.price}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={local.divider} />
              <View style={local.totalRow}>
                <Text style={local.totalText}>Total: ₹{group.groupTotal.toFixed(2)}</Text>
              </View>
              <TouchableOpacity style={[local.printBtn, { marginTop: 8, alignSelf: "flex-end" }]} onPress={() => handleDownloadInvoice(group.created_at)}>
                <Text style={local.printBtnText}>📄 Download Invoice</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}