import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";

export type LoadStatus = "loading" | "ready";

/* ---------------------------------------------------------------------
   CLOUD PERSISTENCE HOOK — mirrors the old localStorage hook's shape
   ([data, setData, status]) but backs it with a single Firestore
   document per user: trackers/{uid}. onSnapshot keeps every open
   device/tab in sync in near real time; writes are debounced so rapid
   edits (typing, etc.) don't spam Firestore.
--------------------------------------------------------------------- */
export function useCloudData<T extends object>(
  uid: string,
  makeSeed: () => T
): [T | null, Dispatch<SetStateAction<T | null>>, LoadStatus] {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Distinguishes "this update came from Firestore" (skip re-saving it)
  // from "this update came from the user" (needs to be saved).
  const skipNextSave = useRef(false);

  useEffect(() => {
    setStatus("loading");
    setData(null);
    skipNextSave.current = false;

    const ref = doc(db, "trackers", uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          skipNextSave.current = true;
          setData(snap.data() as T);
        } else {
          const seed = makeSeed();
          setDoc(ref, seed as Record<string, unknown>).catch(() => { /* will retry on next local save */ });
          skipNextSave.current = true;
          setData(seed);
        }
        setStatus("ready");
      },
      () => {
        // Network / permissions error — fall back to a local seed so the
        // UI doesn't hang. Edits won't sync until the connection recovers.
        setData(makeSeed());
        setStatus("ready");
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  useEffect(() => {
    if (!data || status !== "ready") return;
    if (skipNextSave.current) { skipNextSave.current = false; return; }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const ref = doc(db, "trackers", uid);
      setDoc(ref, data as Record<string, unknown>).catch(() => { /* offline — Firestore will retry writes once back online */ });
    }, 500);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, status, uid]);

  return [data, setData, status];
}
