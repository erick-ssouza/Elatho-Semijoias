import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (stored === "dark" || (!stored && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggle = () => {
    const newValue = !isDark;
    setIsDark(newValue);
    
    if (newValue) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className={`text-foreground/80 hover:text-foreground transition-colors duration-300 ${className || ""}`}
      aria-label={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 stroke-[1.5]" />
      ) : (
        <Moon className="h-5 w-5 stroke-[1.5]" />
      )}
    </button>
  );
}
