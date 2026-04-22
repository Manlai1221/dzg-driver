import { C } from "@/constants/theme";
import { Booking, bookingService } from "@/services/booking.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, Alert, Platform, RefreshControl,
  SafeAreaView, ScrollView, StatusBar, Text,
  TouchableOpacity, View,
} from "react-native";

export default function ActiveScreen() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingService.list();
      const active = res.bookings.find((b) => b.status === "DELIVERY");
      setBooking(active ?? null);
    } catch (e: any) {
      if (!silent) Alert.alert("Алдаа", e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => load(true), 5000);
      return () => clearInterval(interval);
    }, [load])
  );

  const handleComplete = async () => {
    if (!booking) return;
    Alert.alert(
      "Баталгаажуулах",
      "Захиалгыг амжилттай хүргэсэн гэж тэмдэглэх үү?",
      [
        { text: "Болих", style: "cancel" },
        {
          text: "Тийм", onPress: async () => {
            try {
              setCompleting(true);
              await bookingService.complete(booking._id);
              setBooking(null);
              Alert.alert("✅ Амжилттай", "Захиалга дууссан тэмдэглэгдлээ");
            } catch (e: any) {
              Alert.alert("Алдаа", e.message);
            } finally {
              setCompleting(false);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgMuted }}>
      <StatusBar barStyle="dark-content" />

      <View style={{
        backgroundColor: C.surface, paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.textDark }}>
          Идэвхтэй хүргэлт
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : !booking ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Ionicons name="bicycle-outline" size={64} color={C.border} />
          <Text style={{ fontSize: 16, color: C.textMd, fontWeight: "600" }}>
            Одоогоор идэвхтэй хүргэлт байхгүй
          </Text>
          <Text style={{ fontSize: 13, color: C.textSm }}>
            Захиалга хүлээж авсны дараа энд харагдана
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => load()} />}
        >
          <View style={{
            backgroundColor: C.deliveryBg, borderRadius: 20, padding: 18, marginBottom: 16,
            flexDirection: "row", alignItems: "center", gap: 12,
          }}>
            <View style={{
              width: 44, height: 44, borderRadius: 14, backgroundColor: C.delivery,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="bicycle" size={22} color="#fff" />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.delivery }}>
                Хүргэлтэнд явж байна
              </Text>
              <Text style={{ fontSize: 13, color: C.delivery, opacity: 0.7 }}>
                {booking.code}
              </Text>
            </View>
          </View>

          {booking.user && (
            <View style={{
              backgroundColor: C.surface, borderRadius: 20, padding: 18,
              marginBottom: 16, borderWidth: 1, borderColor: C.border,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSm, marginBottom: 12, letterSpacing: 0.5 }}>
                ХЭРЭГЛЭГЧ
              </Text>
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="person-outline" size={18} color={C.textMd} />
                  <Text style={{ fontSize: 15, fontWeight: "600", color: C.textDark }}>
                    {[booking.user.firstName, booking.user.lastName].filter(Boolean).join(" ") || "Хэрэглэгч"}
                  </Text>
                </View>
                {booking.user.phone && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Ionicons name="call-outline" size={18} color={C.textMd} />
                    <Text style={{ fontSize: 15, color: C.textMd }}>{booking.user.phone}</Text>
                  </View>
                )}
                {booking.user.address && (
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <Ionicons name="location-outline" size={18} color={C.delivery} style={{ marginTop: 2 }} />
                    <Text style={{ fontSize: 15, color: C.textDark, flex: 1, lineHeight: 24 }}>
                      {booking.user.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          <View style={{
            backgroundColor: C.surface, borderRadius: 20, padding: 18,
            marginBottom: 16, borderWidth: 1, borderColor: C.border,
          }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSm, marginBottom: 12, letterSpacing: 0.5 }}>
              БАРААНЫ ЖАГСААЛТ
            </Text>
            {booking.items?.map((item, i) => (
              <View key={i} style={{
                flexDirection: "row", justifyContent: "space-between",
                alignItems: "center", paddingVertical: 10,
                borderBottomWidth: i < booking.items.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: C.textDark }}>
                    {item.product?.name ?? "Бараа"}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.textSm }}>
                    {(item.product?.price ?? 0).toLocaleString()}₮ × {item.quantity}ш
                  </Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.textDark }}>
                  {((item.product?.price ?? 0) * item.quantity).toLocaleString()}₮
                </Text>
              </View>
            ))}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ fontSize: 15, fontWeight: "700" }}>Нийт дүн</Text>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.textDark }}>
                {(booking.totalAmount ?? 0).toLocaleString()}₮
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleComplete}
            disabled={completing}
            style={{
              backgroundColor: completing ? C.primaryDisabled : C.success,
              borderRadius: 20, paddingVertical: 18, alignItems: "center",
              flexDirection: "row", justifyContent: "center", gap: 10,
              marginBottom: 20,
            }}
          >
            {completing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="checkmark-done-outline" size={22} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
                    Хүргэлт дуусгах
                  </Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
