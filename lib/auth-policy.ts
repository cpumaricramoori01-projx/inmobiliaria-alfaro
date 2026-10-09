// Preserve the temporary login pause unless explicitly enabled in deployment configuration.
export const LOGIN_MFA_REQUIRED = process.env.AUTH_LOGIN_MFA_REQUIRED === "1";
