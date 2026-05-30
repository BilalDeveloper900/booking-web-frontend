/**
 * Profile avatar upload/remove against Supabase Storage.
 *
 * Files live in the `profile` bucket under a per-user folder
 * (`<userId>/avatar-<timestamp>.<ext>`) so a storage RLS policy can restrict
 * writes to the owner (see migration `*_profile_avatars.sql`). The bucket is
 * public, so we store the resulting public URL on `users.avatar_url`.
 */
"use client";

import { createClient } from "@/lib/supabase/client";

export const AVATAR_BUCKET = "profile";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Uploads `file` as the user's avatar, points `users.avatar_url` at the public
 * URL, and returns that URL. Throws on any storage or DB error.
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  // Timestamped name busts the CDN cache and avoids stale-image issues.
  const path = `${userId}/avatar-${Date.now()}.${ext || "jpg"}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || undefined,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrl })
    .eq("id", userId);
  if (updateError) throw updateError;

  return publicUrl;
}

/** Clears `users.avatar_url`. Stored files are left in place (orphaned). */
export async function removeAvatar(userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("users")
    .update({ avatar_url: null })
    .eq("id", userId);
  if (error) throw error;
}
