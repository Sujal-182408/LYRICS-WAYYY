import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/* ==========================================================
   FEATURED COLLECTIONS
========================================================== */

const featuredCollections = [
  {
    title: "Night Vibes",
    songs: "25 Tracks",
    image: "/albums/nightvibe.webp",
  },
  {
    title: "Chill Beats",
    songs: "40 Tracks",
    image: "/albums/chillingbeats.webp",
  },
  {
    title: "Workout Mix",
    songs: "30 Tracks",
    image: "/albums/workoutmix.webp",
  },
  {
    title: "Trending Now",
    songs: "50 Tracks",
    image: "/albums/trendingnow.webp",
  },
];

/* ==========================================================
   FRAMER MOTION
========================================================== */

const pageVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.35,
      ease: "easeOut",
    },
  },
};

const headingVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 22,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: "easeOut",
    },
  },
};

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

/* ==========================================================
   NEUMORPHIC SYSTEM
========================================================== */

const neuRaised = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    12px 12px 24px var(--theme-shadowDark),
    -10px -10px 22px var(--theme-shadowLight)
  `,
};

const neuRaisedLarge = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    18px 18px 38px var(--theme-shadowDark),
    -14px -14px 32px var(--theme-shadowLight)
  `,
};

const neuRaisedSmall = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    7px 7px 15px var(--theme-shadowDark),
    -6px -6px 14px var(--theme-shadowLight)
  `,
};

const neuInset = {
  background: "var(--theme-surface)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    inset 6px 6px 12px var(--theme-shadowDark),
    inset -6px -6px 12px var(--theme-shadowLight)
  `,
};

