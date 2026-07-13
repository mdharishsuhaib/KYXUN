const fs = require('fs');

let content = fs.readFileSync('src/lib/auth.ts', 'utf8');

// Replace the updateProfile function
const newUpdateProfile = \export async function updateProfile(
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
        console.error("DB Error:", dbError);
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
        console.error("Auth Error:", authError);
        throw new Error(authError.message || JSON.stringify(authError));
      }
    }

    saveSession({
      email: user.email || "",
      fullName: updates.fullName || user.user_metadata?.full_name || user.user_metadata?.name || user.email || "",
      photo: updates.photo || user.user_metadata?.avatar_url || "",
      id: user.id,
    });

    return true;
  } catch (err: any) {
    console.error("Profile update failed:", err?.message || err);
    return false;
  }
}\;

content = content.replace(/export async function updateProfile\([\s\S]*?return false;\s*}\s*}/, newUpdateProfile);

fs.writeFileSync('src/lib/auth.ts', content);
