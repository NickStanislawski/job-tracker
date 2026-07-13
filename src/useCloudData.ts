import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { supabase } from "./supabase";
export type LoadStatus = "loading" | "ready";

/* ---------------------------------------------------------------------
   CLOUD PERSISTENCE HOOK — mirrors the old Firestore hook's shape
   ([data, setData, status]) but backs it with a single Postgres row per
   user: public.trackers (user_id uuid primary key, data jsonb). A
   Realtime subscription keeps every open device/tab in sync in near
   real time; writes are debounced so rapid edits (typing, etc.) don't
   spam the database. See supabase_schema.sql for the table + RLS setup.
--------------------------------------------------------------------- */
export function useCloudData<T extends object>(
  uid: string,
  makeSeed: () => T
): [T | null, Dispatch<SetStateAction<T | null>>, LoadStatus] {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distinguishes "this update came from Supabase" (skip re-saving it)
  // from "this update came from the user" (needs to be saved).
  const skipNextSave = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setData(null);
    skipNextSave.current = false;

    const load = async () => {
      const { data: row, error } = await supabase
        .from("trackers")
        .select("data")
        .eq("user_id", uid)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        // Network / permissions error — fall back to a local seed so the
        // UI doesn't hang. Edits won't sync until the connection recovers.
        setData(makeSeed());
        setStatus("ready");
        return;
      }

      if (row) {
        skipNextSave.current = true;
        setData(row.data as T);
      } else {
        const seed = makeSeed();
        await supabase
          .from("trackers")
          .insert({ user_id: uid, data: seed })
          .then(({ error: insertErr }) => {
            if (insertErr) {
              // will retry as an upsert on the next local save
            }
          });
        if (cancelled) return;
        skipNextSave.current = true;
        setData(seed);
      }
      setStatus("ready");
    };

    load();

    // Keep other open tabs/devices in sync.
    const channel = supabase
      .channel(`trackers-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trackers", filter: `user_id=eq.${uid}` },
        (payload) => {
          const newRow = payload.new as { data?: T } | undefined;
          if (!newRow?.data) return;
          skipNextSave.current = true;
          setData(newRow.data);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!data || status !== "ready") return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase
        .from("trackers")
        .upsert({ user_id: uid, data, updated_at: new Date().toISOString() })
        .then(({ error }) => {
          // offline / error — the client doesn't auto-retry; the next
          // local edit will attempt the save again.
        });
    }, 500);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, status, uid]);

  return [data, setData, status];
}