import { C } from "@/constants/theme";
import {
  Booking,
  bookingContact,
  bookingService,
} from "@/services/booking.service";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActiveScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState<string | null>(null);
  // Хүргэлтийн код баталгаажуулах modal-ийн төлөв.
  const [codeTarget, setCodeTarget] = useState<Booking | null>(null);
  const [codeInput, setCodeInput] = useState("");

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

  // Хүргэлт дуусгах — захиалагчийн 4 оронтой кодыг асуух modal нээнэ.
  const handleComplete = (booking: Booking) => {
    setCodeInput("");
    setCodeTarget(booking);
  };

  const submitComplete = async () => {
    if (!codeTarget) return;
    const code = codeInput.trim();
    if (code.length < 4) {
      Alert.alert("Анхаар", "Захиалагчийн 4 оронтой кодыг оруулна уу.");
      return;
    }
    try {
      setCompletingId(codeTarget._id);
      await bookingService.complete(codeTarget._id, code);
      // Дууссан захиалгыг жагсаалтаас шууд хасна.
      setBookings((prev) => prev.filter((b) => b._id !== codeTarget._id));
      setCodeTarget(null);
      setCodeInput("");
    } catch (e: any) {
      // Код буруу бол backend ValidationError буцаана — modal нээлттэй үлдэнэ.
      Alert.alert("Алдаа", e.message);
    } finally {
      setCompletingId(null);
    }
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
          {bookings.map((booking) => {
            const c = bookingContact(booking);
            return (
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
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <Ionicons
                      name="location"
                      size={20}
                      color={C.delivery}
                      style={{ marginTop: 1 }}
                    />
                    <Text style={{ fontSize: 15, color: C.textDark, flex: 1, lineHeight: 22 }}>
                      {c.address || "—"}
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
                        {c.name}
                      </Text>
                      {c.phone ? (
                        <Text style={{ fontSize: 13, color: C.textMd, marginTop: 2 }}>
                          {c.phone}
                        </Text>
                      ) : null}
                    </View>
                    {c.phone ? (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${c.phone}`)}
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
            );
          })}
        </ScrollView>
      )}

      {/* Хүргэлтийн код баталгаажуулах modal */}
      <Modal
        visible={!!codeTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setCodeTarget(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            paddingHorizontal: 28,
          }}
        >
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 22,
              padding: 22,
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.textDark }}>
              Хүргэлтийн код
            </Text>
            <Text style={{ fontSize: 13, color: C.textMd, lineHeight: 19 }}>
              {codeTarget?.code} захиалгыг хүлээлгэн өгөхдөө захиалагчаас 4 оронтой
              кодыг асууж оруулна уу.
            </Text>
            <TextInput
              value={codeInput}
              onChangeText={(t) => setCodeInput(t.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              placeholder="----"
              placeholderTextColor={C.textSm}
              style={{
                borderWidth: 1.5,
                borderColor: C.border,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 16,
                fontSize: 26,
                fontWeight: "800",
                letterSpacing: 10,
                textAlign: "center",
                color: C.textDark,
              }}
            />
            <View style={{ flexDirection: "row", gap: 10, marginTop: 2 }}>
              <TouchableOpacity
                onPress={() => setCodeTarget(null)}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 1.5,
                  borderColor: C.border,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.textDark }}>
                  Болих
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={submitComplete}
                disabled={!!completingId}
                style={{
                  flex: 1,
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: completingId ? C.primaryDisabled : C.success,
                }}
              >
                {completingId ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                    Баталгаажуулах
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
