import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ─── Clinical Curator Color System ─── */
      colors: {
        // Surface hierarchy (nocturnal navy layers)
        surface: {
          DEFAULT: "#061423",
          "container-lowest": "#0a1520",
          "container-low": "#0f1c2c",
          container: "#132030",
          "container-high": "#1e2b3b",
          "container-highest": "#283848",
          variant: "rgba(15, 28, 44, 0.60)",
        },
        // Primary (Electric Teal)
        primary: {
          DEFAULT: "#42dec3",
          container: "#00c2a8",
          on: "#00382f",
          "on-container": "#a8f5e6",
        },
        // Secondary
        secondary: {
          DEFAULT: "#b0ccc2",
          container: "#1a3a32",
          on: "#1d352c",
          "on-container": "#cce8de",
        },
        // Tertiary (warm accent)
        tertiary: {
          DEFAULT: "#a6ccdc",
          container: "#1e3a4a",
          on: "#0a3040",
          "on-container": "#c2e4f2",
        },
        // On-surface text
        "on-surface": {
          DEFAULT: "#e1e3df",
          variant: "#bbcac4",
        },
        // Outline
        outline: {
          DEFAULT: "#89938e",
          variant: "rgba(60, 74, 70, 0.20)",
        },
        // Error / Medical restriction (RED)
        error: {
          DEFAULT: "#ffb4ab",
          container: "#93000a",
          on: "#690005",
          "on-container": "#ffdad6",
        },
        // Warning / Clinical attention (YELLOW)
        warning: {
          DEFAULT: "#f5c344",
          container: "#4a3800",
          on: "#2d2100",
          "on-container": "#ffe08a",
        },
        // Success / Cleared
        success: {
          DEFAULT: "#7cdb94",
          container: "#005221",
          on: "#003314",
          "on-container": "#a5f5b2",
        },
      },

      /* ─── Typography: Editorial Tripartite System ─── */
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "sans-serif"],
        body: ['"Inter"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        // Display scale
        "display-lg": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-md": ["2.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-sm": ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "700" }],
        // Headline scale
        "headline-lg": ["2rem", { lineHeight: "1.25", letterSpacing: "-0.01em", fontWeight: "700" }],
        "headline-md": ["1.75rem", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-sm": ["1.5rem", { lineHeight: "1.35", fontWeight: "600" }],
        // Title scale
        "title-lg": ["1.375rem", { lineHeight: "1.4", fontWeight: "600" }],
        "title-md": ["1rem", { lineHeight: "1.5", fontWeight: "600", letterSpacing: "0.01em" }],
        "title-sm": ["0.875rem", { lineHeight: "1.45", fontWeight: "600", letterSpacing: "0.01em" }],
        // Body scale
        "body-lg": ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        "body-md": ["0.875rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["0.75rem", { lineHeight: "1.5", fontWeight: "400" }],
        // Label scale
        "label-lg": ["0.875rem", { lineHeight: "1.45", fontWeight: "500", letterSpacing: "0.02em" }],
        "label-md": ["0.75rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.04em" }],
        "label-sm": ["0.6875rem", { lineHeight: "1.35", fontWeight: "500", letterSpacing: "0.06em" }],
      },

      /* ─── Spacing ─── */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },

      /* ─── Border Radius ─── */
      borderRadius: {
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },

      /* ─── Ambient Shadows (tinted, not pure black) ─── */
      boxShadow: {
        ambient: "0 8px 32px rgba(6, 20, 35, 0.06)",
        "ambient-md": "0 12px 40px rgba(6, 20, 35, 0.10)",
        "ambient-lg": "0 20px 60px rgba(6, 20, 35, 0.15)",
        glass: "0 4px 30px rgba(6, 20, 35, 0.10)",
      },

      /* ─── Backdrop Blur for Glassmorphism ─── */
      backdropBlur: {
        glass: "20px",
      },

      /* ─── Animations ─── */
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-teal": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(66, 222, 195, 0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(66, 222, 195, 0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "pulse-teal": "pulse-teal 2s ease-in-out infinite",
      },

      /* ─── Background Gradients ─── */
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #42dec3 0%, #00c2a8 100%)",
        "gradient-surface": "linear-gradient(180deg, #0f1c2c 0%, #061423 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
