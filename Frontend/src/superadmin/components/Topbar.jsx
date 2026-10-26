import React from "react";
import {
  ShieldCheck,
  CircleUserRound,
} from "lucide-react";

export default function Topbar() {
  return (
    <header
      className="
        sticky
        top-0
        z-30
        border-b
        border-white/[0.03]
        bg-[#15181d]/95
        px-4
        py-4
        backdrop-blur-md
        sm:px-6
        lg:px-8
      "
    >
      <div className="flex items-center justify-between gap-4">

        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-2xl
              bg-[#1b2027]
              text-[#8c7cf7]
              shadow-[6px_6px_12px_#0c0f13,-6px_-6px_12px_#252b34]
            "
          >
            <ShieldCheck size={21} />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              SuperAdmin Control Center
            </p>

            <p className="truncate text-xs text-white/35">
              JOY MUSIC administration
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="
            flex
            shrink-0
            items-center
            gap-3
            rounded-2xl
            bg-[#1b2027]
            px-3
            py-2
            shadow-[inset_3px_3px_6px_#0d1014,inset_-3px_-3px_6px_#29303a]
          "
        >
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-white">
              Super Admin
            </p>

            <p className="text-[10px] text-[#2bd4c4]">
              Authorized
            </p>
          </div>

          <CircleUserRound
            size={28}
            className="text-[#8c7cf7]"
          />
        </div>

      </div>
    </header>
  );
}