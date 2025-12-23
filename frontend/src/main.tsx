
import { createRoot } from "react-dom/client";

import App from "./App";
import "./styles/index.css";
import "./i18n/config";
import { AccessibilityProvider } from "./contexts/AccessibilityContext";

createRoot(document.getElementById("root")!).render(
	<AccessibilityProvider>
		<App />
	</AccessibilityProvider>
);
