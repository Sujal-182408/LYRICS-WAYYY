import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const FloatingBackButton = () => {
const navigate = useNavigate();
const location = useLocation();

const isHomePage = location.pathname === "/home";
const isArtistDashboard = location.pathname === "/artist/dashboard";

// Hide the button only on the Home page.
if (isHomePage) {
return null;
}

const handleBack = () => {
if (isArtistDashboard) {
// From the Artist Dashboard, return to Home.
navigate("/home", { replace: true });
} else {
// From Profile, Collections, Songs, Albums, Analytics, etc.,
// return to the Artist Dashboard.
navigate("/artist/dashboard", { replace: true });
}
};

const destination = isArtistDashboard
? "Back to Home"
: "Back to Artist Dashboard";

return (
<button
type="button"
onClick={handleBack}
aria-label={destination}
title={destination}
className="
group fixed bottom-25 left-6 z-50
flex h-12 w-12 items-center justify-center
rounded-full
transition-all duration-300 ease-out
hover:scale-110
active:scale-95
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-(--theme-primary)
focus-visible:ring-offset-2
md:bottom-8 md:left-65
"
style={{
backgroundColor: "var(--theme-surface)",
color: "var(--theme-primary)",
border: "1px solid var(--theme-border)",
boxShadow:
"8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)",
}}
onMouseEnter={(event) => {
event.currentTarget.style.color = "var(--theme-secondary)";
event.currentTarget.style.boxShadow =
"inset 4px 4px 8px var(--theme-shadowDark), inset -4px -4px 8px var(--theme-shadowLight)";
}}
onMouseLeave={(event) => {
event.currentTarget.style.color = "var(--theme-primary)";
event.currentTarget.style.boxShadow =
"8px 8px 16px var(--theme-shadowDark), -8px -8px 16px var(--theme-shadowLight)";
}}
> <ArrowLeft
     size={20}
     strokeWidth={2.2}
     className="transition-transform duration-300 group-hover:-translate-x-1"
   /> </button>
);
};

export default FloatingBackButton;
