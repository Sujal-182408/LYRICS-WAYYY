import { useEffect, useRef, useState } from "react";

function WaveScrollbar() {
  const [scroll, setScroll] = useState(0);

  const targetScroll = useRef(0);
  const currentScroll = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      targetScroll.current =
        maxScroll > 0
          ? (window.scrollY / maxScroll) * 100
          : 0;
    };

    const animate = () => {
      currentScroll.current +=
        (targetScroll.current - currentScroll.current) * 0.12;

      setScroll(currentScroll.current);

      requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll);

    const animation = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animation);
    };
  }, []);

  return (
    <div
      className="wave-scrollbar"
      style={{ top: `${scroll}%` }}
    />
  );
}

export default WaveScrollbar;