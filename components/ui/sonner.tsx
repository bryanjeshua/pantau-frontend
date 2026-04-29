"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border text-foreground shadow-md rounded-xl text-sm",
          title: "font-semibold",
          description: "text-muted-foreground",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-muted text-muted-foreground",
          error: "border-red-200 bg-red-50 text-red-800",
          success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        },
      }}
      {...props}
    />
  );
}
