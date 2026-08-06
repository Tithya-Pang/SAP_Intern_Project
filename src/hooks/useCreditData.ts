import { useEffect, useState } from "react";
import type { Customer, TemporaryCreditRequest } from "@/types/domain";
import { temporaryCreditService } from "@/services/temporaryCreditService";
import { useApp } from "@/context/AppContext";
export function useCreditData() {
  const { currentUser, refreshKey } = useApp();
  const [requests, setRequests] = useState<TemporaryCreditRequest[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!currentUser) return;
    setLoading(true);
    setError("");
    void Promise.all([
      temporaryCreditService.getRequests({}, currentUser),
      temporaryCreditService.getCustomers(),
    ])
      .then(([r, c]) => {
        setRequests(r);
        setCustomers(c);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error ? reason.message : "Unable to load data.",
        ),
      )
      .finally(() => setLoading(false));
  }, [currentUser, refreshKey]);
  return { requests, customers, loading, error };
}
