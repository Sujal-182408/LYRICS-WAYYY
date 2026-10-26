import { useRef, useState } from "react";
import { Play, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

const floatingAlbums = [
  {
    image: "/albums/starboy-256.webp",
    title: "Starboy",
    artist: "The Weeknd",
  },
  {
    image: "/albums/afterdark-256.webp",
    title: "After Dark",
    artist: "Mr.Kitty",
  },
  {
    image: "/albums/blindinglights-256.webp",
    title: "Blinding Lights",
    artist: "The Weeknd",
  },
];



const orbitPositions = [
  {
    top: "6%",
    left: "-6%",
    rotate: -8,
    delay: 0,
  },
  {
    top: "60%",
    left: "-12%",
    rotate: 6,
    delay: 1.4,
  },
  {
    top: "76%",
    left: "80%",
    rotate: -5,
    delay: 2.8,
  },
];

const grooveInsets = [22, 48, 74, 100, 126];

function Hero() {
  const navigate = useNavigate();
  const heroRef = useRef(null);

  const [tilt, setTilt] = useState({
    x: 0,
    y: 0,
  });

  const [spot, setSpot] = useState({
    x: 50,
    y: 40,
  });

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;

    const rect = heroRef.current.getBoundingClientRect();

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    const offsetX = (px - 0.5) * 2;
    const offsetY = (py - 0.5) * 2;

    setTilt({
      x: offsetX * 8,
      y: offsetY * -8,
    });

    setSpot({
      x: px * 100,
      y: py * 100,
    });
  };

  const resetTilt = () => {
    setTilt({
      x: 0,
      y: 0,
    });

    setSpot({
      x: 50,
      y: 40,
    });
  };

  return (
    <section
      id="/home"
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      className="neu-hero"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
    >
      <div className="neu-hero-inner">
        {/* =====================================================
            LEFT SIDE
        ====================================================== */}

        <div className="neu-hero-left">
          <span
            className="neu-badge"
            style={{
              color: "var(--theme-primary)",
              borderColor: "var(--theme-border)",
              backgroundColor: "var(--theme-surface)",
              boxShadow: `
                5px 5px 10px var(--theme-shadowDark),
                -5px -5px 10px var(--theme-shadowLight)
              `,
            }}
          >
            <span
              className="neu-badge-dot"
              style={{
                backgroundColor: "var(--theme-secondary)",
                boxShadow: "0 0 10px var(--theme-glowSecondary)",
              }}
            />

            LYRICS WAYYY
          </span>

          <h1
            className="neu-hero-heading"
            style={{
              color: "var(--theme-text)",
            }}
          >
            Music without
            <br />

            <span
              style={{
                color: "var(--theme-primary)",
              }}
            >
              limits
            </span>
          </h1>

          <p
            className="neu-hero-copy"
            style={{
              color: "var(--theme-textMuted)",
            }}
          >
            Immerse yourself in millions of songs, handcrafted playlists, and a
            calm, tactile listening experience built for every mood.
          </p>

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="neu-hero-actions">
            <button
              className="neu-cta-primary"
              onClick={() => navigate("/collections")}
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-surface)",
                borderColor: "var(--theme-border)",
                boxShadow: `
                  6px 6px 12px var(--theme-shadowDark),
                  -5px -5px 11px var(--theme-shadowLight)
                `,
              }}
            >
              <Compass size={18} />

              <span>Explore collections</span>
            </button>

            <button
              className="neu-cta-secondary"
              onClick={() => navigate("/gallery")}
              style={{
                backgroundColor: "var(--theme-surface)",
                color: "var(--theme-secondary)",
                borderColor: "var(--theme-border)",
                boxShadow: `
                  6px 6px 12px var(--theme-shadowDark),
                  -5px -5px 11px var(--theme-shadowLight)
                `,
              }}
            >
              <Play size={18} />

              <span>Listen now</span>
            </button>
          </div>
        </div>

        {/* =====================================================
            RIGHT SIDE
        ====================================================== */}

        <div className="neu-hero-right">
          <div
            className="vinyl-stage"
            style={{
              "--hero-primary": "var(--theme-primary)",
              "--hero-secondary": "var(--theme-secondary)",
              "--hero-surface": "var(--theme-surface)",
              "--hero-background": "var(--theme-background)",
            }}
          >
            {/* =================================================
                FLOATING ALBUM CARDS
            ================================================= */}

            {floatingAlbums.map((album, i) => {
              const pos = orbitPositions[i];

              return (
                <div
                  key={album.title}
                  className="album-card"
                  style={{
                    top: pos.top,
                    left: pos.left,

                    "--rot": `${pos.rotate}deg`,

                    animationDelay: `${pos.delay}s`,

                    backgroundColor: "var(--theme-surface)",

                    borderColor: "var(--theme-border)",

                    boxShadow: `
                      7px 7px 15px var(--theme-shadowDark),
                      -6px -6px 13px var(--theme-shadowLight)
                    `,
                  }}
                >
                  <img
                    src={album.image}
                    alt={`${album.title} by ${album.artist}`}
                    width="108"
                    height="108"
                    loading="eager"
                    decoding="async"
                  />

                  <div
                    className="album-card-info"
                    style={{
                      backgroundColor: "var(--theme-surface)",
                    }}
                  >
                    <p
                      className="album-card-title"
                      style={{
                        color: "var(--theme-text)",
                      }}
                    >
                      {album.title}
                    </p>

                    <p
                      className="album-card-artist"
                      style={{
                        color: "var(--theme-textMuted)",
                      }}
                    >
                      {album.artist}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* =================================================
                VINYL TILT WRAPPER
            ================================================= */}

            <div
              className="vinyl-tilt"
              style={{
                transform: `
                  rotateX(${tilt.y}deg)
                  rotateY(${tilt.x}deg)
                `,
              }}
            >
              {/* =================================================
                  VINYL DISC
              ================================================= */}

              <div
                className="vinyl-disc"
                style={{
                  backgroundColor: "var(--theme-surface)",
                  borderColor: "var(--theme-border)",

                  boxShadow: `
                    10px 10px 20px var(--theme-shadowDark),
                    -8px -8px 18px var(--theme-shadowLight)
                  `,
                }}
              >
                {/* =================================================
                    VINYL GROOVE RINGS
                ================================================= */}

                {grooveInsets.map((inset) => (
                  <div
                    key={inset}
                    className="groove"
                    style={{
                      inset: `${inset}px`,
                      borderColor: "var(--theme-border)",
                    }}
                  />
                ))}

                {/* =================================================
                    VINYL CENTER EMBLEM
                ================================================= */}

                <div
                  className="vinyl-emblem"
                  style={{
                    backgroundColor: "var(--theme-surface)",

                    boxShadow: `
                      6px 6px 12px var(--theme-shadowDark),
                      -5px -5px 10px var(--theme-shadowLight)
                    `,
                  }}
                >
                  <div
                    className="vinyl-emblem-core"
                    style={{
                      backgroundColor: "var(--theme-background)",

                      border: "1px solid var(--theme-border)",

                      boxShadow: `
                        inset 4px 4px 8px var(--theme-shadowDark),
                        inset -4px -4px 8px var(--theme-shadowLight)
                      `,
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
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================
              HERO EQUALIZER
          ====================================================== */}

          <div
            className="neu-eq"
            style={{
              "--eq-primary": "var(--theme-primary)",
              "--eq-secondary": "var(--theme-secondary)",
            }}
          >
            {[16, 30, 22, 36, 18, 28].map((h, index) => (
              <span
                key={index}
                style={{
                  height: `${h}px`,

                  animationDuration: `${1 + index * 0.2}s`,

                  backgroundColor:
                    index % 2 === 0
                      ? "var(--theme-primary)"
                      : "var(--theme-secondary)",

                  boxShadow:
                    index % 2 === 0
                      ? "0 0 8px var(--theme-glowPrimary)"
                      : "0 0 8px var(--theme-glowSecondary)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;