import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const FALLBACK_ROUTE = "/home";

export default function FloatingBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const handleBack = () => {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
    } else {
      navigate(FALLBACK_ROUTE, { replace: true });
    }
  };

  // Hide on authentication and root pages.
  if (["/", "/signin", "/signup"].includes(location.pathname)) {
    return null;
  }

  return (
    <motion.button
      type="button"
      onClick={handleBack}
      aria-label="Go back to previous page"
      title="Go back"

      // Continuous floating animation
      animate={
        shouldReduceMotion
          ? { y: 0 }
          : {
              y: [0, -7, 0, 5, 0],
            }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }

      // Hover and click animations
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              scale: 1.1,
              transition: { duration: 0.25 },
            }
      }
      whileTap={{ scale: 0.92 }}

      className="
        fixed right-8 top-30 z-999
        flex h-12 w-12
        items-center justify-center

        rounded-2xl
        border border-(--theme-border)

        bg-(--theme-surface)
        text-(--theme-text)

        shadow-[6px_6px_12px_var(--theme-shadow-dark),-6px_-6px_12px_var(--theme-shadow-light)]

        transition-colors duration-300

        hover:text-(--theme-primary)

        hover:shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]

        active:text-(--theme-primary)

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-(--theme-primary)

        max-sm:right-3
        max-sm:h-10
        max-sm:w-10

        cursor-pointer
        will-change-transform
      "
    >
      <ArrowLeft
        size={21}
        strokeWidth={2.3}
      />
    </motion.button>
  );
}