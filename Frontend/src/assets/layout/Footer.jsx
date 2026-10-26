
import { motion } from "framer-motion";
import {
  FaInstagram,
  FaYoutube,
  FaSoundcloud,
} from "react-icons/fa";

const Footer = () => {
  return (
    <footer
      className="
        relative
        w-full
        overflow-hidden
        border-t
        py-10
        px-3
      "
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
        borderColor: "var(--theme-border)",
      }}
    >
      {/* =========================================
          MAIN FOOTER
      ========================================= */}
      <div
        className="
          mx-auto
          grid
          max-w-8xl
          grid-cols-1
          gap-12
          px-6
          py-3
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {/* =========================================
            LOGO / ABOUT
        ========================================= */}
        <motion.div
          className="text-center sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        >
          <h2
            className="
              mb-3
              text-3xl
              font-semibold
              tracking-wide
            "
            style={{
              color: "var(--theme-text)",
            }}
          >
            LYRICS
            <span
              className="ml-2"
              style={{
                color: "var(--theme-secondary)",
                textShadow:
                  "0 0 18px var(--theme-glowSecondary)",
              }}
            >
              WAYYY
            </span>
          </h2>

          <p
            className="
              max-w-sm
              text-sm
              leading-6
            "
            style={{
              color: "var(--theme-textMuted)",
            }}
          >
            Creating high-quality music experiences with
            powerful sound and modern design.
          </p>
        </motion.div>

        {/* =========================================
            QUICK LINKS
        ========================================= */}
        <motion.div
          className="text-center sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
            delay: 0.05,
            ease: "easeOut",
          }}
        >
          <h3
            className="mb-3 font-medium"
            style={{
              color: "var(--theme-text)",
            }}
          >
            Quick Links
          </h3>

          <ul
            className="
              space-y-2
              text-sm
            "
            style={{
              color: "var(--theme-textMuted)",
            }}
          >
            <li>
              <a
                href="/"
                className="
                  inline-block
                  transition-colors
                  duration-300
                  hover:text-[var(--theme-secondary)]
                "
                style={{
                  color: "var(--theme-textMuted)",
                }}
              >
                Home
              </a>
            </li>

            <li>
              <a
                href="/about"
                className="
                  inline-block
                  transition-colors
                  duration-300
                  hover:text-[var(--theme-secondary)]
                "
                style={{
                  color: "var(--theme-textMuted)",
                }}
              >
                About
              </a>
            </li>

            <li>
              <a
                href="/service"
                className="
                  inline-block
                  transition-colors
                  duration-300
                  hover:text-[var(--theme-secondary)]
                "
                style={{
                  color: "var(--theme-textMuted)",
                }}
              >
                Services
              </a>
            </li>

            <li>
              <a
                href="/contact"
                className="
                  inline-block
                  transition-colors
                  duration-300
                  hover:text-[var(--theme-secondary)]
                "
                style={{
                  color: "var(--theme-textMuted)",
                }}
              >
                Contact
              </a>
            </li>
          </ul>
        </motion.div>

        {/* =========================================
            SERVICES
        ========================================= */}
        <motion.div
          className="text-center sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
            delay: 0.1,
            ease: "easeOut",
          }}
        >
          <h3
            className="mb-3 font-medium"
            style={{
              color: "var(--theme-text)",
            }}
          >
            Services
          </h3>

          <ul
            className="
              space-y-2
              text-sm
            "
            style={{
              color: "var(--theme-textMuted)",
            }}
          >
            <li>Music Production</li>
            <li>Mixing &amp; Mastering</li>
            <li>Live Sound</li>
            <li>Studio Recording</li>
          </ul>
        </motion.div>

        {/* =========================================
            SOCIAL
        ========================================= */}
        <motion.div
          className="text-center sm:text-left"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.5,
            delay: 0.15,
            ease: "easeOut",
          }}
        >
          <h3
            className="mb-4 font-medium"
            style={{
              color: "var(--theme-text)",
            }}
          >
            Follow Us
          </h3>

          <ul
            className="
              flex
              min-h-10
              items-center
              justify-center
              gap-6
              sm:justify-start
            "
          >
            {/* SoundCloud */}
            <li className="flex h-10 w-10 items-center justify-center">
              <a
                href="https://on.soundcloud.com/KIMCEl5k8ohdrrD3YM"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SoundCloud"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  transition-transform
                  duration-300
                  hover:scale-110
                "
              >
                <FaSoundcloud
                  size={30}
                  aria-hidden="true"
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                  className="
                    transition-colors
                    duration-300
                    hover:text-[var(--theme-primary)]
                  "
                />
              </a>
            </li>

            {/* Instagram */}
            <li className="flex h-10 w-10 items-center justify-center">
              <a
                href="https://www.instagram.com/lyrics_wayyy"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  transition-transform
                  duration-300
                  hover:scale-110
                "
              >
                <FaInstagram
                  size={29}
                  aria-hidden="true"
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                  className="
                    transition-colors
                    duration-300
                    hover:text-[var(--theme-secondary)]
                  "
                />
              </a>
            </li>

            {/* YouTube */}
            <li className="flex h-10 w-10 items-center justify-center">
              <a
                href="https://www.youtube.com/@LYRICS_WAYYY"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  transition-transform
                  duration-300
                  hover:scale-110
                "
              >
                <FaYoutube
                  size={30}
                  aria-hidden="true"
                  style={{
                    color: "var(--theme-textMuted)",
                  }}
                  className="
                    transition-colors
                    duration-300
                    hover:text-[var(--theme-primary)]
                  "
                />
              </a>
            </li>
          </ul>
        </motion.div>
      </div>

      {/* =========================================
          BOTTOM BAR
      ========================================= */}
      <div
        className="
          mt-10
          border-t
          px-4
          pb-2
          pt-4
          text-center
          text-xs
        "
        style={{
          borderColor: "var(--theme-border)",
          color: "var(--theme-textMuted)",
        }}
      >
        © 2026 LYRICS WAYYY. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
