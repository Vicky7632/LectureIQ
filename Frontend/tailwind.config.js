import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  daisyui: {
    themes: [
      {
        lectureiq: {
          primary: "#47765A",
          "primary-content": "#FFFFFF",
          secondary: "#365C45",
          "secondary-content": "#FFFFFF",
          accent: "#47765A",
          "accent-content": "#FFFFFF",
          neutral: "#242720",
          "neutral-content": "#FAF8F3",
          "base-100": "#FFFFFF",
          "base-200": "#F5F2EA",
          "base-300": "#E8E4DA",
          "base-content": "#242720",
          info: "#55736B",
          "info-content": "#FFFFFF",
          success: "#47765A",
          "success-content": "#FFFFFF",
          warning: "#94652D",
          "warning-content": "#FFFFFF",
          error: "#A14E48",
          "error-content": "#FFFFFF",
        },
      },
    ],
  },
  plugins: [daisyui],
}