import React from "react";

import { motion } from "framer-motion";
import {
  Mic2,
  SlidersHorizontal,
  Headphones,
  Music4,
} from "lucide-react";

/* ============================================================
        PRODUCTION DATA
============================================================ */

const features = [
  "Recording",
  "Mixing",
  "Mastering",
  "Sound Design",
];

const services = [
  {
    icon: <Mic2 size={22} />,
    title: "Recording",
    text: "Professional vocal and instrument recording with crystal-clear studio quality.",
  },
  {
    icon: <SlidersHorizontal size={22} />,
    title: "Mixing",
    text: "Balanced mixes with depth, clarity and modern loudness.",
  },
  {
    icon: <Headphones size={22} />,
    title: "Mastering",
    text: "Streaming-ready masters optimized for every platform.",
  },
  {
    icon: <Music4 size={22} />,
    title: "Production",
    text: "Complete music production from concept to final release.",
  },
];

const stats = [
  {
    number: "500+",
    label: "Songs Produced",
  },
  {
    number: "120+",
    label: "Artists",
  },
  {
    number: "24/7",
    label: "Support",
  },
  {
    number: "10+",
    label: "Years Experience",
  },
];

/* ============================================================
        PRODUCTION
============================================================ */

const Production = () => {
  return (
    <motion.section
      id="productions"
      className="production"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.8,
      }}
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      {/* ======================================================
            THEME SPOTLIGHT
      ====================================================== */}

      <div
        className="production-spotlight"
        style={{
          background: `
            radial-gradient(
              circle at center,
              var(--theme-glowPrimary),
              transparent 65%
            )
          `,
        }}
      />

      <div className="production-inner">

        {/* ====================================================
              LEFT
        ==================================================== */}

        <motion.div
          className="production-left"
          initial={{
            x: -100,
            opacity: 0,
            rotate: -3,
          }}
          whileInView={{
            x: 0,
            opacity: 1,
            rotate: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.9,
            ease: "easeOut",
          }}
        >
          <div className="production-tilt gap-5">

            <div
              className="production-card"
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-text)",
                borderColor: "var(--theme-border)",
                boxShadow: `
                  12px 12px 28px var(--theme-shadowDark),
                  -12px -12px 28px var(--theme-shadowLight)
                `,
              }}
            >

              {/* STATUS */}

              <div
                className="production-status"
                style={{
                  color: "var(--theme-secondary)",
                }}
              >
                <span
                  className="production-status-dot"
                  style={{
                    backgroundColor: "var(--theme-secondary)",
                    boxShadow:
                      "0 0 12px var(--theme-glowSecondary)",
                  }}
                />

                STUDIO LIVE
              </div>

              {/* IMAGE */}

              <div
                className="production-image"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  borderColor: "var(--theme-border)",
                }}
              >
               <img
  src="/LW-64.webp"
  alt="LYRICS WAYYY"
  width={60}
  height={60}
  className="w-15 h-15 rounded-full object-cover"
  decoding="async"
  fetchPriority="high"
/>
              </div>

              {/* BOTTOM */}

              <div className="production-bottom">

                <div
                  className="production-label"
                  style={{
                    color: "var(--theme-primary)",
                  }}
                >
                  PREMIUM AUDIO
                </div>

                <h2
                  className="production-title"
                  style={{
                    color: "var(--theme-text)",
                  }}
                >
                  NEED
                  <br />
                  QUALITY SOUNDS?
                </h2>

                <div
                  className="production-divider"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--theme-primary), transparent)",
                  }}
                />

                {/* MINI STATS */}

                <div className="production-mini-stats">

                  <div>
                    <div
                      className="production-mini-number"
                      style={{
                        color: "var(--theme-primary)",
                      }}
                    >
                      500+
                    </div>

                    <div
                      className="production-mini-label"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      TRACKS
                    </div>
                  </div>

                  <div>
                    <div
                      className="production-mini-number"
                      style={{
                        color: "var(--theme-secondary)",
                      }}
                    >
                      120+
                    </div>

                    <div
                      className="production-mini-label"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      ARTISTS
                    </div>
                  </div>

                  <div>
                    <div
                      className="production-mini-number"
                      style={{
                        color: "var(--theme-primary)",
                      }}
                    >
                      24/7
                    </div>

                    <div
                      className="production-mini-label"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      SUPPORT
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        </motion.div>

        {/* ====================================================
              RIGHT
        ==================================================== */}

        <motion.div
          className="production-right"
          initial={{
            x: 100,
            opacity: 0,
          }}
          whileInView={{
            x: 0,
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.9,
            delay: 0.2,
            ease: "easeOut",
          }}
        >

          {/* SECTION LABEL */}

          <div
            className="production-section-label"
            style={{
              color: "var(--theme-primary)",
            }}
          >
            MUSIC PRODUCTION
          </div>

          {/* HEADING */}

          <h1
            className="production-heading"
            style={{
              color: "var(--theme-text)",
            }}
          >
            Premium Sound

            <span
              style={{
                color: "var(--theme-secondary)",
              }}
            >
              Professional Results
            </span>
          </h1>

          <div
            className="production-info"
            style={{
              backgroundColor: "var(--theme-surface)",
              borderColor: "var(--theme-border)",
              boxShadow: `
                8px 8px 18px var(--theme-shadowDark),
                -8px -8px 18px var(--theme-shadowLight)
              `,
            }}
          >

            {/* =================================================
                  DESCRIPTION
            ================================================= */}

            <p
              className="production-text"
              style={{
                color: "var(--theme-textMuted)",
              }}
            >
              Experience music the way it's meant to be heard —
              <strong
                style={{
                  color: "var(--theme-text)",
                }}
              >
                {" "}crystal clear, rich and deeply immersive.
              </strong>{" "}
              Every beat, every note and every detail is crafted
              with precision, bringing your music to life with a
              professional studio finish.
            </p>

            <p
              className="production-text"
              style={{
                color: "var(--theme-textMuted)",
              }}
            >
              We provide premium recording, music production,
              professional mixing, mastering and complete
              creative support for independent artists,
              producers and record labels.
            </p>

            {/* =================================================
                  FEATURES
            ================================================= */}

            <motion.div
              className="production-features"
              initial={{
                opacity: 0,
                y: 30,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.8,
                delay: 0.5,
              }}
            >

              {features.map((feature, index) => (
                <div
                  key={feature}
                  className="production-feature"
                  style={{
                    color:
                      index % 2 === 0
                        ? "var(--theme-primary)"
                        : "var(--theme-secondary)",

                    backgroundColor:
                      "var(--theme-surface)",

                    borderColor:
                      "var(--theme-border)",

                    boxShadow: `
                      inset 3px 3px 7px var(--theme-shadowDark),
                      inset -3px -3px 7px var(--theme-shadowLight)
                    `,
                  }}
                >
                  {feature}
                </div>
              ))}

            </motion.div>

            {/* =================================================
                  BUTTON
            ================================================= */}

            <motion.button
              className="production-btn"
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              whileInView={{
                opacity: 1,
                scale: 1,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                duration: 0.6,
                delay: 0.8,
                type: "spring",
                stiffness: 120,
              }}
              whileHover={{
                y: -3,
              }}
              whileTap={{
                scale: 0.96,
              }}
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-primary)",
                borderColor: "var(--theme-border)",
                boxShadow: `
                  8px 8px 16px var(--theme-shadowDark),
                  -8px -8px 16px var(--theme-shadowLight)
                `,
              }}
            >
              BOOK SESSION NOW
            </motion.button>

          </div>
        </motion.div>

      </div>
    </motion.section>
  );
};

export default Production;