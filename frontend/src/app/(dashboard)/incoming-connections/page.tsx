"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function IncomingConnectionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/phone-numbers");
  }, [router]);

  return null;
}
