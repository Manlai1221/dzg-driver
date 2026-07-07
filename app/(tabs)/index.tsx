import { C } from "@/constants/theme";
import { Booking, bookingContact, bookingService } from "@/services/booking.service";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Linking, Modal, Platform,
  RefreshControl, SafeAreaView, StatusBar, Text,
  TouchableOpacity, View, ScrollView,
} from "react-native";

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Хүлээгдэж байна", color: C.warning, bg: C.warningBg },
  PAID: { label: "Төлбөр баталгаажсан", color: C.delivery, bg: C.deliveryBg },
  DELIVERY: { label: "Хүргэлтэнд", color: C.delivery, bg: C.deliveryBg },
  COMPLETED: { label: "Дууссан", color: C.success, bg: C.successBg },
};

export default function OrdersScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingService.list({ scope: "available" });
      // scope=available аль хэдийн эзэнгүй PAID-г буцаадаг ч аюулгүйн үүднээс дахин шүүнэ.
      const pending = res.bookings.filter(
        (b) => ["PENDING", "PAID"].includes(b.status) && !b.driver
      );
      setBookings(pending);
    } catch (e: any) {
      if (!silent) Alert.alert("Алдаа", e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    pollRef.current = setInterval(() => load(true), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((n) => {
      const data = n.request.content.data as any;
      if (data?.type === "NEW_BOOKING") {
        load(true);
        // Апп нээлттэй үед тод дотоод мэдэгдэл харуулна (5 сек)
        setNewOrderFlash(true);
        if (flashTimer.current) clearTimeout(flashTimer.current);
        flashTimer.current = setTimeout(() => setNewOrderFlash(false), 5000);
      }
    });
    return () => {
      sub.remove();
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [load]);

  const handleAccept = async () => {
    if (!selected) return;
    try {
      setAccepting(true);
      await bookingService.accept(selected._id);
      setSelected(null);
      load(true);
      // Жолооч олон захиалга авч болох тул энд үлдээж, дараагийнхийг
      // үргэлжлүүлэн авах боломжтой болгоно. "Хүргэлт" таб дээр бүх
      // авсан захиалга харагдана.
      Alert.alert(
        "Хүлээж авлаа",
        "Захиалга таны хүргэлтэд нэмэгдлээ. Дараагийн захиалгыг үргэлжлүүлэн авч болно.",
      );
    } catch (e: any) {
      const msg = String(e?.message || "");
      // Backend: "Захиалга олдсонгүй эсвэл аль хэдийн авагдсан байна"
      const alreadyTaken = msg.includes("авагдсан") || msg.includes("олдсонгүй");
      if (alreadyTaken) {
        // Өөр жолооч түрүүлж авсан — modal хааж, жагсаалтыг шинэчилнэ
        setSelected(null);
        load(true);
        Alert.alert("Захиалга авагдсан", "Энэ захиалгыг өөр жолооч аль хэдийн авчихлаа.");
      } else {
        Alert.alert("Алдаа", msg || "Дахин оролдоно уу.");
      }
    } finally {
      setAccepting(false);
    }
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const st = STATUS_LABEL[item.status] ?? STATUS_LABEL.PAID;
    const c = bookingContact(item);
    return (
      <View style={{
        marginHorizontal: 16, marginBottom: 12,
        shadowColor: C.shadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
        borderRadius: 20,
      }}>
        <TouchableOpacity
          onPress={() => setSelected(item)}
          style={{
            backgroundColor: C.surface, borderRadius: 20,
            overflow: "hidden",
            borderWidth: 1, borderColor: C.border,
          }}
        >
          {/* Left accent stripe */}
          <View style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
            backgroundColor: st.color,
          }} />

          <View style={{ padding: 18, paddingLeft: 22 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: "800", color: C.textDark }}>{item.code}</Text>
              <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: st.color }}>{st.label}</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Ionicons name="person-outline" size={14} color={C.textMd} />
              <Text style={{ fontSize: 13, color: C.textMd }}>{c.name}</Text>
              {c.phone ? (
                <Text style={{ fontSize: 13, color: C.textSm }}>• {c.phone}</Text>
              ) : null}
            </View>

            {c.address ? (
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                <Ionicons name="location-outline" size={14} color={C.textMd} style={{ marginTop: 2 }} />
                <Text style={{ fontSize: 13, color: C.textMd, flex: 1 }}>{c.address}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 13, color: C.textSm }}>
                {item.items?.length ?? 0} бараа
              </Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.textDark }}>
                {(item.totalAmount ?? 0).toLocaleString()}₮
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const selectedContact = selected ? bookingContact(selected) : null;

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
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.success }} />
          <Text style={{ fontSize: 13, color: C.textMd }}>
            {bookings.length} захиалга хүлээж байна
          </Text>
        </View>
      </View>

      {/* Шинэ захиалга ирсэн үеийн тод мэдэгдэл (апп нээлттэй үед) */}
      {newOrderFlash && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setNewOrderFlash(false)}
          style={{
            marginHorizontal: 16, marginTop: 12,
            backgroundColor: C.successBg, borderRadius: 16, padding: 14,
            flexDirection: "row", alignItems: "center", gap: 10,
            borderWidth: 1, borderColor: C.success,
          }}
        >
          <Ionicons name="notifications" size={20} color={C.success} />
          <Text style={{ flex: 1, fontSize: 14, fontWeight: "700", color: C.success }}>
            🛵 Шинэ захиалга ирлээ!
          </Text>
          <Ionicons name="close" size={16} color={C.success} />
        </TouchableOpacity>
      )}

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
              <View style={{
                width: 96, height: 96, borderRadius: 32, backgroundColor: C.bgMuted,
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: C.border,
              }}>
                <Ionicons name="receipt-outline" size={44} color={C.textSm} />
              </View>
              <Text style={{ fontSize: 16, color: C.textDark, fontWeight: "700" }}>
                Одоогоор захиалга байхгүй
              </Text>
              <Text style={{ fontSize: 13, color: C.textSm, textAlign: "center", paddingHorizontal: 40 }}>
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
                <View>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: C.textDark }}>
                    {selected?.code}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.textSm, marginTop: 2 }}>Захиалгын дэлгэрэнгүй</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setSelected(null)}
                  style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgMuted, alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="close" size={18} color={C.textMd} />
                </TouchableOpacity>
              </View>

              {/* Хэрэглэгчийн мэдээлэл */}
              {selectedContact && (
                <View style={{
                  backgroundColor: C.bgMuted, borderRadius: 16, padding: 16, marginBottom: 16,
                }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSm, marginBottom: 10, letterSpacing: 0.5 }}>
                    ХЭРЭГЛЭГЧ
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <Ionicons name="person-outline" size={16} color={C.textMd} />
                    <Text style={{ fontSize: 15, fontWeight: "600", color: C.textDark }}>
                      {selectedContact.name}
                    </Text>
                  </View>

                  {selectedContact.phone ? (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        <Ionicons name="call-outline" size={16} color={C.textMd} />
                        <Text style={{ fontSize: 14, color: C.textMd }}>{selectedContact.phone}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${selectedContact.phone}`)}
                        style={{
                          backgroundColor: C.successBg, borderRadius: 12,
                          paddingHorizontal: 12, paddingVertical: 6,
                          flexDirection: "row", alignItems: "center", gap: 4,
                        }}
                      >
                        <Ionicons name="call" size={13} color={C.success} />
                        <Text style={{ fontSize: 12, fontWeight: "700", color: C.success }}>Залгах</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {selectedContact.address ? (
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
                      <Ionicons name="location-outline" size={16} color={C.delivery} style={{ marginTop: 2 }} />
                      <Text style={{ fontSize: 14, color: C.textDark, flex: 1, lineHeight: 22 }}>
                        {selectedContact.address}
                      </Text>
                    </View>
                  ) : null}
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
                  backgroundColor: accepting ? C.primaryDisabled : C.success,
                  borderRadius: 20, paddingVertical: 18, alignItems: "center",
                  flexDirection: "row", justifyContent: "center", gap: 10,
                  shadowColor: C.success, shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: accepting ? 0 : 0.3, shadowRadius: 12, elevation: 6,
                }}
              >
                {accepting
                  ? <ActivityIndicator color="#fff" />
                  : <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
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
