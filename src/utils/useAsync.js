import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader whenever `deps` change and tracks { data, loading, error }.
// Stale responses (from an older set of deps) are dropped, and the loader's AbortSignal is
// aborted so calls still waiting in the analytics queue are never sent. While `enabled` is
// false nothing is requested and the state stays loading, so callers keep showing skeletons
// until inputs are ready.
export function useAsync(loader, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const callId = useRef(0);
  const controller = useRef(null);

  const run = useCallback(async () => {
    if (!enabled) return;
    const id = ++callId.current;
    controller.current?.abort();
    const ctl = new AbortController();
    controller.current = ctl;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader(ctl.signal);
      if (id === callId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === callId.current && !ctl.signal.aborted) setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
    return () => controller.current?.abort();
  }, [run]);

  return { ...state, reload: run };
}
