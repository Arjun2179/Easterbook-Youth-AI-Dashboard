import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface HighlightState {
  reliance: string | null;
  ageGroup: string | null;
}

interface HighlightCtx extends HighlightState {
  setReliance: (v: string | null) => void;
  setAgeGroup: (v: string | null) => void;
  clear: () => void;
}

const Ctx = createContext<HighlightCtx>({
  reliance: null,
  ageGroup: null,
  setReliance: () => {},
  setAgeGroup: () => {},
  clear: () => {},
});

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HighlightState>({ reliance: null, ageGroup: null });

  const setReliance = useCallback((v: string | null) => {
    setState((s) => ({ ...s, reliance: s.reliance === v ? null : v }));
  }, []);

  const setAgeGroup = useCallback((v: string | null) => {
    setState((s) => ({ ...s, ageGroup: s.ageGroup === v ? null : v }));
  }, []);

  const clear = useCallback(() => setState({ reliance: null, ageGroup: null }), []);

  return (
    <Ctx.Provider value={{ ...state, setReliance, setAgeGroup, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useHighlight() {
  return useContext(Ctx);
}
