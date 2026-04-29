import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
  capture_pageview: true,
  capture_pageleave: true,
  session_recording: {
    recordCrossOriginIframes: true,
  },
  enable_heatmaps: true,
  scroll_root_selector: ".page",
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>,
);
