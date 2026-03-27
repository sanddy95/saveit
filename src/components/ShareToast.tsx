"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Check, AlertCircle, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ShareToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "queued" | "error">("success");

  useEffect(() => {
    const shared = searchParams.get("shared");
    if (!shared) return;

    if (shared === "true") {
      setMessage("Link saved!");
      setVariant("success");
    } else if (shared === "queued") {
      setMessage("Link queued — will save when online");
      setVariant("queued");
    } else if (shared === "error") {
      const reason = searchParams.get("reason") || "unknown";
      setMessage(reason === "no-url" ? "No URL found in shared content" : "Failed to save link");
      setVariant("error");
    }

    setVisible(true);

    // Remove query params from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("shared");
    url.searchParams.delete("reason");
    router.replace(url.pathname, { scroll: false });

    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  if (!visible) return null;

  const icons = {
    success: <Check className="h-4 w-4" />,
    queued: <Wifi className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
  };

  const colors = {
    success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    queued: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
      <div className={cn("flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg", colors[variant])}>
        {icons[variant]}
        <span className="text-sm font-medium">{message}</span>
        {variant === "success" && (
          <button
            className="ml-2 text-xs font-semibold underline hover:no-underline"
            onClick={() => {
              setVisible(false);
              router.push("/todos");
            }}
          >
            Edit
          </button>
        )}
        <button
          className="ml-2 opacity-60 hover:opacity-100"
          onClick={() => setVisible(false)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
