// ===============================
// 환경 자동 감지 (dev / prod)
// ===============================

const hostname = location.hostname;

const isDev =
  hostname.includes("dev") ||
  hostname.includes("localhost") ||
  hostname.startsWith("192.") ||
  hostname.startsWith("127.");

export const ENV = isDev ? "dev" : "prod";


// ===============================
// Firebase 설정
// ===============================

export const FIREBASE_CONFIG = {
  dev: {
    apiKey: "AIzaSyCC4ZilL1Gv_zy0_iw36b0CO4Uq7vYX6rE",
    authDomain: "sola-home-dev.firebaseapp.com",
    projectId: "sola-home-dev",
    storageBucket: "sola-home-dev.firebasestorage.app",
    messagingSenderId: "292137041544",
    appId: "1:292137041544:web:c648f4380b1562a31e693d",
    measurementId: "G-R7TZ1PG6QP"
  },

  prod: {
    apiKey: "AIzaSyDhKr7oMSrLowJ47cqB4pvNXuIIdtW0HPI",
    authDomain: "sola-home-4979a.firebaseapp.com",
    projectId: "sola-home-4979a",
    storageBucket: "sola-home-4979a.firebasestorage.app",
    messagingSenderId: "337132471819",
    appId: "1:337132471819:web:848cd357fecda459a2e90e"
  }
};


// ===============================
// Cloud Functions URL
// ===============================

export const API_URL = {
  dev: {
    login: "https://asia-northeast3-sola-home-dev.cloudfunctions.net/loginWithId",
    signup: "https://asia-northeast3-sola-home-dev.cloudfunctions.net/signupWithId",
    checkLoginId: "https://asia-northeast3-sola-home-dev.cloudfunctions.net/checkLoginId",
    checkNickname: "https://asia-northeast3-sola-home-dev.cloudfunctions.net/checkNickname"
  },
  prod: {
    login: "https://asia-northeast3-sola-home-4979a.cloudfunctions.net/loginWithId",
    signup: "https://asia-northeast3-sola-home-4979a.cloudfunctions.net/signupWithId",
    checkLoginId: "https://asia-northeast3-sola-home-4979a.cloudfunctions.net/checkLoginId",
    checkNickname: "https://asia-northeast3-sola-home-4979a.cloudfunctions.net/checkNickname"
  }
};