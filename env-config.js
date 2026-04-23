const host = window.location.hostname;
const origin = window.location.origin;

const DEV_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "www.sola-home-dev.kr",
  "sola-home-dev.kr"
]);

const PROD_HOSTS = new Set([
  "www.sola-home.kr",
  "sola-home.kr"
]);

const isDevHost = DEV_HOSTS.has(host);
const isProdHost = PROD_HOSTS.has(host);

export const ENV = isDevHost ? "dev" : "prod";

export const APP_ORIGIN = {
  dev: host === "localhost" || host === "127.0.0.1"
    ? origin
    : "https://www.sola-home-dev.kr",
  prod: "https://www.sola-home.kr"
};

export const API_URL = {
  dev: {
    login: "https://loginwithid-l6mntiaxgq-du.a.run.app",
    signup: "https://signupwithid-l6mntiaxgq-du.a.run.app",
    checkLoginId: "https://checkloginid-l6mntiaxgq-du.a.run.app",
    checkNickname: "https://checknickname-l6mntiaxgq-du.a.run.app"
  },
  prod: {
    login: "https://loginwithid-PROD_URL_HERE.a.run.app",
    signup: "https://signupwithid-PROD_URL_HERE.a.run.app",
    checkLoginId: "https://checkloginid-PROD_URL_HERE.a.run.app",
    checkNickname: "https://checknickname-PROD_URL_HERE.a.run.app"
  }
};

export const ROUTE_URL = {
  dev: {
    login: "./index.html",
    signup: "./signup.html",
    app: "./app.html",
    phoneVerify: "./phone-verify.html"
  },
  prod: {
    login: "./index.html",
    signup: "./signup.html",
    app: "./app.html",
    phoneVerify: "./phone-verify.html"
  }
};

export const IS_DEV = ENV === "dev";
export const IS_PROD = ENV === "prod";

export const CURRENT_API = API_URL[ENV];
export const CURRENT_ROUTE = ROUTE_URL[ENV];
export const CURRENT_ORIGIN = APP_ORIGIN[ENV];

console.log("[env-config] loaded", {
  host,
  origin,
  env: ENV,
  isDevHost,
  isProdHost,
  api: CURRENT_API
});