// Class persistence backed by Supabase (per-user via row-level security).

"use client";

import { supabase, ensureAuth } from "./supabase";

export interface ClassRecord {
  id: string;
  name: string;
  period: string | null;
  students: number | null;
  room: string | null;
  schedule: string | null;
}

const SELECT_COLS = "id,name,period,students,room,schedule";

export const getClasses = async (): Promise<ClassRecord[]> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("classes")
    .select(SELECT_COLS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ClassRecord[]) ?? [];
};

export const getClass = async (id: string): Promise<ClassRecord | null> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("classes")
    .select(SELECT_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as ClassRecord) ?? null;
};

export const createClass = async (
  input: Omit<ClassRecord, "id">
): Promise<ClassRecord> => {
  await ensureAuth();
  const { data, error } = await supabase
    .from("classes")
    .insert(input)
    .select(SELECT_COLS)
    .single();
  if (error) throw error;
  return data as ClassRecord;
};

export const deleteClass = async (id: string): Promise<void> => {
  await ensureAuth();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) throw error;
};

// A curated demo set so a fresh visitor never sees an empty app.
const DEMO_CLASSES: Omit<ClassRecord, "id">[] = [
  { name: "Cognitive Science", period: "Period 1", students: 28, room: "Lab 204", schedule: "Mon/Wed/Fri 9:00 AM" },
  { name: "AP Psychology", period: "Period 2", students: 24, room: "Room 312", schedule: "Tue/Thu 10:30 AM" },
  { name: "Neuroscience Lab", period: "Period 3", students: 16, room: "Lab 201", schedule: "Mon/Wed 1:00 PM" },
  { name: "Behavioral Economics", period: "Period 4", students: 22, room: "Room 405", schedule: "Tue/Thu 2:30 PM" },
  { name: "Memory & Learning", period: "Period 5", students: 19, room: "Room 308", schedule: "Mon/Wed/Fri 11:00 AM" },
  { name: "Advanced Psychology", period: "Period 6", students: 26, room: "Room 410", schedule: "Tue/Thu 4:00 PM" },
];

// Shared in-flight seed promise. Without this, two near-simultaneous callers
// (e.g. React StrictMode double-invoking the mount effect) both read "empty" and
// each insert the demo set, producing duplicate classes. Concurrent callers now
// share one promise; it's cleared once settled so resetToDemo can seed again.
let seedInFlight: Promise<ClassRecord[]> | null = null;

/** Seed the demo classes if this user has none yet. Returns the full list. */
export const seedDemoClassesIfEmpty = async (): Promise<ClassRecord[]> => {
  if (seedInFlight) return seedInFlight;
  seedInFlight = (async () => {
    const existing = await getClasses();
    if (existing.length > 0) return existing;
    const { data, error } = await supabase
      .from("classes")
      .insert(DEMO_CLASSES)
      .select(SELECT_COLS);
    if (error) throw error;
    return (data as ClassRecord[]) ?? [];
  })();
  try {
    return await seedInFlight;
  } finally {
    seedInFlight = null;
  }
};

/**
 * Wipe all of the current user's data and re-seed the demo classes — a one-click
 * "fresh start" for demos. Documents/results cascade-delete with their classes.
 */
export const resetToDemo = async (): Promise<ClassRecord[]> => {
  await ensureAuth();
  const { error } = await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) throw error;
  return seedDemoClassesIfEmpty();
};
