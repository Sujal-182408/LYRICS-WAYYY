// src/context/ThemeContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  themes,
  DEFAULT_THEME,
  isValidTheme,
} from "../config/themes";

const ThemeContext = createContext(null);

const STORAGE_KEY = "lyricswayyy-theme";

// =====================================================
// THEME PROVIDER
// =====================================================

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY);

      return savedTheme && isValidTheme(savedTheme)
        ? savedTheme
        : DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  });

  const theme = themes[themeName] || themes[DEFAULT_THEME];
  const colors = theme.colors;

  // ===================================================
  // APPLY THEME VARIABLES
  // ===================================================

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // ---------------------------------------------------
    // BACKGROUND AND SURFACES
    // ---------------------------------------------------

    root.style.setProperty("--theme-background", colors.background);
    root.style.setProperty("--theme-surface", colors.surface);
    root.style.setProperty("--theme-surface-light", colors.surfaceLight);

    // Backward compatibility
    root.style.setProperty("--theme-surfaceLight", colors.surfaceLight);

    // Neumorphic background aliases
    root.style.setProperty("--neu-bg", colors.background);
    root.style.setProperty("--neu-surface", colors.surface);
    root.style.setProperty("--neu-surface-light", colors.surfaceLight);

    // ---------------------------------------------------
    // TEXT COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-text", colors.text);
    root.style.setProperty("--theme-text-muted", colors.textMuted);
    root.style.setProperty("--theme-text-dark", colors.textDark);

    // Backward compatibility
    root.style.setProperty("--theme-textMuted", colors.textMuted);
    root.style.setProperty("--theme-textDark", colors.textDark);

    // Neumorphic text aliases
    root.style.setProperty("--neu-text", colors.text);
    root.style.setProperty("--neu-text-muted", colors.textMuted);

    // ---------------------------------------------------
    // SHADOW COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-shadow-dark", colors.shadowDark);
    root.style.setProperty("--theme-shadow-light", colors.shadowLight);

    // Backward compatibility
    root.style.setProperty("--theme-shadowDark", colors.shadowDark);
    root.style.setProperty("--theme-shadowLight", colors.shadowLight);

    // Neumorphic aliases
    root.style.setProperty("--neu-shadow-dark", colors.shadowDark);
    root.style.setProperty("--neu-shadow-light", colors.shadowLight);

    // ---------------------------------------------------
    // PRIMARY AND SECONDARY COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-primary", colors.primary);
    root.style.setProperty("--theme-secondary", colors.secondary);

    root.style.setProperty("--theme-hover", colors.hover);
    root.style.setProperty("--theme-active", colors.active);

    // Neumorphic accent aliases
    root.style.setProperty("--neu-accent-1", colors.primary);
    root.style.setProperty("--neu-accent-2", colors.secondary);

    // ---------------------------------------------------
    // BORDER COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-border", colors.border);
    root.style.setProperty("--glass-border", colors.border);

    // ---------------------------------------------------
    // GLOW COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-glow-primary", colors.glowPrimary);
    root.style.setProperty("--theme-glow-secondary", colors.glowSecondary);

    // Backward compatibility
    root.style.setProperty("--theme-glowPrimary", colors.glowPrimary);
    root.style.setProperty("--theme-glowSecondary", colors.glowSecondary);

// ---------------------------------------------------
// GRADIENT — BACKGROUND, TEXT, AND ACCENTS
// ---------------------------------------------------

root.style.setProperty("--theme-gradient", colors.gradient);

// Automatically update gradient text when the theme changes
root.style.setProperty(
  "--theme-text-gradient",
  colors.gradient
);


    // ---------------------------------------------------
    // STATUS COLORS
    // ---------------------------------------------------

    root.style.setProperty("--theme-success", colors.success);
    root.style.setProperty("--theme-danger", colors.danger);
    root.style.setProperty("--theme-warning", colors.warning);
    root.style.setProperty("--theme-info", colors.info);

    root.style.setProperty("--neu-danger", colors.danger);

    // ---------------------------------------------------
    // OVERLAY AND GLASS COMPATIBILITY
    // ---------------------------------------------------

    root.style.setProperty("--theme-overlay", colors.overlay);
    root.style.setProperty("--glass-bg", colors.surface);

    // ---------------------------------------------------
    // BODY COLORS
    // ---------------------------------------------------

    body.style.backgroundColor = colors.background;
    body.style.color = colors.text;

    // ---------------------------------------------------
    // DATA ATTRIBUTE
    // ---------------------------------------------------

    root.setAttribute("data-theme", themeName);

    // ---------------------------------------------------
    // SAVE SELECTED THEME
    // ---------------------------------------------------

    try {
      localStorage.setItem(STORAGE_KEY, themeName);
    } catch (error) {
      console.warn(
        "Unable to save the selected theme:",
        error
      );
    }
  }, [themeName, colors]);

  // ===================================================
  // CHANGE THEME
  // ===================================================

  const changeTheme = (newTheme) => {
    if (!isValidTheme(newTheme)) {
      console.warn(`Invalid theme selected: ${newTheme}`);
      return;
    }

    setThemeName(newTheme);
  };

  // ===================================================
  // RESET THEME
  // ===================================================

  const resetTheme = () => {
    setThemeName(DEFAULT_THEME);
  };

  // ===================================================
  // CONTEXT PROVIDER
  // ===================================================

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeName,
        themes,
        changeTheme,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

// =====================================================
// USE THEME HOOK
// =====================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
};

export default ThemeContext;
