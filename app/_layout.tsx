import { useDriverStore } from "@/store/useDriverStore";
import { authService } from "@/services/auth.service";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useEffect } from "react";
import { ActivityIndicator, Platform, View } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const initialize = useDriverStore((s) => s.initialize);
  const initialized = useDriverStore((s) => s.initialized);
  const token = useDriverStore((s) => s.token);

  useEffect(() => {
    initialize();
  }, []);

  // Expo Push Token бүртгэх (broadcast-д ашиглана)
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        // Android notification channel
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Захиалга",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
          });
        }

        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") return;

        // projectId — Expo Go болон standalone build аль алинд ажиллана
        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;

        const tokenData = projectId
          ? await Notifications.getExpoPushTokenAsync({ projectId })
          : await Notifications.getExpoPushTokenAsync();

        const pushToken = tokenData.data;
        if (pushToken) {
          console.log("[push] Expo token:", pushToken.slice(0, 40));
          await authService.registerFcmToken(pushToken);
        }
      } catch (e: any) {
        console.warn("[push] token registration failed:", e?.message);
      }
    })();
  }, [token]);

  // Шинэ захиалгын push notification дарахад orders tab руу
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as any;
      if (data?.type === "NEW_BOOKING") {
        router.push("/(tabs)" as any);
      }
    });
    return () => sub.remove();
  }, []);

  if (!initialized) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
