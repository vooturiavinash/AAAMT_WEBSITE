/**
 * Frontend-only chatbot API base (no secrets).
 *
 * Deployed RAG backend: https://aaamt-website-rag-backend.onrender.com
 *
 * Local (127.0.0.1 / localhost): empty base → same-origin POST /api/chat
 * which serve.js proxies to the deployed backend (avoids CORS).
 *
 * Non-local hosts: call the deployed origin directly. That only works in the
 * browser if the backend CORS allow-list includes your site origin; otherwise
 * keep using a same-origin proxy (serve.js or host reverse proxy).
 */
(function (global) {
  var DEPLOYED_API_BASE = "https://aaamt-website-rag-backend.onrender.com";

  function isLocalHost() {
    var h = location.hostname;
    return h === "127.0.0.1" || h === "localhost" || h === "::1";
  }

  global.AAAMT_CHATBOT_API_BASE = isLocalHost() ? "" : DEPLOYED_API_BASE;
  global.AAAMT_CHATBOT_DEPLOYED_BASE = DEPLOYED_API_BASE;
})(typeof window !== "undefined" ? window : this);
