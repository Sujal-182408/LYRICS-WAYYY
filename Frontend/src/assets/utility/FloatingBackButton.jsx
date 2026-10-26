import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FALLBACK_ROUTE = "/home";

export default function FloatingBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

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

<button
  type="button"
  onClick={handleBack}
  aria-label="Go back to previous page"
  title="Go back"
  className="
    fixed right-8 top-30 z-999
    flex h-12 w-12 -translate-y-1/2
    items-center justify-center
    rounded-2xl
    border border-(--theme-border)
    bg-(--theme-surface)
    text-(--theme-text)
    shadow-[6px_6px_12px_var(--theme-shadow-dark),-6px_-6px_12px_var(--theme-shadow-light)]
    transition-all duration-300
    hover:scale-105
    hover:text-(--theme-primary)
    hover:shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]
    active:scale-95
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-(--theme-primary)
    max-sm:right-3
    max-sm:h-10
    max-sm:w-10
  "
>
  <ArrowLeft size={21} strokeWidth={2.3} />
</button>


  );
}