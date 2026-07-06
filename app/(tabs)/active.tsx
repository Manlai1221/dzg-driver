import { C } from "@/constants/theme";
import { Booking, bookingService } from "@/services/booking.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActiveScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await bookingService.list({ scope: "mine" });
      // scope=mine аль хэдийн DELIVERY-г буцаадаг ч аюулгүйн үүднээс дахин шүүнэ.
      const active = res.bookings.filter((b) => b.status === "DELIVERY");
      setBookings(active);
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
    }, [load]),
  );

  const handleComplete = (booking: Booking) => {
    Alert.alert("Баталгаажуулах", `${booking.code} захиалгыг хүргэж дууссан гэж тэмдэглэх үү?`, [
      { text: "Болих", style: "cancel" },
      {
        text: "Тийм",
        onPress: async () => {
          try {
            setCompletingId(booking._id);
            await bookingService.complete(booking._id);
            // Дууссан захиалгыг жагсаалтаас шууд хасна.
            setBookings((prev) => prev.filter((b) => b._id !== booking._id));
          } catch (e: any) {
            Alert.alert("Алдаа", e.message);
          } finally {
            setCompletingId(null);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgMuted }}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          backgroundColor: C.surface,
          paddingHorizontal: 20,
          paddingTop: Platform.OS === "android" ? 16 : 8,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.textDark }}>Хүргэлт</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.delivery }} />
          <Text style={{ fontSize: 13, color: C.textMd }}>
            {bookings.length} захиалга хүргэж яваа
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 30,
              backgroundColor: C.surface,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Ionicons name="bicycle-outline" size={40} color={C.textSm} />
          </View>
          <Text style={{ fontSize: 16, color: C.textDark, fontWeight: "700" }}>
            Идэвхтэй хүргэлт алга
          </Text>
          <Text style={{ fontSize: 13, color: C.textSm, textAlign: "center", paddingHorizontal: 40 }}>
            Захиалга хүлээж авсны дараа энд харагдана
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => load()} />}
        >
          {bookings.map((booking) => (
            <View
              key={booking._id}
              style={{
                backgroundColor: C.surface,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: C.border,
                overflow: "hidden",
              }}
            >
              {/* Гарчиг — захиалгын код + нийт дүн */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: C.border,
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "800", color: C.textDark }}>
                  {booking.code}
                </Text>
                <Text style={{ fontSize: 16, fontWeight: "800", color: C.textDark }}>
                  {(booking.totalAmount ?? 0).toLocaleString()}₮
                </Text>
              </View>

              <View style={{ padding: 18, gap: 14 }}>
                {/* Хүргэх хаяг + хэрэглэгч */}
                {booking.user ? (
                  <>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <Ionicons
                        name="location"
                        size={20}
                        color={C.delivery}
                        style={{ marginTop: 1 }}
                      />
                      <Text style={{ fontSize: 15, color: C.textDark, flex: 1, lineHeight: 22 }}>
                        {booking.user.address || "—"}
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: "600", color: C.textDark }}>
                          {[booking.user.firstName, booking.user.lastName]
                            .filter(Boolean)
                            .join(" ") || "Хэрэглэгч"}
                        </Text>
                        {booking.user.phone ? (
                          <Text style={{ fontSize: 13, color: C.textMd, marginTop: 2 }}>
                            {booking.user.phone}
                          </Text>
                        ) : null}
                      </View>
                      {booking.user.phone ? (
                        <TouchableOpacity
                          onPress={() => Linking.openURL(`tel:${booking.user?.phone}`)}
                          style={{
                            backgroundColor: C.success,
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 9,
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Ionicons name="call" size={15} color="#fff" />
                          <Text style={{ fontSize: 13, fontWeight: "700", color: "#fff" }}>
                            Залгах
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </>
                ) : null}

                {/* Бараа */}
                <View style={{ borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
                  {booking.items?.map((item, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: 6,
                      }}
                    >
                      <Text style={{ fontSize: 14, color: C.textDark, flex: 1 }}>
                        {item.product?.name ?? "Бараа"}
                      </Text>
                      <Text style={{ fontSize: 13, color: C.textMd }}>× {item.quantity}</Text>
                    </View>
                  ))}
                </View>

                {/* Хүргэгдсэн болгох */}
                <TouchableOpacity
                  onPress={() => handleComplete(booking)}
                  disabled={completingId === booking._id}
                  style={{
                    backgroundColor: completingId === booking._id ? C.primaryDisabled : C.success,
                    borderRadius: 16,
                    paddingVertical: 15,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 10,
                    marginTop: 2,
                  }}
                >
                  {completingId === booking._id ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-outline" size={20} color="#fff" />
                      <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                        Хүргэгдсэн болгох
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
