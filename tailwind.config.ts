import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Limelight", "cursive"],
        body: ["Merriweather Sans", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Premium cigar lounge colors
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        charcoal: {
          DEFAULT: "hsl(var(--charcoal))",
          deep: "hsl(var(--charcoal-deep))",
          light: "hsl(var(--charcoal-light))",
        },
        espresso: "hsl(var(--espresso))",
        leather: "hsl(var(--leather))",
        walnut: "hsl(var(--walnut))",
        smoke: "hsl(var(--smoke))",
        ash: "hsl(var(--ash))",
        match: {
          active: "hsl(var(--match-active))",
          inactive: "hsl(var(--match-inactive))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        gold: "var(--shadow-gold)",
        glow: "var(--shadow-glow)",
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "smoke-drift": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(0) translateX(0) scale(1)" 
          },
          "20%": { 
            opacity: "0.3" 
          },
          "80%": { 
            opacity: "0.15" 
          },
          "100%": { 
            opacity: "0", 
            transform: "translateY(-60px) translateX(20px) scale(1.5)" 
          },
        },
        "smoke-drift-alt": {
          "0%": { 
            opacity: "0", 
            transform: "translateY(0) translateX(0) scale(1)" 
          },
          "25%": { 
            opacity: "0.25" 
          },
          "75%": { 
            opacity: "0.1" 
          },
          "100%": { 
            opacity: "0", 
            transform: "translateY(-50px) translateX(-15px) scale(1.3)" 
          },
        },
        "pulse-subtle": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "smoke-drift": "smoke-drift 5s ease-out infinite",
        "smoke-drift-alt": "smoke-drift-alt 6s ease-out infinite",
        "pulse-subtle": "pulse-subtle 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