const neuButton = {
  background: "var(--theme-surface)",
  color: "var(--theme-primary)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    6px 6px 12px var(--theme-shadowDark),
    -5px -5px 11px var(--theme-shadowLight)
  `,
};

const neuButtonPressed = {
  background: "var(--theme-surface)",
  color: "var(--theme-primary)",
  border: "1px solid var(--theme-border)",
  boxShadow: `
    inset 5px 5px 10px var(--theme-shadowDark),
    inset -5px -5px 10px var(--theme-shadowLight)
  `,
};

/* ==========================================================
   GALLERY
========================================================== */

const Gallery = () => {
  const navigate = useNavigate();

const openCollections = () => {
  navigate("/collections");
};

const openMyPlaylists = () => {
  navigate("/playlists");
};
  return (
    <motion.section
      id="playlist"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
      className="
        min-h-screen
        overflow-hidden
        pt-30!
        pb-20!
      "
    >
      {/* ======================================================
                            HEADING
      ====================================================== */}

      <motion.div
        variants={headingVariants}
        initial="hidden"
        animate="visible"
        className="px-5 sm:px-8 lg:px-12"
      >
        <h1
          style={{
            color: "var(--theme-text)",
            textShadow: "0 0 18px var(--theme-glowPrimary)",
          }}
          className="
            text-center
            font-bold
            uppercase
            tracking-[0.18em]
            text-4xl
            sm:text-5xl
            lg:text-6xl
            font-['delius']
          "
        >
          Music{" "}
          <span
            style={{
              color: "var(--theme-secondary)",
              textShadow: "0 0 18px var(--theme-glowSecondary)",
            }}
          >
            Gallery
          </span>
        </h1>

        {/* small tactile divider */}
        <div className="flex justify-center mt-7">
          <div
            style={neuInset}
            className="
              h-1.5
              w-24
              rounded-full
              p-px
            "
          >
            <div
              style={{
                background:
                  "linear-gradient(90deg, var(--theme-primary), var(--theme-secondary))",
              }}
              className="h-full w-full rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* ======================================================
                    COLLECTION HERO
      ====================================================== */}

      <div className="px-4 sm:px-6 lg:px-10 mt-12!">
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{
            y: -5,
          }}
          transition={{
            duration: 0.25,
          }}
          onClick={openCollections}
          style={neuRaisedLarge}
          className="
            group
            relative
            cursor-pointer
            overflow-hidden
            rounded-[2.2rem]
            p-3!
            sm:p-5!
            lg:p-6!
            border
          "
        >
          {/* ==================================================
                         OUTER INNER FRAME
          ================================================== */}

          <div
            style={neuInset}
            className="
              relative
              overflow-hidden
              rounded-[1.8rem]
              p-5!
              sm:p-7!
              lg:p-9!
            "
          >
            {/* ==================================================
                          DECORATIVE LIGHT
            ================================================== */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -top-32
                -left-32
                w-72
                h-72
                rounded-full
                opacity-[0.07]
                blur-3xl
              "
              style={{
                background: "var(--theme-secondary)",
              }}
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-32
                -right-32
                w-72
                h-72
                rounded-full
                opacity-[0.06]
                blur-3xl
              "
              style={{
                background: "var(--theme-primary)",
              }}
            />

            <div
              className="
                relative
                z-10
                flex
                flex-col
                lg:flex-row
                items-center
                justify-between
                gap-10
                lg:gap-16
              "
            >
              {/* ==================================================
                                LEFT SIDE
              ================================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: -20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.08,
                }}
                className="
                  w-full
                  max-w-2xl
                  text-center
                  lg:text-left
                "
              >
                {/* Badge */}

                <div className="flex justify-center lg:justify-start">
                  <span
                    style={neuRaisedSmall}
                    className="
                      inline-flex
                      items-center
                      rounded-full
                      px-5!
                      py-2.5!
                      text-[11px]
                      sm:text-xs
                      font-semibold
                      uppercase
                      tracking-[0.22em]
                    "
                  >
                    <span
                      className="
                        mr-2
                        h-2
                        w-2
                        rounded-full
                      "
                      style={{
                        background: "var(--theme-secondary)",
                        boxShadow:
                          "0 0 10px var(--theme-glowSecondary)",
                      }}
                    />

                    <span
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    >
                      Your Library
                    </span>
                  </span>
                </div>

                {/* Heading */}

                <h2
                  style={{
                    color: "var(--theme-text)",
                  }}
                  className="
                    mt-7!
                    text-3xl
                    sm:text-4xl
                    lg:text-5xl
                    font-bold
                    leading-[1.05]
                    tracking-tight
                  "
                >
                  Explore{" "}
                  <span
                    style={{
                      color: "var(--theme-secondary)",
                      textShadow:
                        "0 0 16px var(--theme-glowSecondary)",
                    }}
                  >
                    Collections
                  </span>
                </h2>

                {/* Description */}

                <p
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                  className="
                    mt-5!
                    max-w-xl
                    mx-auto
                    lg:mx-0
                    text-sm
                    sm:text-base
                    leading-7
                  "
                >
                  Create and manage your favorite playlists,
                  albums and personal music collections.
                </p>

                {/* ==================================================
                              CTA BUTTON
                ================================================== */}

                <div className="mt-7! flex justify-center lg:justify-start">
                  <motion.button
                    type="button"
                    whileHover={{
                      y: -2,
                    }}
                    whileTap={{
                      scale: 0.97,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      openCollections();
                    }}
                    style={neuButton}
                    className="
                      group/button
                      inline-flex
                      items-center
                      gap-3
                      rounded-2xl
                      px-5!
                      py-3!
                      text-sm
                      font-semibold
                      transition-all
                      duration-200
                    "
                  >
                    <span>
                      Browse your library
                    </span>

                    <span
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                      className="
                        text-lg
                        transition-transform
                        duration-200
                        group-hover/button:translate-x-1
                      "
                    >
                      →
                    </span>
                  </motion.button>
                </div>
              </motion.div>

              {/* ==================================================
                          PLAYLIST NEUMORPHIC UNIT
              ================================================== */}

              <motion.div
                initial={{
                  opacity: 0,
                  x: 20,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  scale: 1,
                }}
                transition={{
                  duration: 0.5,
                  delay: 0.15,
                }}
                whileHover={{
                  y: -7,
                }}
               onClick={(event) => {
  event.stopPropagation();
  openMyPlaylists();
}}
                style={neuRaised}
                className="
                  relative
                  shrink-0
                  w-52
                  h-52
                  sm:w-60
                  sm:h-60
                  rounded-[2.2rem]
                  flex
                  flex-col
                  items-center
                  justify-center
                  border
                  cursor-pointer
                "
              >
                {/* ==================================================
                             INNER CAVITY
                ================================================== */}

                <div
                  style={neuInset}
                  className="
                    absolute
                    inset-4
                    rounded-[1.7rem]
                    pointer-events-none
                  "
                />

                {/* ==================================================
                              ORB GLOW
                ================================================== */}

                <div
                  aria-hidden="true"
                  className="
                    absolute
                    w-28
                    h-28
                    rounded-full
                    opacity-[0.12]
                    blur-2xl
                  "
                  style={{
                    background: "var(--theme-secondary)",
                  }}
                />

                {/* ==================================================
                            MUSIC BUTTON
                ================================================== */}

                <motion.div
                  whileHover={{
                    scale: 1.06,
                    rotate: 4,
                  }}
                  whileTap={{
                    scale: 0.95,
                  }}
                  style={{
                    background: "var(--theme-surface)",
                    color: "var(--theme-secondary)",
                    border:
                      "1px solid var(--theme-border)",
                    boxShadow: `
                      8px 8px 16px var(--theme-shadowDark),
                      -7px -7px 15px var(--theme-shadowLight)
                    `,
                  }}
                  className="
                    relative
                    z-10
                    w-24
                    h-24
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-3xl
                    select-none
                  "
                >
                  <div
                    style={{
                      boxShadow:
                        "inset 3px 3px 7px var(--theme-shadowDark), inset -3px -3px 7px var(--theme-shadowLight)",
                    }}
                    className="
                      absolute
                      inset-2
                      rounded-full
                    "
                  />

                  <span className="relative z-10">
                    🎵
                  </span>
                </motion.div>

                {/* ==================================================
                              LABEL
                ================================================== */}

                <h3
                  style={{
                    color: "var(--theme-text)",
                  }}
                  className="
                    relative
                    z-10
                    mt-5!
                    font-semibold
                    text-base
                  "
                >
                  My Playlist
                </h3>

                <p
  style={{
    color: "var(--theme-textMuted)",
  }}
  className="
    relative
    z-10
    mt-1!
    text-xs
  "
>
  Open My Playlists →
</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ======================================================
                    FEATURED COLLECTIONS
      ====================================================== */}

      <section
        className="
          px-5
          sm:px-8
          lg:px-12
          pt-16!
          pb-10!
        "
      >
        {/* ==================================================
                            SECTION TITLE
        ================================================== */}

        <motion.div
          variants={headingVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className="text-center"
        >
          <h2
            style={{
              color: "var(--theme-text)",
            }}
            className="
              text-3xl
              sm:text-4xl
              font-bold
              tracking-widest
            "
          >
            Featured{" "}
            <span
              style={{
                color: "var(--theme-secondary)",
                textShadow:
                  "0 0 14px var(--theme-glowSecondary)",
              }}
            >
              Collections
            </span>
          </h2>

          <p
            style={{
              color: "var(--theme-textMuted)",
            }}
            className="
              mt-3!
              text-sm
            "
          >
            Handpicked spaces for every mood.
          </p>
        </motion.div>

        {/* ==================================================
                              GRID
        ================================================== */}

        <motion.div
          variants={gridVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.08,
          }}
          className="
            mt-12!
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-7
          "
        >
          {featuredCollections.map((playlist) => (
            <motion.article
              key={playlist.title}
              variants={cardVariants}
              whileHover={{
                y: -8,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={openCollections}
              style={neuRaised}
              className="
                group
                relative
                cursor-pointer
                rounded-[2rem]
                p-4!
                border
              "
            >
              {/* ==================================================
                              CARD INNER
              ================================================== */}

              <div
                style={neuInset}
                className="
                  rounded-[1.65rem]
                  p-3!
                "
              >
                {/* ==================================================
                                  IMAGE WELL
                ================================================== */}

                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-[1.35rem]
                    aspect-square
                  "
                >
                  <img
                    src={playlist.image}
                    alt={`${playlist.title} collection`}
                    loading="lazy"
                    decoding="async"
                    width="500"
                    height="500"
                    className="
                      w-full
                      h-full
                      object-cover
                      transition-transform
                      duration-700
                      ease-out
                      group-hover:scale-105
                    "
                  />

                  {/* Image shading */}

                  <div
                    aria-hidden="true"
                    className="
                      absolute
                      inset-0
                      pointer-events-none
                    "
                    style={{
                      background:
                        "linear-gradient(145deg, rgba(255,255,255,0.08), transparent 40%, rgba(0,0,0,0.16))",
                    }}
                  />

                  {/* ==================================================
                              PLAY BUTTON
                  ================================================== */}

                  <motion.div
                    aria-hidden="true"
                    initial={{
                      opacity: 0,
                      scale: 0.75,
                    }}
                    whileHover={{
                      scale: 1,
                    }}
                    className="
                      absolute
                      inset-0
                      flex
                      items-center
                      justify-center
                      opacity-0
                      group-hover:opacity-100
                      transition-opacity
                      duration-300
                    "
                  >
                    <div
                      style={{
                        background:
                          "var(--theme-surface)",
                        color:
                          "var(--theme-primary)",
                        border:
                          "1px solid var(--theme-border)",
                        boxShadow: `
                          8px 8px 16px rgba(0,0,0,0.35),
                          -6px -6px 14px rgba(255,255,255,0.06)
                        `,
                      }}
                      className="
                        w-14
                        h-14
                        rounded-full
                        flex
                        items-center
                        justify-center
                        text-xl
                        pl-0.5
                      "
                    >
                      ▶
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* ==================================================
                              CARD DETAILS
              ================================================== */}

              <div className="px-2! pt-5! pb-2!">
                <h3
                  style={{
                    color: "var(--theme-text)",
                  }}
                  className="
                    text-lg
                    sm:text-xl
                    font-bold
                    truncate
                  "
                >
                  {playlist.title}
                </h3>

                <div className="flex items-center gap-2 mt-2!">
                  <span
                    style={{
                      background:
                        "var(--theme-surface)",
                      boxShadow: `
                        inset 3px 3px 6px var(--theme-shadowDark),
                        inset -3px -3px 6px var(--theme-shadowLight)
                      `,
                    }}
                    className="
                      w-1.5
                      h-1.5
                      rounded-full
                    "
                  />

                  <p
                    style={{
                      color: "var(--theme-textMuted)",
                    }}
                    className="text-sm"
                  >
                    {playlist.songs}
                  </p>
                </div>

                {/* ==================================================
                                OPEN BUTTON
                ================================================== */}

                <motion.button
                  type="button"
                  whileHover={{
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={(event) => {
                    event.stopPropagation();
                    openCollections();
                  }}
                  style={neuButton}
                  className="
                    relative
                    mt-5!
                    w-full
                    overflow-hidden
                    rounded-2xl
                    py-3!
                    font-semibold
                    text-sm
                    transition-all
                    duration-200
                  "
                >
                  {/* tactile highlight */}

                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-4
                      top-0
                      h-px
                      opacity-40
                    "
                    style={{
                      background:
                        "var(--theme-shadowLight)",
                    }}
                  />

                  <span className="relative z-10">
                    Open Collection
                  </span>
                </motion.button>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>
    </motion.section>
  );
};

export default Gallery;
