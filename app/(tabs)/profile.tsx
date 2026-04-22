import { C } from "@/constants/theme";
import { useDriverStore } from "@/store/useDriverStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Platform, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function ProfileScreen() {
  const { driver, logout } = useDriverStore();

  const handleLogout = () => {
    Alert.alert("Гарах", "Апп-аас гарах уу?", [
      { text: "Болих", style: "cancel" },
      { text: "Гарах", style: "destructive", onPress: async () => {
          await logout();
          router.replace("/auth/login" as any);
        }
      },
    ]);
  };

  const row = (icon: React.ComponentProps<typeof Ionicons>["name"], label: string, value?: string) => (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      <View style={{
        width: 38, height: 38, borderRadius: 12, backgroundColor: C.bgMuted,
        alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon} size={18} color={C.textMd} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: C.textSm, marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "600", color: C.textDark }}>{value || "—"}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bgMuted }}>
      <StatusBar barStyle="dark-content" />

      <View style={{
        backgroundColor: C.surface, paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.border,
      }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.textDark }}>Профайл</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Avatar */}
        <View style={{
          backgroundColor: C.surface, borderRadius: 24, padding: 24,
          alignItems: "center", marginBottom: 16,
          borderWidth: 1, borderColor: C.border,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 24, backgroundColor: C.primary,
            alignItems: "center", justifyContent: "center", marginBottom: 12,
          }}>
            <Ionicons name="person" size={34} color={C.onPrimary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: C.textDark }}>
            {driver?.name || "Жолооч"}
          </Text>
          <Text style={{ fontSize: 13, color: C.textMd, marginTop: 4 }}>
            {driver?.phone}
          </Text>

          {/* Availability badge */}
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: driver?.isAvailable ? C.successBg : C.errorBg,
            paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 10,
          }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: driver?.isAvailable ? C.success : C.error,
            }} />
            <Text style={{
              fontSize: 13, fontWeight: "600",
              color: driver?.isAvailable ? C.success : C.error,
            }}>
              {driver?.isAvailable ? "Боломжтой" : "Ажилласан"}
            </Text>
          </View>
        </View>

        {/* Мэдээлэл */}
        <View style={{
          backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 18,
          marginBottom: 16, borderWidth: 1, borderColor: C.border,
        }}>
          {row("call-outline", "Утасны дугаар", driver?.phone)}
          {row("car-outline", "Тээврийн хэрэгслийн төрөл", driver?.vehicleType)}
          {row("document-text-outline", "Улсын дугаар", driver?.vehiclePlate)}
        </View>

        {/* Гарах */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
            backgroundColor: C.errorBg, borderRadius: 20, paddingVertical: 16,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={{ color: C.error, fontSize: 15, fontWeight: "700" }}>
            Гарах
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
