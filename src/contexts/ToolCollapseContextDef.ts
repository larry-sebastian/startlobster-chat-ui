import { createContext } from 'react';

type ToolCollapseState = 'none' | 'collapse-all' | 'expand-all';

export interface ToolCollapseContextValue {
  /** Global override: 'none' means each tool manages its own state */
  globalState: ToolCollapseState;
  /** Monotonically increasing version — tool calls reset local state when this changes */
  version: number;
  collapseAll: () => void;
  expandAll: () => void;
}

export const ToolCollapseContext = createContext<ToolCollapseContextValue>({
  globalState: 'none',
  version: 0,
  collapseAll: () => {},
  expandAll: () => {},
});
