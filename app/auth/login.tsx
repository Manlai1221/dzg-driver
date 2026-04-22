import { C } from "@/constants/theme";
import { useDriverStore } from "@/store/useDriverStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  StatusBar, Text, TextInput, TouchableOpacity, View,
} from "react-native";

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login, loading } = useDriverStore();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert("Анхаар", "Бүх талбарыг бөглөнө үү");
      return;
    }
    try {
      await login(phone, password);
      router.replace("/(tabs)" as any);
    } catch (err: any) {
      Alert.alert("Нэвтрэх амжилтгүй", err.message);
    }
  };

  const field = (
    icon: React.ComponentProps<typeof Ionicons>["name"],
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    key: string,
    opts?: { secure?: boolean; keyboard?: any }
  ) => (
    <View style={{
      flexDirection: "row", alignItems: "center",
      backgroundColor: C.bgMuted, borderRadius: 16,
      paddingHorizontal: 16, paddingVertical: 4,
      borderWidth: 2, borderColor: focused === key ? C.primary : "transparent",
      marginBottom: 16, gap: 12,
    }}>
      <Ionicons name={icon} size={20} color={focused === key ? C.primary : C.textSm} />
      <TextInput
        style={{ flex: 1, fontSize: 15, color: C.textDark, paddingVertical: 14 }}
        placeholder={placeholder} placeholderTextColor={C.textSm}
        value={value} onChangeText={onChange}
        secureTextEntry={opts?.secure && !showPass}
        keyboardType={opts?.keyboard} autoCapitalize="none"
        onFocus={() => setFocused(key)} onBlur={() => setFocused(null)}
      />
      {opts?.secure && (
        <TouchableOpacity onPress={() => setShowPass(s => !s)}>
          <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={20} color={C.textSm} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.surface }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" />
      <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: "center" }}>

        {/* Logo */}
        <View style={{ alignItems: "center", marginBottom: 48 }}>
          <View style={{
            width: 84, height: 84, borderRadius: 28,
            backgroundColor: C.primary, alignItems: "center", justifyContent: "center",
            marginBottom: 20,
          }}>
            <Ionicons name="bicycle" size={40} color={C.onPrimary} />
          </View>
          <Text style={{ fontSize: 26, fontWeight: "800", color: C.textDark }}>
            Жолоочийн апп
          </Text>
          <Text style={{ fontSize: 14, color: C.textMd, marginTop: 6 }}>
            Бүртгэлтэй дансаараа нэвтэрнэ үү
          </Text>
        </View>

        {field("call-outline", "Утасны дугаар", phone, setPhone, "phone", { keyboard: "phone-pad" })}
        {field("lock-closed-outline", "Нууц үг", password, setPassword, "pass", { secure: true })}

        <TouchableOpacity
          onPress={handleLogin} disabled={loading}
          style={{
            backgroundColor: loading ? C.primaryDisabled : C.primary,
            borderRadius: 20, paddingVertical: 18, alignItems: "center",
            marginTop: 8, elevation: 8,
          }}
        >
          {loading
            ? <ActivityIndicator color={C.onPrimary} />
            : <Text style={{ color: C.onPrimary, fontSize: 16, fontWeight: "700" }}>Нэвтрэх</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
