import { useContext } from 'react';
import { ToolCollapseContext } from '../contexts/ToolCollapseContextDef';

export function useToolCollapse() {
  return useContext(ToolCollapseContext);
}
