import { api } from "./apiClient";

export interface Session {
  email: string;
  fullName: string;
  photo?: string;
  id?: string;
  accessToken?: string;
  refreshToken?: string;
}

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("kyxun_session");
    if (!raw) return null;
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kyxun_session", JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("kyxun_session");
}

export async function registerUser(
  email: string,
  fullName: string,
  password: string
): Promise<{ ok: boolean; session?: Session; needsEmailConfirmation?: boolean; error?: string }> {
  try {
    const names = fullName.split(" ");
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || " ";

    const response = await api.post<any>("/auth/register", {
      email,
      firstName,
      lastName,
      password,
    });

    const newSession: Session = {
      email: response.email,
      fullName: `${response.firstName} ${response.lastName}`.trim(),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
    saveSession(newSession);

    return { ok: true, session: newSession };
  } catch (err: any) {
    return { ok: false, error: err.message || "An unexpected error occurred." };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  try {
    const response = await api.post<any>("/auth/login", {
      email,
      password,
    });

    const newSession: Session = {
      email: response.email,
      fullName: `${response.firstName} ${response.lastName}`.trim(),
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };
    saveSession(newSession);

    return { ok: true, session: newSession };
  } catch (err: any) {
    return { ok: false, error: err.message || "Incorrect credentials." };
  }
}

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "Google Sign-In is not currently supported by the backend." };
}

export async function updateProfile(
  email: string,
  updates: Partial<{ fullName: string; photo: string }>
): Promise<boolean> {
  try {
    const names = updates.fullName ? updates.fullName.split(" ") : undefined;
    const body: any = {};
    if (names) {
      body.firstName = names[0];
      body.lastName = names.slice(1).join(" ") || " ";
    }
    if (updates.photo) {
      body.profilePictureUrl = updates.photo;
    }

    const response = await api.put<any>("/users/me", body);

    const session = getSession();
    if (session) {
      saveSession({
        ...session,
        fullName: `${response.firstName} ${response.lastName}`.trim(),
        photo: response.profilePictureUrl || session.photo,
      });
    }

    return true;
  } catch (err) {
    console.error("Profile update failed:", err);
    return false;
  }
}

export async function getProfile(email: string): Promise<{ email: string; fullName: string; photo: string } | null> {
  try {
    const response = await api.get<any>("/users/me");
    return {
      email: response.email,
      fullName: `${response.firstName} ${response.lastName}`.trim(),
      photo: response.profilePictureUrl || "",
    };
  } catch {
    return null;
  }
}

export async function updatePassword(
  _email: string,
  oldPass: string,
  newPass: string,
  nonce?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.patch("/users/me/password", {
      oldPassword: oldPass,
      newPassword: newPass,
    });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update password." };
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.post("/auth/forgot-password", { email });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to send reset email." };
  }
}

export async function resetPassword(newPass: string, token?: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!token) throw new Error("Missing reset token");
    await api.post("/auth/reset-password", { token, newPassword: newPass });
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to reset password." };
  }
}

export async function requestReauthentication(): Promise<{ ok: boolean; error?: string }> {
  return { ok: true }; // Stub
}

export async function updateEmailAddress(newEmail: string): Promise<{ ok: boolean; error?: string }> {
  return { ok: false, error: "Email updates not yet supported by backend." };
}

export async function deleteAccount(email: string): Promise<boolean> {
  try {
    await api.delete("/users/me");
    clearSession();
    return true;
  } catch {
    return false;
  }
}
