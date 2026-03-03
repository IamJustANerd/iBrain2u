// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import Router from "./Router";
import "./index.css"; // Make sure this points to your CSS file with the Tailwind theme!

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
);
