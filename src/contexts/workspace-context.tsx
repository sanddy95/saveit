"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface WorkspaceContextValue {
  currentWorkspaceId: string | null;
  setCurrentWorkspace: (id: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  currentWorkspaceId: null,
  setCurrentWorkspace: () => {},
});

const STORAGE_KEY = "saveit-current-workspace";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setCurrentWorkspaceId(stored);
    }
  }, []);

  const setCurrentWorkspace = useCallback((id: string) => {
    setCurrentWorkspaceId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{ currentWorkspaceId, setCurrentWorkspace }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspaceContext() {
  return useContext(WorkspaceContext);
}
