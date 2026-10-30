/**
 * Frontend-only chatbot API base (no secrets).
 *
 * Always call the deployed RAG backend so the chat works when the repo is
 * copied and opened with any static server (not only serve.js /api/chat).
 * serve.js still exposes /api/chat as an optional same-origin proxy.
 *
 * Deployed RAG backend: https://aaamt-website-rag-backend.onrender.com
 */
(function (global) {
  var DEPLOYED_API_BASE = "https://aaamt-website-rag-backend.onrender.com";

  global.AAAMT_CHATBOT_API_BASE = DEPLOYED_API_BASE;
  global.AAAMT_CHATBOT_DEPLOYED_BASE = DEPLOYED_API_BASE;
})(typeof window !== "undefined" ? window : this);
