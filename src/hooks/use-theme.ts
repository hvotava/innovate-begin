import { useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const root = window.document.documentElement
    const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    
    root.classList.remove("light", "dark")
    root.classList.add(isDark ? "dark" : "light")
  }, [theme])

  return {
    theme,
    setTheme,
  }
}