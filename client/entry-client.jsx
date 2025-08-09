import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App";
import { AuthProvider } from "./components/AuthContext";
import "./base.css";

ReactDOM.hydrateRoot(
  document.getElementById("root"),
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
