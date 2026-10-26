
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { BASE_URL } from "../../config/api";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

import {
  getArtistApplications,
  reviewArtistApplication,
} from "../services/artistService";

const STATUS_OPTIONS = [
  { value: "", label: "All Applications" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (
    imagePath.startsWith("http://") ||
    imagePath.startsWith("https://")
  ) {
    return imagePath;
  }

  return `${BASE_URL}/${imagePath.replace(/^\/+/, "")}`;
};

export default function ArtistManagement() {
  const [applications, setApplications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [status, setStatus] = useState("pending");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [reviewingId, setReviewingId] = useState(null);

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNote, setRejectNote] = useState("");

  // ==========================================
  // LOAD ARTIST APPLICATIONS
  // ==========================================
  const loadApplications = useCallback(
    async ({ refresh = false } = {}) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const data = await getArtistApplications({
          status,
          search,
          page,
          limit: 20,
        });

        if (!data?.success) {
          throw new Error(
            data?.message ||
              "Failed to load artist applications."
          );
        }

        setApplications(data.applications || []);
        setPages(Math.max(1, Number(data.pages) || 1));
      } catch (err) {
        console.error(
          "ARTIST APPLICATION LOAD ERROR:",
          err?.response?.data || err
        );

        setError(
          getErrorMessage(
            err,
            "Unable to load artist applications."
          )
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status, search, page]
  );

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  // ==========================================
  // APPROVE ARTIST
  // ==========================================
const handleApprove = async (application) => {
console.log("ARTIST APPLICATION OBJECT:", application);

const applicationId =
typeof application === "string"
? application
: application?._id || application?.id;

if (!applicationId) {
console.error(
"Application ID is missing. Check the ARTIST APPLICATION OBJECT log."
);
return;
}

try {
const result = await reviewArtistApplication(
String(applicationId),
"approved",
""
);


console.log("ARTIST APPROVAL SUCCESS:", result);
await loadApplications();


} catch (error) {
console.error(
"APPROVE ARTIST ERROR:",
error.response?.data || error.message
);
}
};


  // ==========================================
  // REJECT ARTIST
  // ==========================================
const handleReject = async (id, admin_note = "") => {
try {
const result = await reviewArtistApplication(
id,
"rejected",
admin_note
);


console.log("ARTIST REJECTION SUCCESS:", result);
await loadApplications();


} catch (error) {
console.error(
"REJECT ARTIST ERROR:",
error.response?.data || error.message
);
}
};


  // ==========================================
  // SEARCH
  // ==========================================
  const handleSearch = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  // ==========================================
  // SHARED STYLES
  // ==========================================
  const panelClass = `
    rounded-2xl
    border border-white/[0.03]
    bg-[#1a1e24]
    shadow-[-6px_-6px_14px_rgba(255,255,255,0.02),8px_8px_18px_rgba(0,0,0,0.45)]
  `;

  const insetInputClass = `
    rounded-xl
    border border-white/[0.035]
    bg-[#15181d]
    text-sm text-white
    outline-none
    shadow-inner
    placeholder:text-white/20
    focus:border-[#8c7cf7]/30
  `;

  return (
    <div className="space-y-6 text-white">
      {/* ========================================
          HEADER
      ======================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[#8c7cf7]">
            Super Admin
          </p>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Artist Management
          </h1>

          <p className="mt-1 text-sm text-white/40">
            Review and manage artist applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadApplications({ refresh: true })
          }
          disabled={refreshing || loading}
          className="
            flex min-h-[44px] items-center justify-center gap-2
            rounded-xl bg-[#1d2229] px-4
            text-sm font-medium text-white/70
            shadow-[-4px_-4px_9px_rgba(255,255,255,0.02),6px_6px_12px_rgba(0,0,0,0.45)]
            transition hover:text-white
            disabled:cursor-not-allowed disabled:opacity-50
          "
        >
          <RefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* ========================================
          FEEDBACK
      ======================================== */}
      {error && (
        <div
          role="alert"
          className="
            rounded-2xl border border-red-400/10
            bg-red-500/[0.06] px-4 py-3
            text-sm text-red-300
          "
        >
          <div className="flex items-start justify-between gap-3">
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="shrink-0 text-red-300/60 hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="
            rounded-2xl border border-[#2bd4c4]/10
            bg-[#2bd4c4]/[0.06] px-4 py-3
            text-sm text-[#2bd4c4]
          "
        >
          <div className="flex items-start justify-between gap-3">
            <span>{successMessage}</span>

            <button
              type="button"
              onClick={() => setSuccessMessage("")}
              aria-label="Dismiss success message"
              className="shrink-0 text-[#2bd4c4]/60 hover:text-[#2bd4c4]"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================
          FILTERS
      ======================================== */}
      <div className={`${panelClass} p-4`}>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              size={17}
              className="
                pointer-events-none absolute left-4 top-1/2
                -translate-y-1/2 text-white/25
              "
            />

            <input
              value={search}
              onChange={handleSearch}
              placeholder="Search artist..."
              aria-label="Search artist applications"
              className={`h-11 w-full pl-11 pr-4 ${insetInputClass}`}
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            aria-label="Filter applications by status"
            className={`
              h-11 px-4
              ${insetInputClass}
            `}
          >
            {STATUS_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[#15181d]"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================
          APPLICATION LIST
      ======================================== */}
      {loading ? (
        <div
          className={`
            flex min-h-[300px] items-center justify-center
            ${panelClass}
          `}
        >
          <div className="flex items-center gap-3 text-white/40">
            <Loader2
              size={22}
              className="animate-spin"
            />
            Loading artist applications...
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div
          className={`
            flex min-h-[300px] flex-col items-center justify-center
            px-6 text-center
            ${panelClass}
          `}
        >
          <ShieldCheck
            size={40}
            className="mb-4 text-white/15"
          />

          <h3 className="text-base font-semibold text-white/60">
            No artist applications
          </h3>

          <p className="mt-1 text-sm text-white/25">
            There are no applications matching your filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const user = application.user_id || {};

            const isPending =
              application.status === "pending";

            const isReviewing =
              reviewingId === application._id;

            const profileImage =
              user.profileImage || user.profile_image || "";

            return (
              <div
                key={application._id}
                className={`
                  overflow-hidden
                  ${panelClass}
                `}
              >
                <div className="p-5">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                    {/* ARTIST */}
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <div
                        className="
                          flex h-14 w-14 shrink-0
                          items-center justify-center overflow-hidden
                          rounded-2xl bg-[#15181d]
                          shadow-inner
                        "
                      >
                        {profileImage ? (
                          <img
                            src={getImageUrl(profileImage)}
                            alt={
                              application.artist_name ||
                              user.name ||
                              "Artist"
                            }
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display =
                                "none";
                            }}
                          />
                        ) : (
                          <UserRound
                            size={23}
                            className="text-white/20"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold">
                          {application.artist_name ||
                            user.name ||
                            "Unknown Artist"}
                        </h3>

                        <p className="mt-1 truncate text-xs text-white/35">
                          {user.email || "No email"}
                        </p>

                        <p className="mt-1 text-xs text-white/25">
                          {application.genre ||
                            "Genre not provided"}
                        </p>
                      </div>
                    </div>

                    {/* STATUS */}
                    <div>
                      <span
                        className={`
                          inline-flex rounded-full px-3 py-1.5
                          text-[11px] font-semibold uppercase
                          ${
                            application.status === "approved"
                              ? "bg-[#2bd4c4]/10 text-[#2bd4c4]"
                              : application.status === "rejected"
                              ? "bg-red-400/10 text-red-300"
                              : "bg-amber-400/10 text-amber-300"
                          }
                        `}
                      >
                        {application.status || "unknown"}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedApplication(application)
                        }
                        className="
                          min-h-[40px] rounded-xl
                          bg-[#20252c] px-4
                          text-xs font-semibold text-white/65
                          shadow-[-3px_-3px_7px_rgba(255,255,255,0.02),4px_4px_8px_rgba(0,0,0,0.4)]
                          transition hover:text-white
                        "
                      >
                        View
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            disabled={isReviewing}
                            onClick={() =>
                              handleApprove(application)
                            }
                            className="
                              flex min-h-[40px] items-center gap-2
                              rounded-xl bg-[#2bd4c4]/10 px-4
                              text-xs font-semibold text-[#2bd4c4]
                              transition hover:bg-[#2bd4c4]/15
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                          >
                            {isReviewing ? (
                              <Loader2
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Check size={15} />
                            )}

                            Approve
                          </button>

                          <button
                            type="button"
                            disabled={isReviewing}
                            onClick={() => {
                              setRejectingId(application._id);
                              setRejectNote("");
                              setError("");
                            }}
                            className="
                              flex min-h-[40px] items-center gap-2
                              rounded-xl bg-red-400/10 px-4
                              text-xs font-semibold text-red-300
                              transition hover:bg-red-400/15
                              disabled:cursor-not-allowed disabled:opacity-50
                            "
                          >
                            <X size={15} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  {application.description && (
                    <p className="mt-5 border-t border-white/[0.04] pt-4 text-sm leading-6 text-white/40">
                      {application.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* ======================================
              PAGINATION
          ====================================== */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-white/30">
              Page {page} of {pages}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() =>
                  setPage((current) =>
                    Math.max(1, current - 1)
                  )
                }
                aria-label="Previous page"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl bg-[#1a1e24] text-white/50
                  shadow-[-3px_-3px_7px_rgba(255,255,255,0.02),4px_4px_8px_rgba(0,0,0,0.4)]
                  disabled:cursor-not-allowed disabled:opacity-20
                "
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                disabled={page >= pages || loading}
                onClick={() =>
                  setPage((current) =>
                    Math.min(pages, current + 1)
                  )
                }
                aria-label="Next page"
                className="
                  flex h-10 w-10 items-center justify-center
                  rounded-xl bg-[#1a1e24] text-white/50
                  shadow-[-3px_-3px_7px_rgba(255,255,255,0.02),4px_4px_8px_rgba(0,0,0,0.4)]
                  disabled:cursor-not-allowed disabled:opacity-20
                "
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================
          VIEW APPLICATION MODAL
      ======================================== */}
      {selectedApplication && (
        <div
          className="
            fixed inset-0 z-50 flex items-center justify-center
            bg-black/70 p-4
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedApplication(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="artist-application-title"
            className="
              max-h-[90vh] w-full max-w-2xl overflow-y-auto
              rounded-3xl border border-white/[0.04]
              bg-[#1a1e24] p-6
              shadow-[0_25px_80px_rgba(0,0,0,0.6)]
            "
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8c7cf7]">
                  Artist Application
                </p>

                <h2
                  id="artist-application-title"
                  className="mt-1 text-xl font-bold"
                >
                  {selectedApplication.artist_name ||
                    "Artist Application"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedApplication(null)
                }
                aria-label="Close application details"
                className="
                  flex h-10 w-10 shrink-0 items-center justify-center
                  rounded-xl bg-[#15181d] text-white/40
                  shadow-inner hover:text-white
                "
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25">
                  Applicant
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {selectedApplication.user_id?.name ||
                    "Unknown"}
                </p>

                <p className="mt-1 text-xs text-white/35">
                  {selectedApplication.user_id?.email ||
                    "No email"}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25">
                  Genre
                </p>

                <p className="mt-1 text-sm text-white/70">
                  {selectedApplication.genre ||
                    "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/25">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/50">
                  {selectedApplication.description ||
                    selectedApplication.bio ||
                    "No description provided."}
                </p>
              </div>

              {selectedApplication.social_profile_url && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/25">
                    Portfolio / Social
                  </p>

                  <a
                    href={
                      selectedApplication.social_profile_url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block break-all text-sm text-[#8c7cf7] hover:underline"
                  >
                    {selectedApplication.social_profile_url}
                  </a>
                </div>
              )}

              {selectedApplication.verificationSong && (
                <div
                  className="
                    rounded-2xl border border-white/[0.03]
                    bg-[#15181d] p-4
                  "
                >
                  <p className="text-[10px] uppercase tracking-widest text-white/25">
                    Verification Song
                  </p>

                  <p className="mt-2 text-sm font-medium text-white/70">
                    {selectedApplication.verificationSong.title ||
                      selectedApplication.verificationSong.original_filename ||
                      "Untitled verification song"}
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    {selectedApplication.verificationSong.mime_type ||
                      "Audio"}
                  </p>
                </div>
              )}
            </div>

            {selectedApplication.status === "pending" && (
              <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-white/[0.04] pt-5">
                <button
                  type="button"
                  disabled={
                    reviewingId === selectedApplication._id
                  }
                  onClick={() => {
                    setRejectingId(selectedApplication._id);
                    setRejectNote("");
                    setError("");
                  }}
                  className="
                    rounded-xl bg-red-400/10 px-5 py-3
                    text-sm font-semibold text-red-300
                    disabled:opacity-50
                  "
                >
                  Reject
                </button>

                <button
                  type="button"
                  disabled={
                    reviewingId === selectedApplication._id
                  }
                  onClick={() =>
                    handleApprove(selectedApplication)
                  }
                  className="
                    flex items-center gap-2 rounded-xl
                    bg-[#2bd4c4]/10 px-5 py-3
                    text-sm font-semibold text-[#2bd4c4]
                    disabled:cursor-not-allowed disabled:opacity-50
                  "
                >
                  {reviewingId === selectedApplication._id ? (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Check size={16} />
                  )}

                  Approve Artist
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================
          REJECTION MODAL
      ======================================== */}
      {rejectingId && (
        <div
          className="
            fixed inset-0 z-[60] flex items-center justify-center
            bg-black/75 p-4
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRejectingId(null);
              setRejectNote("");
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-artist-title"
            className="
              w-full max-w-lg rounded-3xl
              border border-white/[0.04]
              bg-[#1a1e24] p-6
              shadow-[0_25px_80px_rgba(0,0,0,0.65)]
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3
                  id="reject-artist-title"
                  className="text-lg font-bold"
                >
                  Reject Artist
                </h3>

                <p className="mt-1 text-xs text-white/35">
                  Add a reason for the applicant.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectNote("");
                }}
                aria-label="Close rejection dialog"
                className="text-white/30 hover:text-white"
              >
                <X size={19} />
              </button>
            </div>

            <textarea
              value={rejectNote}
              onChange={(event) =>
                setRejectNote(event.target.value)
              }
              placeholder="Reason for rejection..."
              rows={5}
              className={`
                mt-5 w-full resize-none p-4
                ${insetInputClass}
                focus:border-red-400/20
              `}
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setRejectingId(null);
                  setRejectNote("");
                }}
                className="
                  rounded-xl bg-[#20252c] px-5 py-3
                  text-sm text-white/60
                "
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={reviewingId === rejectingId}
                onClick={handleReject}
                className="
                  flex items-center gap-2 rounded-xl
                  bg-red-400/10 px-5 py-3
                  text-sm font-semibold text-red-300
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                {reviewingId === rejectingId && (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                )}

                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
