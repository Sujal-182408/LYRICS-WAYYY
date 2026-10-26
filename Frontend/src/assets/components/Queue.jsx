import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListMusic,
  X,
  Play,
  Trash2,
  Music2,
  GripVertical,
} from "lucide-react";

import { usePlayer } from "../../context/PlayerContext";
import { BASE_URL } from "../../config/api";

const Queue = ({ onClose }) => {
  const {
    currentSong,
    queue,
    playSong,
    removeFromQueue,
    clearQueue,
  } = usePlayer();

  const getCover = (song) => {
    if (!song?.coverImage) {
      return "/image/default-cover.jpg";
    }

    if (
      song.coverImage.startsWith("http://") ||
      song.coverImage.startsWith("https://")
    ) {
      return song.coverImage;
    }

    return `${BASE_URL}/${song.coverImage.replace(/^\/+/, "")}`;
  };

  const handlePlay = async (song, index) => {
    await playSong(song, index, queue);
  };

  const handleRemove = (songId, e) => {
    e?.stopPropagation();
    removeFromQueue(songId);
  };

  const handleClear = () => {
    clearQueue();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="
          w-full
          rounded-3xl
          p-5
          bg-[var(--theme-surface)]
          border
          border-[var(--theme-border)]
          shadow-[
            8px_8px_18px_var(--theme-shadowDark),
            -7px_-7px_17px_var(--theme-shadowLight)
          ]
        "
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-2xl
                flex
                items-center
                justify-center
                bg-[var(--theme-surface)]
                shadow-[
                  inset_3px_3px_7px_var(--theme-shadowDark),
                  inset_-3px_-3px_7px_var(--theme-shadowLight)
                ]
              "
            >
              <ListMusic
                size={20}
                className="text-[var(--theme-primary)]"
              />
            </div>

            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  text-[var(--theme-text)]
                "
              >
                Queue
              </h2>

              <p
                className="
                  text-xs
                  text-[var(--theme-textMuted)]
                "
              >
                {queue.length}{" "}
                {queue.length === 1
                  ? "song"
                  : "songs"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {queue.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="
                  px-3
                  py-2
                  rounded-xl
                  text-xs
                  font-semibold
                  text-[var(--theme-danger)]
                  bg-[var(--theme-surface)]
                  shadow-[
                    4px_4px_9px_var(--theme-shadowDark),
                    -3px_-3px_8px_var(--theme-shadowLight)
                  ]
                  hover:scale-[1.03]
                  active:scale-95
                  transition
                "
              >
                Clear
              </button>
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="
                  w-9
                  h-9
                  rounded-xl
                  flex
                  items-center
                  justify-center
                  bg-[var(--theme-surface)]
                  text-[var(--theme-textMuted)]
                  shadow-[
                    4px_4px_9px_var(--theme-shadowDark),
                    -3px_-3px_8px_var(--theme-shadowLight)
                  ]
                  hover:text-[var(--theme-text)]
                  active:scale-95
                  transition
                "
              >
                <X size={17} />
              </button>
            )}
          </div>
        </div>

        {/* =====================================================
            EMPTY QUEUE
        ====================================================== */}

        {queue.length === 0 ? (
          <div
            className="
              py-12
              flex
              flex-col
              items-center
              justify-center
              text-center
            "
          >
            <div
              className="
                w-16
                h-16
                rounded-2xl
                flex
                items-center
                justify-center
                bg-[var(--theme-surface)]
                shadow-[
                  inset_4px_4px_10px_var(--theme-shadowDark),
                  inset_-4px_-4px_10px_var(--theme-shadowLight)
                ]
              "
            >
              <Music2
                size={27}
                className="text-[var(--theme-textMuted)]"
              />
            </div>

            <h3
              className="
                mt-4
                font-semibold
                text-[var(--theme-text)]
              "
            >
              Queue is empty
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-[var(--theme-textMuted)]
              "
            >
              Add songs from the three-dot menu.
            </p>
          </div>
        ) : (
          /* ===================================================
             QUEUE SONGS
          ==================================================== */

          <div className="space-y-3">
            {queue.map((song, index) => {
              const isCurrent =
                currentSong?._id === song?._id;

              return (
                <motion.div
                  key={`${song._id}-${index}`}
                  layout
                  initial={{
                    opacity: 0,
                    x: 15,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  className={`
                    group
                    flex
                    items-center
                    gap-3
                    p-3
                    rounded-2xl
                    border
                    border-[var(--theme-border)]
                    transition-all
                    ${
                      isCurrent
                        ? `
                          bg-[var(--theme-background)]
                          shadow-[
                            inset_4px_4px_9px_var(--theme-shadowDark),
                            inset_-4px_-4px_9px_var(--theme-shadowLight)
                          ]
                        `
                        : `
                          bg-[var(--theme-surface)]
                          shadow-[
                            5px_5px_11px_var(--theme-shadowDark),
                            -4px_-4px_10px_var(--theme-shadowLight)
                          ]
                        `
                    }
                  `}
                >
                  {/* POSITION */}

                  <div
                    className="
                      w-6
                      text-center
                      shrink-0
                      text-xs
                      font-semibold
                      text-[var(--theme-textMuted)]
                    "
                  >
                    {index + 1}
                  </div>

                  {/* COVER */}

                  <div
                    className="
                      relative
                      w-12
                      h-12
                      rounded-xl
                      overflow-hidden
                      shrink-0
                    "
                  >
                    <img
                      src={getCover(song)}
                      alt={song.title || "Song"}
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                    <div
                      className="
                        absolute
                        inset-0
                        bg-black/20
                      "
                    />

                    {isCurrent && (
                      <div
                        className="
                          absolute
                          inset-0
                          flex
                          items-center
                          justify-center
                        "
                      >
                        <div
                          className="
                            w-7
                            h-7
                            rounded-full
                            flex
                            items-center
                            justify-center
                            bg-[var(--theme-primary)]
                            text-white
                          "
                        >
                          <Play
                            size={12}
                            fill="currentColor"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SONG INFO */}

                  <button
                    type="button"
                    onClick={() =>
                      handlePlay(song, index)
                    }
                    className="
                      min-w-0
                      flex-1
                      text-left
                    "
                  >
                    <div
                      className="
                        truncate
                        text-sm
                        font-semibold
                        text-[var(--theme-text)]
                      "
                    >
                      {song.title ||
                        "Unknown Song"}
                    </div>

                    <div
                      className="
                        truncate
                        text-xs
                        mt-1
                        text-[var(--theme-textMuted)]
                      "
                    >
                      {typeof song.artist ===
                      "object"
                        ? song.artist?.name
                        : song.artist ||
                          "Unknown Artist"}
                    </div>
                  </button>

                  {/* CURRENT INDICATOR */}

                  {isCurrent && (
                    <div
                      className="
                        hidden
                        sm:flex
                        items-center
                        gap-[3px]
                        h-5
                      "
                    >
                      <span className="w-1 h-2 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                      <span className="w-1 h-4 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                      <span className="w-1 h-3 rounded-full bg-[var(--theme-primary)] animate-pulse" />
                    </div>
                  )}

                  {/* REMOVE */}

                  <button
                    type="button"
                    onClick={(e) =>
                      handleRemove(
                        song._id,
                        e
                      )
                    }
                    className="
                      w-9
                      h-9
                      rounded-xl
                      flex
                      items-center
                      justify-center
                      shrink-0
                      text-[var(--theme-textMuted)]
                      bg-[var(--theme-surface)]
                      shadow-[
                        3px_3px_7px_var(--theme-shadowDark),
                        -3px_-3px_7px_var(--theme-shadowLight)
                      ]
                      hover:text-[var(--theme-danger)]
                      active:scale-90
                      transition
                    "
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default Queue;