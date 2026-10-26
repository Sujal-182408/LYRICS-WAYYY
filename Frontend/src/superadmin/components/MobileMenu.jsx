import React from "react";
import Sidebar from "./Sidebar";

export default function MobileMenu({
  open,
  onClose,
  activeModule,
  onModuleChange,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="relative h-full w-[290px]">
        <Sidebar
          mobile
          activeModule={activeModule}
          onModuleChange={onModuleChange}
          onClose={onClose}
        />
      </div>
    </div>
  );
}