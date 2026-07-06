import { C } from "@/constants/theme";
import { bookingService } from "@/services/booking.service";
import { useDriverStore } from "@/store/useDriverStore";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { driver, logout } = useDriverStore();
  const [stats, setStats] = useState({ delivered: 0, delivering: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      bookingService
        .stats()
        .then((s) => {
          if (active)
            setStats({ delivered: s.delivered ?? 0, delivering: s.delivering ?? 0 });
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const handleLogout = () => {
    Alert.alert("Гарах", "Апп-аас гарах уу?", [
      { text: "Болих", style: "cancel" },
      {
        text: "Гарах",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login" as any);
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
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.textDark }}>Профайл</Text>
      </View>

      <View style={{ padding: 16, gap: 16 }}>
        {/* Жолоочийн мэдээлэл */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 24,
            padding: 24,
            alignItems: "center",
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <View
            style={{
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: C.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="person" size={36} color={C.onPrimary} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "800", color: C.textDark }}>
            {driver?.name || "Жолооч"}
          </Text>
          <Text style={{ fontSize: 14, color: C.textMd, marginTop: 4 }}>{driver?.phone}</Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: driver?.isAvailable ? C.successBg : C.errorBg,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              marginTop: 12,
            }}
          >
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: driver?.isAvailable ? C.success : C.error,
              }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: driver?.isAvailable ? C.success : C.error,
              }}
            >
              {driver?.isAvailable ? "Боломжтой" : "Хүргэлт дээр"}
            </Text>
          </View>
        </View>

        {/* Статистик */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <StatCard
            icon="checkmark-done"
            color={C.success}
            bg={C.successBg}
            value={stats.delivered}
            label="Нийт хүргэсэн"
          />
          <StatCard
            icon="bicycle"
            color={C.delivery}
            bg={C.deliveryBg}
            value={stats.delivering}
            label="Хүргэж байгаа"
          />
        </View>

        {/* Гарах */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: C.errorBg,
            borderRadius: 20,
            paddingVertical: 16,
            borderWidth: 1,
            borderColor: C.error + "20",
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={C.error} />
          <Text style={{ color: C.error, fontSize: 15, fontWeight: "700" }}>Гарах</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  color,
  bg,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  bg: string;
  value: number;
  label: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: C.border,
        gap: 10,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 28, fontWeight: "800", color: C.textDark }}>{value}</Text>
      <Text style={{ fontSize: 13, color: C.textMd }}>{label}</Text>
    </View>
  );
}
