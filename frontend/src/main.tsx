// Force rebuild with correct API URL configuration
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/index.css";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";

createRoot(document.getElementById("root")!).render(
	<AccessibilityProvider>
		<App />
	</AccessibilityProvider>
);
