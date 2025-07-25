import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Pixel art background scaling function
function updateBackgroundScale() {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const imageWidth = 360;
  const imageHeight = 256;

  // Calculate scale factor based on height only
  const scaleY = Math.floor(viewportHeight / imageHeight);

  // Use the height-based scale to ensure the image always fits vertically
  const optimalScale = Math.max(1, scaleY);

  // Apply the scale to CSS custom property
  document.documentElement.style.setProperty(
    "--bg-scale",
    optimalScale.toString()
  );
}

// Initialize and update on resize
updateBackgroundScale();
window.addEventListener("resize", updateBackgroundScale);

// Set real viewport height for mobile Safari
function setRealVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}
window.addEventListener("resize", setRealVh);
window.addEventListener("load", setRealVh);

createRoot(document.getElementById("root")!).render(<App />);
