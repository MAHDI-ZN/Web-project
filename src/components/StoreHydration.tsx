"use client";

import { useEffect } from "react";
import { useAppStore } from "@/stores/appStore";

export function StoreHydration() {
  const bootstrap = useAppStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}
