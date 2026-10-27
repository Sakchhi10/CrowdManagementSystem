import { useCallback, useEffect, useRef, useState } from 'react';

// Runs an async loader whenever `deps` change and tracks { data, loading, error }.
// Stale responses (from an older set of deps) are dropped.
export function useAsync(loader, deps, { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, loading: enabled, error: null });
  const callId = useRef(0);

  const run = useCallback(async () => {
    if (!enabled) return;
    const id = ++callId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await loader();
      if (id === callId.current) setState({ data, loading: false, error: null });
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, loading: false, error }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    run();
  }, [run]);

  return { ...state, reload: run };
}
