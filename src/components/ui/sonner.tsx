"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card-elevated group-[.toaster]:text-text-primary group-[.toaster]:border-border-subtle shadow-2xl rounded-xl border p-4",
          description: "group-[.toast]:text-text-secondary",
          actionButton:
            "group-[.toast]:bg-brand-500 group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-card-base group-[.toast]:text-text-secondary border border-border-subtle",
          title: "text-sm font-semibold text-white",
          icon: "group-[.toast]:text-brand-400"
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
