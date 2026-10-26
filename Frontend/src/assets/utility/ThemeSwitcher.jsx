import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  Palette,
  RotateCcw,
  X,
} from "lucide-react";

import { useTheme } from "../../context/ThemeContext";

const themeIcons = {
  purpleTeal: "🟣",
  whiteBlack: "⚫",
  joyRose: "🌹",
  emerald: "🟢",
  orangeGold: "🟠",
  pinkPurple: "💗",
  cyanBlue: "🩵",
  violetBlue: "🔷",
  limeDark: "🟢",
};

const ThemeSwitcher = () => {
  const {
    themeName,
    themes,
    changeTheme,
    resetTheme,
  } = useTheme();

  const [open, setOpen] = useState(false);

  const wrapperRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  const themeList = Object.values(themes || {});

  const currentTheme =
    themes?.[themeName] ||
    themes?.purpleTeal ||
    null;

  const handleThemeChange = (id) => {
    changeTheme(id);
  };

  const handleReset = () => {
    resetTheme();
  };

  if (!currentTheme) {
    return null;
  }

  return (
    <div
      ref={wrapperRef}
      className="relative z-[999999]"
    >
      {/* =====================================================
          THEME BUTTON
      ===================================================== */}
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Change color theme"
        aria-expanded={open}
        className="
          relative
          flex
          h-10
          min-w-10
          items-center
          justify-center
          gap-2
          rounded-2xl
          border
          px-2.5
          transition-all
          duration-200
          active:scale-[0.96]

          sm:h-11
          sm:min-w-11
          sm:px-3
        "
        style={{
          backgroundColor: "var(--theme-surface)",
          borderColor: "var(--theme-border)",
          color: "var(--theme-primary)",

          boxShadow: open
            ? `
              inset 5px 5px 10px var(--theme-shadowDark),
              inset -5px -5px 10px var(--theme-shadowLight)
            `
            : `
              5px 5px 10px var(--theme-shadowDark),
              -5px -5px 10px var(--theme-shadowLight)
            `,
        }}
      >
        <Palette
          size={18}
          strokeWidth={2}
        />

        <span
          className="
            hidden
            lg:block
            text-[11px]
            font-bold
            uppercase
            tracking-[0.12em]
          "
          style={{
            color: "var(--theme-text)",
          }}
        >
          Theme
        </span>

        {/* Active indicator */}
        <span
          className="
            absolute
            right-1.75
            top-1.5
            h-1.5
            w-1.5
            rounded-full
          "
          style={{
            backgroundColor:
              "var(--theme-secondary)",
            boxShadow:
              "0 0 7px var(--theme-glowSecondary)",
          }}
        />
      </button>

      {/* =====================================================
          THEME PANEL
      ===================================================== */}
      {open && (
        <div
          className="
            fixed
            left-1/2
            top-[70px]
            z-[999999]
            w-[calc(100vw-20px)]
            max-w-[330px]
            -translate-x-1/2
            overflow-hidden
            rounded-3xl
            border
            p-4

            sm:absolute
            sm:left-auto
            sm:right-0
            sm:top-[calc(100%+12px)]
            sm:w-[330px]
            sm:max-w-[calc(100vw-24px)]
            sm:translate-x-0
          "
          style={{
            backgroundColor:
              "var(--theme-surface)",

            borderColor:
              "var(--theme-border)",

            boxShadow: `
              14px 14px 28px var(--theme-shadowDark),
              -10px -10px 24px var(--theme-shadowLight)
            `,
          }}
        >
          {/* =================================================
              PANEL HEADER
          ================================================= */}
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h3
                className="
                  text-sm
                  font-black
                  tracking-wide
                "
                style={{
                  color: "var(--theme-text)",
                }}
              >
                Appearance
              </h3>

              <p
                className="
                  mt-0.5
                  text-[10px]
                "
                style={{
                  color:
                    "var(--theme-textMuted)",
                }}
              >
                Choose your favorite theme
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close theme selector"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-xl
                border
                transition-all
                duration-200
                active:scale-90
              "
              style={{
                backgroundColor:
                  "var(--theme-surface)",
                borderColor:
                  "var(--theme-border)",
                color:
                  "var(--theme-textMuted)",
                boxShadow: `
                  4px 4px 8px var(--theme-shadowDark),
                  -4px -4px 8px var(--theme-shadowLight)
                `,
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* =================================================
              CURRENT THEME
          ================================================= */}
          <div
            className="
              mb-4
              rounded-2xl
              border
              p-3
            "
            style={{
              backgroundColor:
                "var(--theme-surface)",
              borderColor:
                "var(--theme-border)",

              boxShadow: `
                inset 4px 4px 8px var(--theme-shadowDark),
                inset -4px -4px 8px var(--theme-shadowLight)
              `,
            }}
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  text-lg
                "
                style={{
                  backgroundColor:
                    currentTheme.colors?.primary ||
                    "var(--theme-primary)",

                  boxShadow: `
                    3px 3px 7px var(--theme-shadowDark),
                    -3px -3px 7px var(--theme-shadowLight)
                  `,
                }}
              >
                {themeIcons[currentTheme.id] || "🎨"}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    truncate
                    text-xs
                    font-bold
                  "
                  style={{
                    color:
                      "var(--theme-text)",
                  }}
                >
                  {currentTheme.name ||
                    themeName}
                </p>

                <p
                  className="
                    mt-0.5
                    text-[9px]
                  "
                  style={{
                    color:
                      "var(--theme-textMuted)",
                  }}
                >
                  Currently selected
                </p>
              </div>

              <Check
                size={17}
                strokeWidth={3}
                style={{
                  color:
                    "var(--theme-secondary)",
                }}
              />
            </div>
          </div>

          {/* =================================================
              THEME OPTIONS
          ================================================= */}
          <div
            className="
              mb-4
              grid
              grid-cols-3
              gap-2.5
            "
          >
            {themeList.map((theme) => {
              const isActive =
                theme.id === themeName;

              const themeColors =
                theme.colors || {};

              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() =>
                    handleThemeChange(theme.id)
                  }
                  aria-label={`Select ${
                    theme.name || theme.id
                  } theme`}
                  className="
                    group
                    relative
                    flex
                    min-w-0
                    flex-col
                    items-center
                    gap-1.5
                    rounded-2xl
                    border
                    p-2
                    transition-all
                    duration-200
                    active:scale-95
                  "
                  style={{
                    backgroundColor:
                      "var(--theme-surface)",

                    borderColor:
                      isActive
                        ? "var(--theme-primary)"
                        : "var(--theme-border)",

                    boxShadow: isActive
                      ? `
                        inset 4px 4px 8px var(--theme-shadowDark),
                        inset -4px -4px 8px var(--theme-shadowLight)
                      `
                      : `
                        4px 4px 8px var(--theme-shadowDark),
                        -4px -4px 8px var(--theme-shadowLight)
                      `,
                  }}
                >
                  {/* Color preview */}
                  <div
                    className="
                      relative
                      flex
                      h-10
                      w-full
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-xl
                    "
                    style={{
                      background:
                        `linear-gradient(135deg, ${
                          themeColors.primary ||
                          "#8c7cf7"
                        }, ${
                          themeColors.secondary ||
                          "#2bd4c4"
                        })`,
                    }}
                  >
                    <span className="text-base">
                      {themeIcons[theme.id] ||
                        "🎨"}
                    </span>

                    {isActive && (
                      <span
                        className="
                          absolute
                          right-1
                          top-1
                          flex
                          h-4
                          w-4
                          items-center
                          justify-center
                          rounded-full
                        "
                        style={{
                          backgroundColor:
                            "var(--theme-surface)",
                          color:
                            "var(--theme-primary)",
                        }}
                      >
                        <Check size={10} />
                      </span>
                    )}
                  </div>

                  <span
                    className="
                      w-full
                      truncate
                      text-center
                      text-[9px]
                      font-bold
                    "
                    style={{
                      color:
                        isActive
                          ? "var(--theme-primary)"
                          : "var(--theme-text)",
                    }}
                  >
                    {theme.name || theme.id}
                  </span>
                </button>
              );
            })}
          </div>

          {/* =================================================
              RESET BUTTON
          ================================================= */}
          <button
            type="button"
            onClick={handleReset}
            className="
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-2xl
              border
              px-3
              py-2.5
              text-[10px]
              font-bold
              uppercase
              tracking-wider
              transition-all
              duration-200
              active:scale-[0.98]
            "
            style={{
              backgroundColor:
                "var(--theme-surface)",
              borderColor:
                "var(--theme-border)",
              color:
                "var(--theme-textMuted)",

              boxShadow: `
                4px 4px 8px var(--theme-shadowDark),
                -4px -4px 8px var(--theme-shadowLight)
              `,
            }}
          >
            <RotateCcw size={14} />

            Reset Theme
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;