import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { MathsApp } from "../app/ui/MathsApp";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Le point de montage de l’application est introuvable.");
}

createRoot(root).render(
  <StrictMode>
    <MathsApp />
  </StrictMode>,
);
