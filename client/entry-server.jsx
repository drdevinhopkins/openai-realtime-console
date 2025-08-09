import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./components/App";
import { AuthProvider } from "./components/AuthContext";

export function render() {
  const html = renderToString(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
  return { html };
}
