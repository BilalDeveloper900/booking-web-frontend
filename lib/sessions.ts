/**
 * Sessions — calendar slot creates.
 *
 * - `createGroupSession()` — insert a single group-class instance.
 *   The DB exclusion constraint on `sessions_no_overlap_per_admin` will reject
 *   overlapping bookings for the same admin; the trigger on `bookings` enforces
 *   capacity. RLS gates writes to owner or to the admin's own services.
 *
 * Solo-session inserts ride along with `bookings` inserts in the client
 * booking flow (Phase 2.F) — they need atomicity that's cleaner in an RPC.
 */
"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

export type SessionRow = Database["public"]["Tables"]["sessions"]["Row"];
export type SessionInsert = Database["public"]["Tables"]["sessions"]["Insert"];

export type CreateGroupSessionInput = {
  studioId: string;
  serviceId: string;
  adminMemberId: string;
  startsAt: Date;
  durationMin: number;
  capacity: number;
  notes?: string | null;
};

/**
 * Inserts a single group-class instance into `sessions`. Throws a
 * human-readable error on common failure modes (overlap, capacity, RLS).
 */
export async function createGroupSession(
  input: CreateGroupSessionInput
): Promise<SessionRow> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      studio_id: input.studioId,
      service_id: input.serviceId,
      admin_member_id: input.adminMemberId,
      starts_at: input.startsAt.toISOString(),
      duration_min: input.durationMin,
      capacity: input.capacity,
      status: "scheduled",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();

  if (error) throw new Error(humanizeSessionError(error.message));
  return data;
}

function humanizeSessionError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("sessions_no_overlap_per_admin")) {
    return "You already have a session at this time. Pick a different slot.";
  }
  if (lower.includes("violates check constraint") && lower.includes("capacity")) {
    return "Capacity must be at least 1.";
  }
  if (lower.includes("permission denied") || lower.includes("rls")) {
    return "You can only schedule classes for services you own.";
  }
  return message;
}
