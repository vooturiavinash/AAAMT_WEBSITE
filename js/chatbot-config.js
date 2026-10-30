/**
 * Frontend-only chatbot API base (no secrets).
 *
 * Deployed RAG backend: https://aaamt-website-rag-backend.onrender.com
 * CORS allow-list includes https://aaamt.in (live site can call it directly).
 *
 * Local (127.0.0.1 / localhost / ::1): empty base → same-origin POST /api/chat
 * which serve.js proxies to the deployed backend (localhost is not CORS-allowed).
 *
 * Run locally with: npm start  (node serve.js)
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
