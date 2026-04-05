export const ADMIN_SESSION_COOKIE = "pta_admin_session";

export function getAdminCredentials() {
  const user = process.env.ADMIN_LOGIN_USER ?? process.env.ADMIN_BASIC_USER ?? "";
  const pass = process.env.ADMIN_LOGIN_PASS ?? process.env.ADMIN_BASIC_PASS ?? "";

  return {
    user,
    pass
  };
}

export function isAdminAuthConfigured() {
  const credentials = getAdminCredentials();
  return Boolean(credentials.user && credentials.pass);
}

export function createAdminSessionValue() {
  const credentials = getAdminCredentials();
  return encodeURIComponent(`${credentials.user}:${credentials.pass}`);
}

export function isValidAdminSession(value?: string | null) {
  if (!value || !isAdminAuthConfigured()) {
    return false;
  }

  return value === createAdminSessionValue();
}
