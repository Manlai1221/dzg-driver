/**
 * Шинэ захиалгуудын жагсаалт — PAID, жолооч хуваарилагдаагүй
 * 5 секунд тутам polling хийнэ + FCM push ирэхэд дахин ачаална
 */
import { C } from "@/constants/theme";
import { Booking, bookingService } from "@/services/booking.service";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Modal, Platform,
  RefreshControl, SafeAreaView, StatusBar, Text,
  TouchableOpacity, View, ScrollView,
} from "react-native";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:  { label: "Хүлээгдэж байна", color: C.warning,  bg: C.warningBg },
  PAID:     { label: "Төлбөр баталгаажсан", color: C.delivery, bg: C.deliveryBg },
  DELIVERY: { label: "Хүргэлтэнд",     color: C.delivery, bg: C.deliveryBg },
  COMPLETED:{ label: "Дууссан",         color: C.success,  bg: C.successBg },
};

export default function OrdersScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [accepting, setAccepting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingService.list();
      // Зөвхөн жолооч хуваарилагдаагүй, хүлээгдэж буй захиалгуудыг харуулна
      const pending = res.bookings.filter(
        (b) => ["PENDING", "PAID"].includes(b.status) && !(b as any).driver
      );
      setBookings(pending);
    } catch (e: any) {
      if (!silent) Alert.alert("Алдаа", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Анхны ачаалал
  useEffect(() => { load(); }, [load]);

  // 5 секунд тутам polling
  useEffect(() => {
    pollRef.current = setInterval(() => load(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  // FCM push notification ирэхэд шууд дахин ачаална
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data as any;
      if (data?.type === "NEW_BOOKING") load(true);
    });
    return () => sub.remove();
  }, [load]);

  const handleAccept = async () => {
    if (!selected) return;
    try {
      setAccepting(true);
      await bookingService.accept(selected._id);
      setSelected(null);
      load(true);
      // Хүргэлтийн tab руу шилжинэ
      router.push("/(tabs)/active");
    } catch (e: any) {
      Alert.alert("Алдаа", e.message);
    } finally {
      setAccepting(false);
    }
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const st = STATUS_LABEL[item.status] ?? STATUS_LABEL.PAID;
    return (
      <TouchableOpacity
        onPress={() => setSelected(item)}
        style={{
          backgroundColor: C.surface, borderRadius: 20,
          padding: 18, marginHorizontal: 16, marginBottom: 12,
          borderWidth: 1, borderColor: C.border,
          shadowColor: C.shadow, shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.textDark }}>{item.code}</Text>
          <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: st.color }}>{st.label}</Text>
          </View>
        </View>

        {item.user && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Ionicons name="person-outline" size={14} color={C.textMd} />
            <Text style={{ fontSize: 13, color: C.textMd }}>
              {[item.user.firstName, item.user.lastName].filter(Boolean).join(" ") || "Хэрэглэгч"}
            </Text>
            {item.user.phone && (
              <Text style={{ fontSize: 13, color: C.textSm }}>• {item.user.phone}</Text>
            )}
          </View>
        )}

        {item.user?.address && (
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
            <Ionicons name="location-outline" size={14} color={C.textMd} style={{ marginTop: 2 }} />
            <Text style={{ fontSize: 13, color: C.textMd, flex: 1 }}>{item.user.address}</Text>
          </View>
        )}

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 13, color: C.textSm }}>
            {item.items?.length ?? 0} бараа
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "800", color: C.textDark }}>
            {(item.totalAmount ?? 0).toLocaleString()}₮
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgMuted }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{
        backgroundColor: C.surface, paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.textDark }}>
          Шинэ захиалгууд
        </Text>
        <Text style={{ fontSize: 13, color: C.textMd, marginTop: 2 }}>
          {bookings.length} захиалга хүлээж байна
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 12, paddingBottom: 80 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80, gap: 12 }}>
              <Ionicons name="receipt-outline" size={56} color={C.border} />
              <Text style={{ fontSize: 16, color: C.textMd, fontWeight: "600" }}>
                Одоогоор захиалга байхгүй
              </Text>
              <Text style={{ fontSize: 13, color: C.textSm }}>
                Шинэ захиалга ирэхэд автоматаар харагдана
              </Text>
            </View>
          }
        />
      )}

      {/* Захиалгын дэлгэрэнгүй modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View style={{
            backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
            paddingTop: 8, maxHeight: "85%",
          }}>
            {/* Handle */}
            <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "800", color: C.textDark }}>
                  {selected?.code}
                </Text>
                <TouchableOpacity onPress={() => setSelected(null)}>
                  <Ionicons name="close-circle" size={28} color={C.textSm} />
                </TouchableOpacity>
              </View>

              {/* Хэрэглэгчийн мэдээлэл */}
              {selected?.user && (
                <View style={{
                  backgroundColor: C.bgMuted, borderRadius: 16, padding: 16, marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSm, marginBottom: 10, letterSpacing: 0.5 }}>
                    ХЭРЭГЛЭГЧ
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Ionicons name="person-outline" size={16} color={C.textMd} />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: C.textDark }}>
                      {[selected.user.firstName, selected.user.lastName].filter(Boolean).join(" ") || "—"}
                    </Text>
                  </View>
                  {selected.user.phone && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Ionicons name="call-outline" size={16} color={C.textMd} />
                      <Text style={{ fontSize: 14, color: C.textMd }}>{selected.user.phone}</Text>
                    </View>
                  )}
                  {selected.user.address && (
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                      <Ionicons name="location-outline" size={16} color={C.delivery} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 14, color: C.textDark, flex: 1, lineHeight: 22 }}>
                        {selected.user.address}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Барааны жагсаалт */}
              <View style={{ backgroundColor: C.bgMuted, borderRadius: 16, padding: 16, marginBottom: 20 }}>
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSm, marginBottom: 10, letterSpacing: 0.5 }}>
                  БАРААНЫ ЖАГСААЛТ
                </Text>
                {selected?.items?.map((item, i) => (
                  <View key={i} style={{
                    flexDirection: "row", justifyContent: "space-between",
                    alignItems: "center", paddingVertical: 8,
                    borderBottomWidth: i < (selected.items.length - 1) ? 1 : 0,
                    borderBottomColor: C.border,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: C.textDark }}>
                        {item.product?.name ?? "Бараа"}
                      </Text>
                      <Text style={{ fontSize: 12, color: C.textSm }}>
                        {(item.product?.price ?? 0).toLocaleString()}₮ × {item.quantity}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: C.textDark }}>
                      {((item.product?.price ?? 0) * item.quantity).toLocaleString()}₮
                    </Text>
                  </View>
                ))}

                <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: C.textDark }}>Нийт</Text>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: C.textDark }}>
                    {(selected?.totalAmount ?? 0).toLocaleString()}₮
                  </Text>
                </View>
              </View>

              {/* Хүлээж авах товч */}
              <TouchableOpacity
                onPress={handleAccept}
                disabled={accepting}
                style={{
                  backgroundColor: accepting ? C.primaryDisabled : C.primary,
                  borderRadius: 20, paddingVertical: 18, alignItems: "center",
                  flexDirection: "row", justifyContent: "center", gap: 10,
                }}
              >
                {accepting
                  ? <ActivityIndicator color={C.onPrimary} />
                  : <>
                      <Ionicons name="checkmark-circle-outline" size={22} color={C.onPrimary} />
                      <Text style={{ color: C.onPrimary, fontSize: 16, fontWeight: "700" }}>
                        Захиалга хүлээж авах
                      </Text>
                    </>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
