import { useState, useCallback, type ReactNode } from 'react';
import { ToolCollapseContext } from './ToolCollapseContextDef';

export { ToolCollapseContext } from './ToolCollapseContextDef';

export function ToolCollapseProvider({ children }: { children: ReactNode }) {
  const [globalState, setGlobalState] = useState<'none' | 'collapse-all' | 'expand-all'>('none');
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
