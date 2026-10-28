import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { READ_TIMEOUT_MS } from '../api';

const SiteContext = createContext(null);

/* Render cold-starts routinely take 10-20s on the free tier, and a single slow
   or failed request must not strand the whole site on hard-coded fallbacks.
   Retry with backoff before giving up. An empty object keeps the UI renderable
   so the layout never hangs. */
const RETRY_DELAYS_MS = [1500, 3000, 6000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function SiteProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const mounted = useRef(true);
  const settingsRef = useRef(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  /* One attempt. Resolves to the settings payload, or null when the request
     fails. Never throws, so callers can treat a null return as "keep going". */
  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await api.get('/settings/public', { timeout: READ_TIMEOUT_MS });
      return data ?? null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load site settings:', e?.message);
      return null;
    }
  }, []);

  /* Public: force a single reload (used after an admin save). The latest
     settings are read from a ref rather than the state value, so this
     callback keeps a stable identity and the context object only changes
     when settings or loading actually change. */
  const refresh = useCallback(async () => {
    const data = await fetchSettings();
    if (!mounted.current) return null;
    if (data) {
      setSettings(data);
      setFailed(false);
    } else if (!settingsRef.current) {
      setSettings({});
    }
    return data;
  }, [fetchSettings]);

  /* Initial load with backoff. */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
        if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
        if (cancelled) return;

        const data = await fetchSettings();
        if (cancelled) return;

        if (data) {
          setSettings(data);
          setLoading(false);
          return;
        }
      }

      // Every attempt failed — stay renderable, and say so. `failed` is what
      // lets the hero hold a skeleton instead of falling back to copy that may
      // no longer match what the CMS publishes.
      setSettings({});
      setFailed(true);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchSettings]);

  const value = useMemo(
    () => ({ settings, loading, failed, refresh }),
    [settings, loading, failed, refresh]
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
