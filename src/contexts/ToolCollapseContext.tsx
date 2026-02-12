import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToolCollapseState = 'none' | 'collapse-all' | 'expand-all';

interface ToolCollapseContextValue {
  /** Global override: 'none' means each tool manages its own state */
  globalState: ToolCollapseState;
  /** Monotonically increasing version — tool calls reset local state when this changes */
  version: number;
  collapseAll: () => void;
  expandAll: () => void;
}

const ToolCollapseContext = createContext<ToolCollapseContextValue>({
  globalState: 'none',
  version: 0,
  collapseAll: () => {},
  expandAll: () => {},
});

export function ToolCollapseProvider({ children }: { children: ReactNode }) {
  const [globalState, setGlobalState] = useState<ToolCollapseState>('none');
  const [version, setVersion] = useState(0);

  const collapseAll = useCallback(() => {
    setGlobalState('collapse-all');
    setVersion(v => v + 1);
  }, []);

  const expandAll = useCallback(() => {
    setGlobalState('expand-all');
    setVersion(v => v + 1);
  }, []);

  return (
    <ToolCollapseContext.Provider value={{ globalState, version, collapseAll, expandAll }}>
      {children}
    </ToolCollapseContext.Provider>
  );
}

export function useToolCollapse() {
  return useContext(ToolCollapseContext);
}
