"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserNavProps {
  email: string;
}

export function UserNav({ email }: UserNavProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="border-t border-slate-200 p-4">
      <div className="mb-3">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">
          Signed in as
        </p>
        <p className="text-sm text-slate-900 font-medium truncate" title={email}>
          {email}
        </p>
      </div>
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50"
      >
        {isLoading ? "Signing out..." : "Sign out"}
      </button>
    </div>
  );
}
