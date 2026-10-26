import React from "react";
import { motion } from "framer-motion";
import {
  Mic,
  SlidersHorizontal,
  Disc3,
  Video,
  KeyboardMusic,
} from "lucide-react";

/* ============================================================
   THEME-AWARE NEUMORPHIC TOKENS
   ============================================================ */

const BASE = "var(--theme-background)";
const LIGHT = "var(--theme-shadow-light)";
const DARK = "var(--theme-shadow-dark)";

const raised =
  "shadow-[8px_8px_16px_var(--theme-shadow-dark),-8px_-8px_16px_var(--theme-shadow-light)]";

const raisedLg =
  "shadow-[12px_12px_28px_var(--theme-shadow-dark),-12px_-12px_28px_var(--theme-shadow-light)]";

const pressed =
  "shadow-[inset_6px_6px_12px_var(--theme-shadow-dark),inset_-6px_-6px_12px_var(--theme-shadow-light)]";

const pressedSm =
  "shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]";

const Service = () => {
  const services = [
    {
      icon: Mic,
      title: "Recording",
      desc: "Professional studio recording with crystal clear sound quality.",
    },
    {
      icon: SlidersHorizontal,
      title: "Mixing",
      desc: "Balanced and polished mixes ready for every platform.",
    },
    {
      icon: Disc3,
      title: "Mastering",
      desc: "Streaming-ready mastering with powerful dynamics.",
    },
    {
      icon: Video,
      title: "Music Video",
      desc: "Creative visuals that match your music identity.",
    },
    {
      icon: KeyboardMusic,
      title: "Production",
      desc: "Complete music production from idea to final track.",
    },
  ];

  const plans = [
    {
      title: "Recording",
      price: "$150",
      desc: "Studio Recording",
    },
    {
      title: "Mixing",
      price: "$250",
      desc: "Professional Mix",
    },
    {
      title: "Mastering",
      price: "$210",
      desc: "Streaming Ready",
    },
    {
      title: "Complete",
      price: "$320",
      desc: "Release Package",
    },
  ];

  const stats = [
    ["10M+", "Streams"],
    ["500+", "Artists"],
    ["98%", "Client Satisfaction"],
    ["24/7", "Support"],
  ];

  return (
    <section
      id="service"
      className="
        relative
        min-h-screen
        overflow-hidden
        px-4
        py-10
        text-white
        sm:px-6
        sm:py-12
        md:px-8
        lg:px-12
        xl:px-16
      "
      style={{ backgroundColor: BASE }}
    >
      <div className="relative mx-auto w-full max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="mx-auto w-full max-w-3xl text-center"
        >
          <h1
            className="
              text-3xl
              font-black
              leading-tight
              sm:text-4xl
              md:text-5xl
              lg:text-6xl
            "
          >
            Create{" "}
            <span style={{ color: "var(--theme-secondary)" }}>
              Legendary
            </span>{" "}
            Sound
          </h1>

          <p
            className="
              mx-auto
              mt-4
              max-w-2xl
              px-2
              text-sm
              leading-relaxed
              sm:text-base
              md:text-lg
            "
            style={{ color: "var(--theme-text-muted)" }}
          >
            Professional music production services designed for artists who
            want premium sound.
          </p>
        </motion.div>

        {/* =====================================================
            SERVICE CARDS
        ===================================================== */}
        <div
          className="
            mt-10
            grid
            grid-cols-1
            gap-5
            sm:mt-12
            sm:grid-cols-2
            sm:gap-6
            lg:grid-cols-3
            xl:grid-cols-5
          "
        >
          {services.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                }}
                whileHover={{
                  y: -6,
                }}
                className={`
                  relative
                  min-w-0
                  rounded-[24px]
                  p-5
                  transition-shadow
                  duration-300
                  sm:rounded-[28px]
                  sm:p-6
                  ${raised}
                `}
                style={{ backgroundColor: BASE }}
              >
                {/* ICON */}
                <div
                  className={`
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    sm:h-14
                    sm:w-14
                    ${pressedSm}
                  `}
                >
                  <Icon
                    size={22}
                    className="sm:h-6 sm:w-6"
                    style={{
                      color: "var(--theme-secondary)",
                    }}
                  />
                </div>

                {/* TITLE */}
                <h3
                  className="
                    mt-5
                    text-lg
                    font-bold
                    sm:text-xl
                  "
                  style={{
                    color: "var(--theme-text)",
                  }}
                >
                  {item.title}
                </h3>

                {/* DESCRIPTION */}
                <p
                  className="
                    mt-3
                    text-sm
                    leading-6
                    sm:text-sm
                  "
                  style={{
                    color: "var(--theme-text-muted)",
                  }}
                >
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* =====================================================
            PREMIUM PLAYER VISUAL
        ===================================================== */}
        <div
          className="
            relative
            mt-16
            flex
            justify-center
            sm:mt-20
            md:mt-24
          "
        >
          
          <div
            className="
              relative
              flex
              h-52
              w-52
              items-center
              justify-center
              sm:h-64
              sm:w-64
              md:h-72
              md:w-72
            "
          >
{[1, 2, 3, 4, 5].map((wave) => (
  <motion.div
    key={wave}

animate={{
  scale: [1, 1.25, 1.55],
  opacity: [0, 0.2, 0],
}}
transition={{
  repeat: Infinity,
  duration: 3,
  delay: (wave - 1) * 0.6,
  ease: "easeOut",
  repeatType: "loop",
}}

    className="
      pointer-events-none
      absolute
      left-1/2
      top-1/2
      h-52
      w-52
      -translate-x-1/2
      -translate-y-1/2
      rounded-full
      sm:h-64
      sm:w-64
      md:h-72
      md:w-72
      transition-[border-color,box-shadow]
      duration-500
    "
    style={{
      border: "1px solid color-mix(in srgb, var(--theme-secondary) 75%, transparent)",
      boxShadow:
        "0 0 14px var(--theme-secondary, #8c7cf7), 0 0 28px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 45%, transparent), inset 0 0 8px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 35%, transparent)",
      transition: "border-color 500ms ease, box-shadow 500ms ease",
    }}
  />
))}


            {/* OUTER CONSOLE RING */}
            <div
              className="absolute inset-0 rounded-full transition-[background-color,box-shadow] duration-500"
              style={{
                backgroundColor: BASE,
                boxShadow: "12px 12px 28px var(--theme-shadow-dark, rgba(0,0,0,.45)), -12px -12px 28px var(--theme-shadow-light, rgba(255,255,255,.10)), 0 0 20px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 22%, transparent)",
                transition: "background-color 500ms ease, box-shadow 500ms ease",
              }}
            />

            {/* ROTATING GROOVE */}
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                repeat: Infinity,
                duration: 12,
                ease: "linear",
              }}
              className="
                absolute
                inset-5
                rounded-full
                sm:inset-7
                md:inset-8
              "
              style={{
                transition: "background-color 500ms ease",
              }}
            >
              <div
                className="absolute inset-0 rounded-full transition-[box-shadow] duration-500"
                style={{
                  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 65%, transparent), inset 0 0 14px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 16%, transparent)",
                }}
              />

              {/* TOP MARKER */}
              <div
                className="
                  absolute
                  left-1/2
                  top-0
                  h-2.5
                  w-2.5
                  -translate-x-1/2
                  rounded-full
                  sm:h-3
                  sm:w-3
                "
                style={{
                  backgroundColor: "var(--theme-secondary)",
                  boxShadow:
                    "0 0 10px var(--theme-secondary, #8c7cf7), 0 0 18px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 55%, transparent)",
                  transition: "background-color 500ms ease, box-shadow 500ms ease",
                }}
              />

              {/* RIGHT MARKER */}
              <div
                className="
                  absolute
                  right-0
                  top-1/2
                  h-1.5
                  w-1.5
                  -translate-y-1/2
                  rounded-full
                  sm:h-2
                  sm:w-2
                "
                style={{
                  backgroundColor: "var(--theme-secondary)",
                  opacity: 0.6,
                  transition: "background-color 500ms ease",
                }}
              />

              {/* LEFT MARKER */}
              <div
                className="
                  absolute
                  left-0
                  top-1/2
                  h-1.5
                  w-1.5
                  -translate-y-1/2
                  rounded-full
                  sm:h-2
                  sm:w-2
                "
                style={{
                  backgroundColor: "var(--theme-secondary)",
                  opacity: 0.4,
                  transition: "background-color 500ms ease",
                }}
              />
            </motion.div>

            {/* PRESSED TRACK */}
            <div
              className="
                absolute
                inset-5
                rounded-full
                sm:inset-7
                md:inset-8
              "
              style={{
                boxShadow:
                  "inset 6px 6px 12px var(--theme-shadow-dark, rgba(0,0,0,.45)), inset -6px -6px 12px var(--theme-shadow-light, rgba(255,255,255,.10)), inset 0 0 12px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 18%, transparent)",
                transition: "box-shadow 500ms ease",
              }}
                />

            {/* CENTER DIAL */}
            <div
              className={`
                relative
                z-10
                flex
                h-28
                w-28
                items-center
                justify-center
                rounded-full
                sm:h-36
                sm:w-36
                md:h-44
                md:w-44
                ${raised}
                transition-[background-color,box-shadow]
                duration-500
                `}
              style={{
                backgroundColor: BASE,
                boxShadow: "8px 8px 16px var(--theme-shadow-dark, rgba(0,0,0,.45)), -8px -8px 16px var(--theme-shadow-light, rgba(255,255,255,.10)), 0 0 18px color-mix(in srgb, var(--theme-secondary, #8c7cf7) 24%, transparent)",
                transition: "background-color 500ms ease, box-shadow 500ms ease",
              }}
            >
              <Mic
                size={36}
                className="sm:h-11 sm:w-11"
                style={{
                  color: "var(--theme-secondary)",
                  filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--theme-secondary) 85%, transparent))",
                  transition: "color 500ms ease, filter 500ms ease",
                }}
                />
            </div>
          </div>
        </div>

        {/* =====================================================
            SOUND WAVES
        ===================================================== */}
       
        {/* =====================================================
            PREMIUM PLANS
        ===================================================== */}
        <motion.div
          initial={{
            opacity: 0,
            y: 60,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
            amount: 0.1,
          }}
          transition={{
            duration: 0.9,
          }}
          className="
            relative
            mt-16
            sm:mt-24
            md:mt-28
            lg:mt-32
          "
        >
          <h2
            className="
              text-center
              text-2xl
              font-black
              sm:text-3xl
              md:text-4xl
            "
            style={{
              color: "var(--theme-text)",
            }}
          >
            PREMIUM{" "}
            <span
              style={{
                color: "var(--theme-secondary)",
              }}
            >
              PLANS
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-4
              max-w-xl
              px-3
              text-center
              text-sm
              leading-relaxed
              sm:mt-5
              sm:max-w-2xl
              sm:text-base
            "
            style={{
              color: "var(--theme-text-muted)",
            }}
          >
            Choose the package that perfectly matches your music journey.
          </p>

          {/* PLANS GRID */}
          <div
            className="
              mt-8
              grid
              grid-cols-1
              gap-5
              sm:mt-12
              sm:grid-cols-2
              sm:gap-6
              lg:mt-16
              lg:grid-cols-4
              lg:gap-8
            "
          >
            {plans.map((plan, i) => (
              <motion.div
                key={plan.title}
                whileHover={{
                  y: -8,
                }}
                className={`
                  relative
                  min-w-0
                  rounded-[26px]
                  p-5
                  transition-shadow
                  duration-300
                  sm:rounded-[30px]
                  sm:p-7
                  lg:p-8
                  ${raised}
                `}
                style={{
                  backgroundColor: BASE,
                }}
              >
                <h3
                  className="
                    text-lg
                    font-bold
                    sm:text-xl
                  "
                  style={{
                    color: "var(--theme-text)",
                  }}
                >
                  {plan.title}
                </h3>

                <h1
                  className="
                    mt-5
                    text-4xl
                    font-black
                    sm:mt-6
                    sm:text-5xl
                  "
                  style={{
                    color: "var(--theme-secondary)",
                  }}
                >
                  {plan.price}
                </h1>

                <p
                  className="mt-2 text-sm sm:text-base"
                  style={{
                    color: "var(--theme-text-muted)",
                  }}
                >
                  {plan.desc}
                </p>

                <button
                  type="button"
                  className={`
                    mt-6
                    min-h-11
                    w-full
                    rounded-full
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    sm:py-3.5
                    sm:text-base
                    ${raised}
                    transition-shadow
                    duration-150
                    active:shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]
                  `}
                  style={{
                    backgroundColor: BASE,
                    color: "var(--theme-secondary)",
                  }}
                >
                  Choose Plan
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* =====================================================
            STATS
        ===================================================== */}
        <div
          className="
            mt-12
            grid
            grid-cols-2
            gap-4
            sm:mt-20
            sm:gap-6
            lg:mt-28
            lg:grid-cols-4
            lg:gap-8
          "
        >
          {stats.map(([number, label]) => (
            <motion.div
              key={label}
              whileHover={{
                y: -6,
              }}
              className={`
                min-w-0
                rounded-3xl
                px-2
                py-5
                text-center
                sm:p-7
                lg:p-8
                ${pressed}
              `}
            >
              <h1
                className="
                  text-2xl
                  font-black
                  sm:text-4xl
                  md:text-5xl
                "
                style={{
                  color: "var(--theme-secondary)",
                }}
              >
                {number}
              </h1>

              <p
                className="
                  mt-2
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  sm:text-xs
                  sm:tracking-widest
                  md:text-sm
                "
                style={{
                  color: "var(--theme-text-muted)",
                }}
              >
                {label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* =====================================================
            FOOTER CTA
        ===================================================== */}
        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          className={`
            mt-12
            rounded-[28px]
            px-5
            py-8
            text-center
            sm:mt-24
            sm:rounded-[36px]
            sm:px-8
            sm:py-12
            md:mt-28
            md:rounded-[40px]
            md:px-10
            md:py-14
            ${raisedLg}
          `}
        >
          <h2
            className="
              text-xl
              font-black
              sm:text-2xl
              md:text-3xl
            "
            style={{
              color: "var(--theme-text)",
            }}
          >
            Let's Create Your{" "}
            <span
              style={{
                color: "var(--theme-secondary)",
              }}
            >
              Next Hit
            </span>
          </h2>

          <p
            className="
              mx-auto
              mt-3
              max-w-2xl
              text-sm
              leading-6
              sm:mt-4
              sm:text-base
              sm:leading-7
            "
            style={{
              color: "var(--theme-text-muted)",
            }}
          >
            Your vision deserves world-class production. Start your journey
            today and transform your ideas into unforgettable music.
          </p>

          <motion.button
            type="button"
            whileHover={{
              y: -2,
            }}
            whileTap={{
              scale: 0.98,
            }}
            className={`
              mt-6
              min-h-11
              rounded-full
              px-7
              py-2.5
              text-sm
              font-semibold
              sm:px-10
              sm:py-4
              sm:text-base
              ${raised}
              transition-shadow
              duration-150
              active:shadow-[inset_4px_4px_8px_var(--theme-shadow-dark),inset_-4px_-4px_8px_var(--theme-shadow-light)]
            `}
            style={{
              backgroundColor: BASE,
              color: "var(--theme-secondary)",
            }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default Service;