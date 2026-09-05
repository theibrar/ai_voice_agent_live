"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConversationFunnelsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/analytics");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-[#64748B] text-sm font-medium">
      Redirecting to Analytics...
    </div>
  );
}
