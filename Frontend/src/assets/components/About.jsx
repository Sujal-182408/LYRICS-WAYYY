import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

const features = [
  "3D Experience",
  "Soft UI",
  "Realtime Music",
  "Future Design",
  "Immersive Player",
  "Modern Interface",
];

const profileStats = [
  { number: "10M+", label: "Streams" },
  { number: "500+", label: "Artists" },
  { number: "24/7", label: "Online" },
];

const About = () => {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMove = (event) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    setTilt({
      x: -((y / rect.height) - 0.5) * 14,
      y: ((x / rect.width) - 0.5) * 14,
    });
  };

  const resetCard = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <motion.section
      id="about"
      className="neu-about relative min-h-screen w-full overflow-hidden px-[6vw] py-20 text-[var(--theme-text)] transition-colors duration-300 md:py-24 lg:py-[110px]"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background effects */}
      <div
        aria-hidden="true"
        className="about-background-glow about-background-glow-left pointer-events-none absolute"
      />

      <div
        aria-hidden="true"
        className="about-background-glow about-background-glow-right pointer-events-none absolute"
      />

      <div className="neu-about-inner relative z-[2] mx-auto grid w-full max-w-[1380px] grid-cols-1 items-center gap-12 min-[901px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] min-[901px]:gap-[clamp(40px,7vw,120px)]">

        {/* ================================================
            LEFT — 3D PROFILE CARD
        ================================================= */}

        <motion.div
          className="neu-about-left flex w-full min-w-0 justify-center"
          initial={{ opacity: 0, x: -100, rotate: -5 }}
          whileInView={{ opacity: 1, x: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div
            ref={cardRef}
            className="profile-tilt w-full max-w-[520px]"
            onMouseMove={handleMove}
            onMouseLeave={resetCard}
            style={{
              transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            }}
          >
            <div className="profile-card relative w-full overflow-hidden rounded-[32px] border p-[clamp(16px,3vw,30px)]">
              {/* Online status */}
              <div className="profile-status relative z-10 inline-flex items-center gap-2 rounded-full px-3 py-2">
                <span className="profile-status-dot" />
                <span>ONLINE</span>
              </div>

              {/* ==========================================
                  VISUAL / ORBITS
              ========================================== */}

              <div className="profile-visual">
                <div className="circle-glow" />

                {/* Outer orbit */}
                <div className="orbit-ring orbit-ring-one">
                  <div className="orbit-rotator orbit-rotator-one">
                    <div className="orbit-pulse orbit-pulse-one">
                      <span className="orbit-dot orbit-dot-purple" />
                    </div>
                  </div>
                </div>

                {/* Inner orbit */}
                <div className="orbit-ring orbit-ring-two">
                  <div className="orbit-rotator orbit-rotator-two">
                    <div className="orbit-pulse orbit-pulse-two">
                      <span className="orbit-dot orbit-dot-cyan" />
                    </div>
                  </div>
                </div>

                {/* Floating dots */}
                <div className="floating-dot floating-dot-one" />
                <div className="floating-dot floating-dot-two" />
                <div className="floating-dot floating-dot-three" />

                {/* Profile image */}
                <div className="profile-photo-frame">
                  <div className="profile-photo-inner">
                    <img
                      src="/LW-64.webp"
                      alt="LYRICS WAYYY music platform"
                      draggable="false"
                    />
                  </div>

                  <div className="photo-highlight" />
                </div>

                {/* Logo badge */}
                <div className="profile-badge">
                  <Sparkles size={14} aria-hidden="true" />
                  <span>LW</span>
                </div>
              </div>

              {/* ==========================================
                  PROFILE INFORMATION
              ========================================== */}

              <div className="profile-bottom relative z-10 text-center">
                <p className="profile-eyebrow">
                  Music Platform
                </p>

                <h2 className="profile-heading">
                  Lyrics
                  <br />
                  <span>Wayyy</span>
                </h2>

                <div className="profile-divider" />

                <div className="profile-stats grid grid-cols-3 gap-2 sm:gap-3">
                  {profileStats.map((item) => (
                    <div
                      key={item.label}
                      className="profile-stat-card min-w-0 rounded-[14px] px-1.5 py-3"
                    >
                      <h3 className="profile-stat-num">
                        {item.number}
                      </h3>

                      <p className="profile-stat-label">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================================================
            RIGHT — ABOUT CONTENT
        ================================================= */}

        <motion.div
          className="neu-about-right w-full min-w-0"
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.9,
            delay: 0.2,
            ease: "easeOut",
          }}
        >
          {/* Section label */}
          <span className="section-label inline-flex items-center gap-2 rounded-full">
            About Us
          </span>

          {/* Main heading */}
          <h1 className="about-heading mt-5 mb-6 font-extrabold">
            Experience
            <span className="about-heading-accent block">
              Music beyond
            </span>
            Reality
          </h1>

          {/* Information card */}
          <div className="info-card w-full overflow-hidden">
            <p className="info-copy">
              At{" "}
              <strong>Lyrics Wayyy</strong>, we don't just
              build a music player.
              <br />
              <br />
              We create an immersive musical universe where
              thoughtful interfaces, fluid interactions, and
              considered technology come together to redefine
              the listening experience.
              <br />
              <br />
              Every transition, every detail, and every sound
              is crafted to make listening feel effortless
              and tactile.
            </p>

            {/* Features */}
            <div className="feature-grid mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="feature-chip flex min-h-10 items-center justify-center rounded-xl px-2.5 py-3 text-center font-bold"
                >
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              type="button"
              className="cta-btn mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-6 font-extrabold transition-all duration-300"
            >
              <span>Learn More</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default About;
