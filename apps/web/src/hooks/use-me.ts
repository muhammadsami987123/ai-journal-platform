"use client";

import { useQuery } from "@tanstack/react-query";
import type { MeResponse } from "@journal/shared";
import { api } from "@/lib/api/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<MeResponse>("/api/v1/me"),
    staleTime: 60_000
  });
}
