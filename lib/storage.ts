import AsyncStorage from "@react-native-async-storage/async-storage";

export const TOKEN_KEY = "driver_access_token";

export const storage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  remove: (key: string) => AsyncStorage.removeItem(key),
};
