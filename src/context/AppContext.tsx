import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { User } from "@/types/domain";
import { temporaryCreditService } from "@/services/temporaryCreditService";
interface Value {
  users: User[];
  currentUser?: User;
  setCurrentUser: (user: User) => void;
  refreshKey: number;
  refresh: () => void;
}
const Context = createContext<Value | undefined>(undefined);
export function AppProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>();
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    void temporaryCreditService.getUsers().then((items) => {
      setUsers(items);
      setCurrentUser(
        (existing) => existing ?? items.find((u) => u.role === "SALES_MANAGER"),
      );
    });
  }, []);
  const value = useMemo(
    () => ({
      users,
      currentUser,
      setCurrentUser,
      refreshKey,
      refresh: () => setRefreshKey((v) => v + 1),
    }),
    [users, currentUser, refreshKey],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useApp() {
  const value = useContext(Context);
  if (!value) throw new Error("useApp must be used within AppProvider");
  return value;
}
