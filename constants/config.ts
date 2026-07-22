// Backend-ийн хаяг.
// __DEV__ (expo start / dev build) үед LAN IP-г, production build (TestFlight/Store)
// үед нийтэд нээлттэй HTTPS backend-ийг АВТОМАТААР сонгоно.
//
// ⚠️ PROD_API_URL заавал АМЬД, HTTPS, нийтэд нээлттэй байх ёстой. Одоогоор
// доорх Railway хаяг deploy хийгдээгүй (404 "Application not found") тул
// backend-ээ дахин deploy хийж, зөв URL-ийг энд тавьсны дараа build хийнэ.

// Dev: өөрийн компьютерийн LAN IP (утас+комп нэг WiFi). iOS Simulator бол localhost.
const DEV_API_URL = "http://192.168.1.22:4000";

// Prod: TestFlight/Store build энд заасан backend руу холбоно.
const PROD_API_URL = "https://dzg-service-production.up.railway.app";

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const APP_NAME = "DZG Driver";
