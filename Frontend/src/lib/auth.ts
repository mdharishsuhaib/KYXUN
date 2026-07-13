import { supabase } from "./supabase";

export interface Session {
  email: string;
  fullName: string;
  photo?: string;
  id?: string;
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
  supabase.auth.signOut();
}

function getAvatarUrl(userMetadata?: Record<string, any>): string {
  const avatarUrl = userMetadata?.avatar_url;
  const pictureUrl = userMetadata?.picture;
  if (typeof avatarUrl === "string" && avatarUrl.trim()) return avatarUrl.trim();
  if (typeof pictureUrl === "string" && pictureUrl.trim()) return pictureUrl.trim();
  return "";
}

function userToSession(user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}): Session {
  return {
    email: user.email!,
    fullName:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "",
    photo: getAvatarUrl(user.user_metadata),
    id: user.id,
  };
}

export async function registerUser(
  email: string,
  fullName: string,
  password: string
): Promise<{ ok: boolean; session?: Session; needsEmailConfirmation?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (data.user) {
      if (!data.session) {
        return { ok: true, needsEmailConfirmation: true };
      }

      try {
        await supabase.from("users").insert({
          id: data.user.id,
          email: email.toLowerCase(),
          full_name: fullName,
        });
      } catch (e) {
        console.warn("Public users table entry creation skipped or handled by trigger", e);
      }

      return { ok: true, session: userToSession(data.user) };
    }

    return { ok: false, error: "Registration failed." };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "An unexpected error occurred." };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ ok: boolean; session?: Session; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    if (data.user) {
      return { ok: true, session: userToSession(data.user) };
    }

    return { ok: false, error: "Incorrect credentials." };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "An unexpected error occurred." };
  }
}

export async function signInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to trigger Google Sign-In" };
  }
}

export async function updateProfile(
  email: string,
  updates: Partial<{ fullName: string; photo: string }>
): Promise<boolean> {
  void email;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const dbUpdate: Record<string, any> = {};
    if (updates.fullName !== undefined) dbUpdate.full_name = updates.fullName;
    if (updates.photo !== undefined) dbUpdate.photo = updates.photo;

    if (Object.keys(dbUpdate).length > 0) {
      const { error: dbError } = await supabase
        .from("users")
        .update(dbUpdate)
        .eq("id", user.id);
        
      if (dbError) {
        throw new Error(dbError.message || JSON.stringify(dbError));
      }
    }

    const authUpdate: Record<string, any> = {};
    if (updates.fullName !== undefined) authUpdate.full_name = updates.fullName;
    if (updates.photo !== undefined) authUpdate.avatar_url = updates.photo;

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: authUpdate,
      });

      if (authError) {
        throw new Error(authError.message || JSON.stringify(authError));
      }
    }

    saveSession({
      email: user.email || "",
      fullName: updates.fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
      photo: updates.photo || getAvatarUrl(user.user_metadata),
      id: user.id,
    });

    return true;
  } catch (err: any) {
    console.error("Profile update failed:", err?.message || err);
    return false;
  }
}

export async function getProfile(email: string): Promise<{ email: string; fullName: string; photo: string } | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error || !data) return null;
    return {
      email: data.email,
      fullName: data.full_name,
      photo: data.photo,
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
    const { error } = await supabase.auth.updateUser({
      password: newPass,
      current_password: oldPass,
      ...(nonce ? { nonce } : {}),
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to update password." };
  }
}

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to send reset email." };
  }
}

export async function resetPassword(newPass: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to reset password." };
  }
}

export async function requestReauthentication(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.reauthenticate();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to send verification code." };
  }
}

export async function updateEmailAddress(newEmail: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail.toLowerCase() },
      { emailRedirectTo: `${window.location.origin}/auth/callback` }
    );
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: (err as Error).message || "Failed to start email change." };
  }
}

export async function deleteAccount(email: string): Promise<boolean> {
  void email;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  try {
    const { error } = await supabase.from("users").delete().eq("id", user.id);
    if (error) throw error;

    clearSession();
    return true;
  } catch (err) {
    console.error("Account deletion failed:", err);
    return false;
  }
}
