import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Early capture of PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-install-promptable"));
});

import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

import "leaflet/dist/leaflet.css";

import "./lib/leafletSetup.js";

import "./i18n/index.js";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
