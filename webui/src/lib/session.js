export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getRole() {
  return localStorage.getItem("role") || "";
}

export function isLoggedIn() {
  return Boolean(getToken());
}

function parseJwt(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch (_err) {
    return null;
  }
}

export function getUserProfile() {
  const raw = localStorage.getItem("userProfile");
  if (!raw) {
    const token = getToken();
    return token ? parseJwt(token) || {} : {};
  }
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return {};
  }
}

export function saveSession({ token, role, email, user }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role || "");
  localStorage.setItem("email", email || "");
  const profile = user || parseJwt(token) || {};
  localStorage.setItem("userProfile", JSON.stringify(profile));
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  localStorage.removeItem("userProfile");
}
