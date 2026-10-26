
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import emailjs from "@emailjs/browser";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "joy@example.com",
    href: "mailto:joy@example.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (555) 123-4567",
    href: "tel:+15551234567",
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Bihar, India",
    href: "#contact",
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const [submitStatus, setSubmitStatus] = useState({
    type: null,
    message: "",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (submitStatus.type) {
      setSubmitStatus({
        type: null,
        message: "",
      });
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLoading) return;

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!serviceId || !templateId || !publicKey) {
      setSubmitStatus({
        type: "error",
        message:
          "Email service is not configured. Please try again later.",
      });
      return;
    }

    setIsLoading(true);

    setSubmitStatus({
      type: null,
      message: "",
    });

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          message: formData.message.trim(),
        },
        {
          publicKey,
        }
      );

      setSubmitStatus({
        type: "success",
        message: "Message sent successfully!",
      });

      setFormData({
        name: "",
        email: "",
        message: "",
      });
    } catch (error) {
      console.error("Contact form submission failed:", error);

      setSubmitStatus({
        type: "error",
        message:
          error?.text ||
          "Failed to send your message. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.section
      className="contact-section"
      id="contact"
      style={{
        backgroundColor: "var(--theme-background)",
        color: "var(--theme-text)",
      }}
      initial={{ opacity: 0, y: 80 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* BACKGROUND SPOTLIGHT */}

      <div
        className="contact-spotlight"
        style={{
          background: `
            radial-gradient(
              circle,
              var(--theme-glowPrimary),
              transparent 70%
            )
          `,
        }}
      />

      <div className="contact-container">
        {/* HEADER */}

        <header className="contact-header">
          <div
            className="contact-label"
            style={{
              color: "var(--theme-primary)",
            }}
          >
            GET IN TOUCH
          </div>

          <h1 className="contact-title">
            Let's Build{" "}
            <span className="contact-title-accent">
              Something Great
            </span>
          </h1>

          <p className="contact-subtitle">
            Have a project in mind?
            <br className="contact-mobile-break" /> Let's
            discuss your ideas and create something amazing
            together.
          </p>
        </header>

        {/* MAIN GRID */}

        <div className="contact-grid">
          {/* LEFT: CONTACT FORM */}

          <motion.div
            className="contact-card contact-form-card"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <form
              className="contact-form"
              onSubmit={handleSubmit}
            >
              <div className="contact-field">
                <label htmlFor="contact-name">Name</label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  placeholder="Your Name"
                  autoComplete="name"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">Email</label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-message">
                  Message
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  placeholder="Write your message..."
                  required
                  maxLength={5000}
                  value={formData.message}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="contact-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span
                      className="contact-spinner"
                      aria-hidden="true"
                    />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send size={18} aria-hidden="true" />
                  </>
                )}
              </button>

              {submitStatus.type && (
                <div
                  className={`contact-status ${
                    submitStatus.type === "success"
                      ? "success"
                      : "error"
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  {submitStatus.type === "success" ? (
                    <CheckCircle
                      size={20}
                      aria-hidden="true"
                    />
                  ) : (
                    <AlertCircle
                      size={20}
                      aria-hidden="true"
                    />
                  )}

                  <span>{submitStatus.message}</span>
                </div>
              )}
            </form>
          </motion.div>

          {/* RIGHT: CONTACT INFORMATION */}

          <div className="contact-right">
            <motion.div
              className="contact-card"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.25 }}
            >
              <div className="contact-label">
                CONTACT INFO
              </div>

              <h2 className="contact-heading">
                Let's Connect
              </h2>

              <div className="contact-info-list">
                {contactInfo.map((item) => {
                  const Icon = item.icon;

                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="contact-info-item"
                      aria-label={`${item.label}: ${item.value}`}
                    >
                      <div className="contact-info-icon">
                        <Icon
                          size={22}
                          aria-hidden="true"
                        />
                      </div>

                      <div className="contact-info-content">
                        <h3>{item.label}</h3>
                        <p>{item.value}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </motion.div>

            {/* AVAILABILITY */}

            <motion.div
              className="contact-card"
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="contact-label contact-label-secondary">
                AVAILABLE
              </div>

              <h2 className="contact-heading">
                Open For Projects
              </h2>

              <p className="contact-description">
                I'm currently available for freelance work,
                collaborations and exciting music-related
                projects. Let's create something extraordinary
                together.
              </p>

              <div className="contact-availability">
                <span
                  className="contact-dot"
                  aria-hidden="true"
                />
                <span>Available Now</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* QUICK RESPONSE CARD */}

        <motion.div
          className="contact-card contact-highlight"
          initial={{
            opacity: 0,
            y: 50,
            scale: 0.95,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="contact-label">
            QUICK RESPONSE
          </div>

          <h2 className="contact-heading">
            Usually Replies
            <span className="contact-response-accent">
              Within 24 Hours
            </span>
          </h2>

          <p className="contact-description">
            Every message is important. Whether it's a
            collaboration, a project inquiry, or just an idea
            you'd like to discuss, I'll get back to you as
            soon as possible.
          </p>

          <div className="contact-response">
            <div className="contact-response-item">
              <div className="contact-response-number">
                24H
              </div>

              <div className="contact-response-label">
                Average Reply
              </div>
            </div>

            <div className="contact-response-item">
              <div className="contact-response-number contact-response-number-secondary">
                100%
              </div>

              <div className="contact-response-label">
                Response Rate
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* COMPLETE RESPONSIVE, THEME-AWARE CSS */}

      <style>{`
        .contact-section {
          --contact-bg: var(--theme-background);
          --contact-panel: var(--theme-surface);
          --contact-deep: var(--theme-shadowDark);
          --contact-text: var(--theme-text);
          --contact-muted: var(--theme-textMuted);
          --contact-primary: var(--theme-primary);
          --contact-secondary: var(--theme-secondary);

          --shadow-raised:
            10px 10px 20px var(--theme-shadowDark),
            -6px -6px 14px var(--theme-shadowLight);

          --shadow-raised-strong:
            14px 14px 28px var(--theme-shadowDark),
            -8px -8px 18px var(--theme-shadowLight);

          --shadow-pressed:
            inset 8px 8px 16px var(--theme-shadowDark),
            inset -6px -6px 13px var(--theme-shadowLight);

          --shadow-small:
            6px 6px 12px var(--theme-shadowDark),
            -4px -4px 9px var(--theme-shadowLight);

          --shadow-small-inset:
            inset 4px 4px 9px var(--theme-shadowDark),
            inset -3px -3px 8px var(--theme-shadowLight);

          position: relative;
          isolation: isolate;
          width: 100%;
          min-width: 0;
          overflow: hidden;
          padding: 90px 0;
          color: var(--contact-text);
        }

        .contact-section,
        .contact-section *,
        .contact-section *::before,
        .contact-section *::after {
          box-sizing: border-box;
        }

        .contact-container {
          position: relative;
          z-index: 2;
          width: min(calc(100% - 96px), 1500px);
          margin: 0 auto;
        }

        .contact-spotlight {
          position: absolute;
          top: 10%;
          left: 50%;
          width: 500px;
          height: 500px;
          transform: translateX(-50%);
          border-radius: 50%;
          filter: blur(30px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.8;
        }

        .contact-header {
          width: 100%;
          max-width: 850px;
          margin: 0 auto 55px;
          text-align: center;
        }

        .contact-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--contact-primary);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          line-height: 1.3;
          text-shadow: 0 0 12px var(--theme-glowPrimary);
        }

        .contact-label-secondary {
          color: var(--contact-secondary);
          text-shadow: 0 0 12px var(--theme-glowSecondary);
        }

        .contact-title {
          margin: 15px 0 0;
          font-size: clamp(42px, 5vw, 72px);
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -0.035em;
          color: var(--contact-text);
          text-shadow: 5px 5px 12px var(--theme-shadowDark);
          overflow-wrap: anywhere;
        }

        .contact-title-accent {
          color: var(--contact-primary);
          text-shadow: 0 0 25px var(--theme-glowPrimary);
        }

        .contact-subtitle {
          max-width: 650px;
          margin: 20px auto 0;
          color: var(--contact-muted);
          font-size: 16px;
          line-height: 1.7;
        }

        .contact-mobile-break {
          display: none;
        }

        .contact-grid {
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.9fr);
          gap: 28px;
          align-items: stretch;
        }

        .contact-card {
          position: relative;
          width: 100%;
          min-width: 0;
          padding: 30px;
          border-radius: 24px;
          background: var(--contact-panel);
          border: 1px solid var(--theme-border);
          box-shadow: var(--shadow-raised);
          overflow: hidden;
          isolation: isolate;
          transition:
            box-shadow 0.25s ease,
            border-color 0.25s ease,
            transform 0.25s ease;
        }

        .contact-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 45%;
          height: 1px;
          background: linear-gradient(
            90deg,
            var(--theme-shadowLight),
            transparent
          );
          pointer-events: none;
        }

        .contact-card::after {
          content: "";
          position: absolute;
          right: -60px;
          bottom: -60px;
          width: 140px;
          height: 140px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            var(--theme-glowPrimary),
            transparent 70%
          );
          opacity: 0.12;
          pointer-events: none;
          z-index: -1;
        }

        .contact-card:hover {
          border-color: color-mix(
            in srgb,
            var(--theme-primary) 20%,
            var(--theme-border)
          );
          box-shadow:
            13px 13px 27px var(--theme-shadowDark),
            -7px -7px 17px var(--theme-shadowLight);
        }

        .contact-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .contact-field {
          width: 100%;
          min-width: 0;
        }

        .contact-field label {
          display: block;
          margin-bottom: 9px;
          color: var(--contact-text);
          font-size: 13px;
          font-weight: 600;
        }

        .contact-field input,
        .contact-field textarea {
          display: block;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          border: 1px solid var(--theme-border);
          outline: none;
          border-radius: 14px;
          background: var(--contact-deep);
          color: var(--contact-text);
          box-shadow: var(--shadow-pressed);
          font-family: inherit;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .contact-field input {
          height: 52px;
          padding: 0 16px;
          font-size: 14px;
        }

        .contact-field textarea {
          min-height: 145px;
          padding: 14px 16px;
          resize: vertical;
          font-size: 14px;
          line-height: 1.6;
        }

        .contact-field input::placeholder,
        .contact-field textarea::placeholder {
          color: var(--contact-muted);
          opacity: 0.65;
        }

        .contact-field input:focus,
        .contact-field textarea:focus {
          border-color: var(--contact-primary);
          box-shadow:
            inset 7px 7px 14px var(--theme-shadowDark),
            inset -5px -5px 11px var(--theme-shadowLight),
            0 0 0 2px var(--theme-glowPrimary),
            0 0 18px var(--theme-glowPrimary);
        }

        .contact-btn {
          position: relative;
          width: 100%;
          min-height: 52px;
          margin-top: 2px;
          border: 1px solid var(--contact-primary);
          border-radius: 14px;
          background: var(--contact-primary);
          color: var(--theme-textDark);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 20px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow:
            7px 7px 15px var(--theme-shadowDark),
            -4px -4px 10px var(--theme-shadowLight),
            0 0 15px var(--theme-glowPrimary);
          transition:
            transform 0.2s ease,
            box-shadow 0.2s ease,
            opacity 0.2s ease,
            filter 0.2s ease;
        }

        .contact-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.04);
          box-shadow:
            9px 11px 22px var(--theme-shadowDark),
            -4px -4px 10px var(--theme-shadowLight),
            0 0 24px var(--theme-glowPrimary);
        }

        .contact-btn:active:not(:disabled) {
          transform: translateY(1px);
          box-shadow:
            inset 5px 5px 10px var(--theme-shadowDark),
            inset -3px -3px 7px var(--theme-shadowLight),
            2px 2px 5px var(--theme-shadowDark);
        }

        .contact-btn:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .contact-spinner {
          width: 17px;
          height: 17px;
          flex: 0 0 17px;
          border-radius: 50%;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: var(--theme-textDark);
          animation: contact-spin 0.7s linear infinite;
        }

        @keyframes contact-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .contact-status {
          width: 100%;
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          box-shadow: var(--shadow-small-inset);
        }

        .contact-status svg {
          flex: 0 0 20px;
        }

        .contact-status.success {
          color: var(--theme-success);
          background: color-mix(
            in srgb,
            var(--theme-success) 6%,
            transparent
          );
          border: 1px solid color-mix(
            in srgb,
            var(--theme-success) 20%,
            transparent
          );
        }

        .contact-status.error {
          color: var(--theme-danger);
          background: color-mix(
            in srgb,
            var(--theme-danger) 6%,
            transparent
          );
          border: 1px solid color-mix(
            in srgb,
            var(--theme-danger) 20%,
            transparent
          );
        }

        .contact-right {
          width: 100%;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .contact-heading {
          margin: 12px 0 0;
          color: var(--contact-text);
          font-size: clamp(24px, 2.3vw, 34px);
          line-height: 1.15;
          font-weight: 750;
          text-shadow: 3px 3px 7px var(--theme-shadowDark);
          overflow-wrap: anywhere;
        }

        .contact-info-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 25px;
        }

        .contact-info-item {
          width: 100%;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px;
          border-radius: 15px;
          text-decoration: none;
          color: inherit;
          background: var(--theme-background);
          border: 1px solid var(--theme-border);
          box-shadow: var(--shadow-small-inset);
          transition:
            transform 0.2s ease,
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        }

        .contact-info-item:hover {
          transform: translateX(4px);
          border-color: var(--contact-primary);
          box-shadow:
            inset 5px 5px 10px var(--theme-shadowDark),
            inset -4px -4px 9px var(--theme-shadowLight),
            0 0 12px var(--theme-glowPrimary);
        }

        .contact-info-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          color: var(--contact-primary);
          background: var(--theme-surface);
          border: 1px solid var(--theme-border);
          box-shadow: var(--shadow-small);
          transition: box-shadow 0.2s ease, color 0.2s ease;
        }

        .contact-info-item:hover .contact-info-icon {
          color: var(--contact-secondary);
          box-shadow:
            5px 5px 11px var(--theme-shadowDark),
            -3px -3px 8px var(--theme-shadowLight),
            0 0 15px var(--theme-glowPrimary);
        }

        .contact-info-content {
          min-width: 0;
          flex: 1;
        }

        .contact-info-content h3 {
          margin: 0 0 3px;
          color: var(--contact-muted);
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .contact-info-content p {
          margin: 0;
          color: var(--contact-text);
          font-size: 14px;
          line-height: 1.45;
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        .contact-description {
          margin: 18px 0 0;
          color: var(--contact-muted);
          font-size: 14px;
          line-height: 1.7;
        }

        .contact-availability {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-top: 22px;
          padding: 9px 13px;
          border-radius: 999px;
          background: color-mix(
            in srgb,
            var(--contact-secondary) 6%,
            transparent
          );
          border: 1px solid color-mix(
            in srgb,
            var(--contact-secondary) 20%,
            transparent
          );
          color: var(--contact-secondary);
          font-size: 12px;
          font-weight: 600;
          box-shadow: var(--shadow-small-inset);
        }

        .contact-dot {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 50%;
          background: var(--contact-secondary);
          box-shadow:
            0 0 7px var(--theme-glowSecondary),
            0 0 15px var(--theme-glowSecondary);
        }

        .contact-highlight {
          margin-top: 28px;
          text-align: center;
          padding: 38px 45px;
          box-shadow: var(--shadow-raised-strong);
        }

        .contact-highlight .contact-heading span {
          display: block;
          margin-top: 5px;
          color: var(--contact-secondary);
          text-shadow: 0 0 20px var(--theme-glowSecondary);
        }

        .contact-highlight .contact-description {
          max-width: 750px;
          margin-left: auto;
          margin-right: auto;
        }

        .contact-response {
          width: 100%;
          max-width: 650px;
          margin: 30px auto 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 15px;
        }

        .contact-response-item {
          min-width: 0;
          padding: 18px;
          border-radius: 15px;
          background: var(--theme-background);
          border: 1px solid var(--theme-border);
          box-shadow: var(--shadow-small-inset);
          transition: box-shadow 0.2s ease;
        }

        .contact-response-item:hover {
          box-shadow:
            inset 5px 5px 10px var(--theme-shadowDark),
            inset -4px -4px 9px var(--theme-shadowLight),
            0 0 15px var(--theme-glowPrimary);
        }

        .contact-response-number {
          color: var(--contact-primary);
          font-size: 26px;
          line-height: 1;
          font-weight: 800;
          text-shadow: 0 0 16px var(--theme-glowPrimary);
        }

        .contact-response-number-secondary {
          color: var(--contact-secondary);
          text-shadow: 0 0 16px var(--theme-glowSecondary);
        }

        .contact-response-label {
          margin-top: 7px;
          color: var(--contact-muted);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        /* TABLET */

        @media (max-width: 1100px) {
          .contact-container {
            width: min(calc(100% - 64px), 900px);
          }

          .contact-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
          }

          .contact-right {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            align-items: stretch;
          }

          .contact-right > .contact-card {
            height: 100%;
          }

          .contact-highlight {
            margin-top: 24px;
          }
        }

        /* TABLET AND MOBILE */

        @media (max-width: 767px) {
          .contact-section {
            padding: 65px 0;
          }

          .contact-container {
            width: calc(100% - 32px);
            max-width: 600px;
          }

          .contact-header {
            margin-bottom: 35px;
          }

          .contact-title {
            font-size: clamp(34px, 9vw, 52px);
            line-height: 1.02;
          }

          .contact-subtitle {
            font-size: 14px;
            line-height: 1.6;
            margin-top: 16px;
          }

          .contact-mobile-break {
            display: block;
          }

          .contact-grid {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .contact-right {
            grid-template-columns: minmax(0, 1fr);
            gap: 18px;
          }

          .contact-card {
            padding: 22px;
            border-radius: 20px;
            box-shadow:
              8px 8px 18px var(--theme-shadowDark),
              -5px -5px 12px var(--theme-shadowLight);
          }

          .contact-form {
            gap: 18px;
          }

          .contact-field input {
            height: 49px;
            font-size: 13px;
          }

          .contact-field textarea {
            min-height: 130px;
            font-size: 13px;
          }

          .contact-btn {
            min-height: 49px;
            font-size: 13px;
          }

          .contact-info-list {
            margin-top: 20px;
            gap: 8px;
          }

          .contact-info-item {
            padding: 11px;
            gap: 11px;
          }

          .contact-info-icon {
            width: 40px;
            height: 40px;
            flex-basis: 40px;
          }

          .contact-info-content p {
            font-size: 13px;
          }

          .contact-description {
            font-size: 13px;
            line-height: 1.65;
          }

          .contact-highlight {
            margin-top: 18px;
            padding: 25px 20px;
          }

          .contact-response {
            margin-top: 22px;
            gap: 9px;
          }

          .contact-response-item {
            padding: 15px 10px;
          }

          .contact-response-number {
            font-size: 22px;
          }

          .contact-response-label {
            font-size: 9px;
          }
        }

        /* 480px */

        @media (max-width: 480px) {
          .contact-section {
            padding: 50px 0;
          }

          .contact-container {
            width: calc(100% - 22px);
          }

          .contact-header {
            margin-bottom: 28px;
          }

          .contact-label {
            font-size: 9px;
            letter-spacing: 0.13em;
          }

          .contact-title {
            margin-top: 12px;
            font-size: clamp(30px, 9.5vw, 42px);
          }

          .contact-subtitle {
            font-size: 12px;
            line-height: 1.55;
          }

          .contact-card {
            padding: 18px;
            border-radius: 17px;
            box-shadow:
              7px 7px 15px var(--theme-shadowDark),
              -4px -4px 10px var(--theme-shadowLight);
          }

          .contact-heading {
            font-size: 23px;
          }

          .contact-field label {
            font-size: 12px;
            margin-bottom: 7px;
          }

          .contact-field input {
            height: 46px;
            padding: 0 13px;
            border-radius: 11px;
            font-size: 12px;
          }

          .contact-field textarea {
            min-height: 115px;
            padding: 12px 13px;
            border-radius: 11px;
            font-size: 12px;
          }

          .contact-btn {
            min-height: 46px;
            border-radius: 11px;
            padding: 10px 13px;
            font-size: 12px;
          }

          .contact-status {
            padding: 10px;
            font-size: 11px;
          }

          .contact-info-item {
            padding: 9px;
            border-radius: 12px;
          }

          .contact-info-icon {
            width: 36px;
            height: 36px;
            flex-basis: 36px;
            border-radius: 10px;
          }

          .contact-info-icon svg {
            width: 18px;
            height: 18px;
          }

          .contact-info-content h3 {
            font-size: 9px;
          }

          .contact-info-content p {
            font-size: 11px;
          }

          .contact-description {
            font-size: 12px;
            line-height: 1.6;
          }

          .contact-availability {
            margin-top: 17px;
            padding: 8px 10px;
            font-size: 10px;
          }

          .contact-highlight {
            padding: 22px 15px;
          }

          .contact-highlight .contact-heading {
            font-size: 21px;
          }

          .contact-response {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 7px;
          }

          .contact-response-item {
            padding: 13px 6px;
            border-radius: 11px;
          }

          .contact-response-number {
            font-size: 20px;
          }

          .contact-response-label {
            font-size: 8px;
            letter-spacing: 0.04em;
          }
        }

        /* 390px */

        @media (max-width: 390px) {
          .contact-container {
            width: calc(100% - 16px);
          }

          .contact-title {
            font-size: 30px;
          }

          .contact-subtitle {
            font-size: 11.5px;
          }

          .contact-card {
            padding: 15px;
            border-radius: 15px;
            box-shadow:
              6px 6px 13px var(--theme-shadowDark),
              -3px -3px 8px var(--theme-shadowLight);
          }

          .contact-heading {
            font-size: 21px;
          }

          .contact-info-content p {
            font-size: 10.5px;
          }

          .contact-highlight {
            padding: 20px 13px;
          }
        }

        /* 360px */

        @media (max-width: 360px) {
          .contact-section {
            padding: 42px 0;
          }

          .contact-container {
            width: calc(100% - 12px);
          }

          .contact-title {
            font-size: 27px;
            letter-spacing: -0.025em;
          }

          .contact-subtitle {
            font-size: 10.5px;
          }

          .contact-card {
            padding: 13px;
            border-radius: 13px;
            box-shadow:
              5px 5px 11px var(--theme-shadowDark),
              -3px -3px 7px var(--theme-shadowLight);
          }

          .contact-form {
            gap: 15px;
          }

          .contact-field label {
            font-size: 11px;
          }

          .contact-field input {
            height: 43px;
            font-size: 11px;
            padding: 0 11px;
          }

          .contact-field textarea {
            min-height: 105px;
            font-size: 11px;
            padding: 10px 11px;
          }

          .contact-btn {
            min-height: 43px;
            font-size: 11px;
          }

          .contact-info-icon {
            width: 33px;
            height: 33px;
            flex-basis: 33px;
          }

          .contact-info-icon svg {
            width: 16px;
            height: 16px;
          }

          .contact-info-item {
            gap: 8px;
            padding: 8px;
          }

          .contact-info-content h3 {
            font-size: 8px;
          }

          .contact-info-content p {
            font-size: 9.5px;
          }

          .contact-heading {
            font-size: 19px;
          }

          .contact-description {
            font-size: 10.5px;
          }

          .contact-response-number {
            font-size: 18px;
          }

          .contact-response-label {
            font-size: 7px;
          }
        }

        /* 320px */

        @media (max-width: 320px) {
          .contact-section {
            padding: 35px 0;
          }

          .contact-container {
            width: calc(100% - 8px);
          }

          .contact-header {
            margin-bottom: 22px;
          }

          .contact-label {
            font-size: 8px;
          }

          .contact-title {
            font-size: 25px;
            line-height: 1.02;
          }

          .contact-subtitle {
            font-size: 10px;
            line-height: 1.5;
          }

          .contact-card {
            padding: 11px;
            border-radius: 12px;
            box-shadow:
              4px 4px 9px var(--theme-shadowDark),
              -2px -2px 6px var(--theme-shadowLight);
          }

          .contact-form {
            gap: 13px;
          }

          .contact-field label {
            font-size: 10px;
            margin-bottom: 5px;
          }

          .contact-field input {
            height: 40px;
            padding: 0 9px;
            font-size: 10px;
            border-radius: 9px;
          }

          .contact-field textarea {
            min-height: 95px;
            padding: 9px;
            font-size: 10px;
            border-radius: 9px;
          }

          .contact-btn {
            min-height: 40px;
            padding: 8px;
            border-radius: 9px;
            font-size: 10px;
          }

          .contact-status {
            gap: 6px;
            padding: 8px;
            border-radius: 8px;
            font-size: 9px;
          }

          .contact-status svg {
            width: 15px;
            height: 15px;
            flex: 0 0 15px;
          }

          .contact-heading {
            font-size: 18px;
          }

          .contact-info-list {
            margin-top: 14px;
          }

          .contact-info-item {
            padding: 7px;
            gap: 7px;
            border-radius: 9px;
          }

          .contact-info-icon {
            width: 29px;
            height: 29px;
            flex-basis: 29px;
            border-radius: 8px;
          }

          .contact-info-icon svg {
            width: 14px;
            height: 14px;
          }

          .contact-info-content h3 {
            font-size: 7px;
          }

          .contact-info-content p {
            font-size: 8.5px;
          }

          .contact-description {
            font-size: 9.5px;
            line-height: 1.55;
          }

          .contact-availability {
            margin-top: 13px;
            padding: 6px 8px;
            font-size: 8px;
          }

          .contact-dot {
            width: 6px;
            height: 6px;
            flex-basis: 6px;
          }

          .contact-highlight {
            padding: 17px 10px;
          }

          .contact-highlight .contact-heading {
            font-size: 17px;
          }

          .contact-response {
            margin-top: 16px;
            gap: 5px;
          }

          .contact-response-item {
            padding: 10px 4px;
            border-radius: 8px;
          }

          .contact-response-number {
            font-size: 16px;
          }

          .contact-response-label {
            margin-top: 5px;
            font-size: 6.5px;
          }
        }

        /* TOUCH DEVICES */

        @media (hover: none) and (pointer: coarse) {
          .contact-card:hover {
            box-shadow: var(--shadow-raised);
          }

          .contact-info-item:hover {
            transform: none;
            border-color: var(--theme-border);
            box-shadow: var(--shadow-small-inset);
          }

          .contact-info-item:hover .contact-info-icon {
            color: var(--contact-primary);
            box-shadow: var(--shadow-small);
          }

          .contact-btn:hover:not(:disabled) {
            transform: none;
            filter: none;
            box-shadow:
              7px 7px 15px var(--theme-shadowDark),
              -4px -4px 10px var(--theme-shadowLight),
              0 0 15px var(--theme-glowPrimary);
          }
        }

        /* REDUCED MOTION */

        @media (prefers-reduced-motion: reduce) {
          .contact-section *,
          .contact-section *::before,
          .contact-section *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </motion.section>
  );
};

export default Contact;
