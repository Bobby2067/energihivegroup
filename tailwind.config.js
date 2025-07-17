/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
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
        // Australian-themed colors
        eucalyptus: {
          50: "#f2f9f4",
          100: "#e4f3e8",
          200: "#c9e7d1",
          300: "#a3d4b0",
          400: "#75b986",
          500: "#4d9c62",
          600: "#3a7f4d",
          700: "#306641",
          800: "#295237",
          900: "#23442f",
          950: "#0f261a",
        },
        outback: {
          50: "#fff8ed",
          100: "#ffefd6",
          200: "#ffdcac",
          300: "#ffc376",
          400: "#ffa13d",
          500: "#ff8106",
          600: "#e86902",
          700: "#c14e05",
          800: "#9a3d0c",
          900: "#7e330f",
          950: "#441805",
        },
        reef: {
          50: "#edfcff",
          100: "#d6f7ff",
          200: "#b5f0ff",
          300: "#83e7ff",
          400: "#48d4ff",
          500: "#1eb8ff",
          600: "#0099ff",
          700: "#007be0",
          800: "#0062b5",
          900: "#085493",
          950: "#0a3559",
        },
        // Battery status colors
        battery: {
          charging: "#4ade80",
          discharging: "#f97316",
          full: "#10b981",
          low: "#ef4444",
          idle: "#6b7280",
        },
        // Energy-specific colors
        energy: {
          solar: "#fbbf24",
          grid: "#8b5cf6",
          home: "#ec4899",
          export: "#06b6d4",
          import: "#f43f5e",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "pulse-charging": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        "flow-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "flow-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "battery-fill": {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
        "solar-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(251, 191, 36, 0.7)" },
          "70%": { boxShadow: "0 0 0 10px rgba(251, 191, 36, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(251, 191, 36, 0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-charging": "pulse-charging 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "flow-right": "flow-right 1.5s infinite linear",
        "flow-left": "flow-left 1.5s infinite linear",
        "battery-fill": "battery-fill 2s ease-in-out",
        "solar-pulse": "solar-pulse 2s infinite",
      },
      fontFamily: {
        sans: [
          "Inter var",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        display: [
          "Montserrat",
          "Inter",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '65ch',
            color: 'var(--tw-prose-body)',
            '[class~="lead"]': {
              color: 'var(--tw-prose-lead)',
            },
            a: {
              color: 'var(--tw-prose-links)',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            strong: {
              color: 'var(--tw-prose-bold)',
              fontWeight: '600',
            },
            'ol[type="A"]': {
              listStyleType: 'upper-alpha',
            },
            'ol[type="a"]': {
              listStyleType: 'lower-alpha',
            },
            'ol[type="A" s]': {
              listStyleType: 'upper-alpha',
            },
            'ol[type="a" s]': {
              listStyleType: 'lower-alpha',
            },
            'ol[type="I"]': {
              listStyleType: 'upper-roman',
            },
            'ol[type="i"]': {
              listStyleType: 'lower-roman',
            },
            'ol[type="I" s]': {
              listStyleType: 'upper-roman',
            },
            'ol[type="i" s]': {
              listStyleType: 'lower-roman',
            },
            'ol[type="1"]': {
              listStyleType: 'decimal',
            },
            'ol > li': {
              position: 'relative',
            },
            'ul > li': {
              position: 'relative',
            },
            h1: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '800',
              fontSize: 'em(36px)',
              marginTop: '0',
              marginBottom: '0.8333333em',
              lineHeight: '1.1111111',
            },
            h2: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '700',
              fontSize: 'em(24px)',
              marginTop: '1.5em',
              marginBottom: '0.8333333em',
              lineHeight: '1.3333333',
            },
            h3: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              fontSize: 'em(20px)',
              marginTop: '1.6em',
              marginBottom: '0.6em',
              lineHeight: '1.6',
            },
            h4: {
              color: 'var(--tw-prose-headings)',
              fontWeight: '600',
              marginTop: '1.5em',
              marginBottom: '0.5em',
              lineHeight: '1.5',
            },
            code: {
              color: 'var(--tw-prose-code)',
              fontWeight: '600',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '"`"',
            },
            'code::after': {
              content: '"`"',
            },
            'a code': {
              color: 'inherit',
            },
            'h1 code': {
              color: 'inherit',
            },
            'h2 code': {
              color: 'inherit',
            },
            'h3 code': {
              color: 'inherit',
            },
            'h4 code': {
              color: 'inherit',
            },
            'blockquote p:first-of-type::before': {
              content: 'none',
            },
            'blockquote p:last-of-type::after': {
              content: 'none',
            },
            'pre': {
              color: 'var(--tw-prose-pre-code)',
              backgroundColor: 'var(--tw-prose-pre-bg)',
              overflowX: 'auto',
              fontWeight: '400',
              fontSize: '0.875em',
              lineHeight: '1.7142857',
              marginTop: '1.7142857em',
              marginBottom: '1.7142857em',
              borderRadius: '0.375rem',
              paddingTop: '0.8571429em',
              paddingRight: '1.1428571em',
              paddingBottom: '0.8571429em',
              paddingLeft: '1.1428571em',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderWidth: '0',
              borderRadius: '0',
              padding: '0',
              fontWeight: 'inherit',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              lineHeight: 'inherit',
            },
            'pre code::before': {
              content: 'none',
            },
            'pre code::after': {
              content: 'none',
            },
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'honeycomb': 'url("/images/honeycomb-pattern.svg")',
        'solar-panel': 'url("/images/solar-panel-pattern.svg")',
        'battery-pattern': 'url("/images/battery-pattern.svg")',
      },
      boxShadow: {
        'glow-primary': '0 0 15px 2px hsl(var(--primary) / 0.5)',
        'glow-success': '0 0 15px 2px rgba(74, 222, 128, 0.5)',
        'glow-warning': '0 0 15px 2px rgba(251, 191, 36, 0.5)',
        'glow-error': '0 0 15px 2px rgba(239, 68, 68, 0.5)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
    function({ addVariant }) {
      addVariant('battery-charging', '&.battery-charging')
      addVariant('battery-discharging', '&.battery-discharging')
      addVariant('battery-idle', '&.battery-idle')
      addVariant('battery-low', '&.battery-low')
      addVariant('solar-active', '&.solar-active')
      addVariant('grid-importing', '&.grid-importing')
      addVariant('grid-exporting', '&.grid-exporting')
    },
  ],
}
