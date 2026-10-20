"use client";

import { useEffect } from "react";
import { salvarToken } from "@/lib/token-local";

export function SalvarToken({ token }: { token: string }) {
  useEffect(() => salvarToken(token), [token]);
  return null;
}
