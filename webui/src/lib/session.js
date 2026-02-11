export function getToken() {
  return localStorage.getItem("token") || "";
}

export function getRole() {
  return localStorage.getItem("role") || "";
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function saveSession({ token, role, email }) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role || "");
  localStorage.setItem("email", email || "");
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
}
