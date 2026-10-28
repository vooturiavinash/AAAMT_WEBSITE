/**
 * AAAMT chatbot API client — POST {base}/api/chat
 * Matches deployed OpenAPI ChatRequest:
 *   { question: string(1..1000), top_k?: 1..5 (default 3), history?: ChatMessage[0..8] }
 * Response: { answer: string, sources?: { title, url, score? }[] }
 * History: max 8 prior messages; current question is NOT included in history.
 */
(function (global) {
  var HISTORY_LIMIT = 8;
  var QUESTION_MIN = 1;
  var QUESTION_MAX = 1000;
  var REQUEST_TIMEOUT_MS = 65000;

  function chatUrl() {
    var base = typeof global.AAAMT_CHATBOT_API_BASE === "string" ? global.AAAMT_CHATBOT_API_BASE : "";
    base = String(base || "").replace(/\/+$/, "");
    return base ? base + "/api/chat" : "/api/chat";
  }

  function trimHistory(history) {
    var list = Array.isArray(history) ? history.slice() : [];
    return list
      .filter(function (m) {
        return (
          m &&
          (m.role === "user" || m.role === "assistant") &&
          String(m.content || "").trim().length > 0
        );
      })
      .map(function (m) {
        return {
          role: m.role,
          content: String(m.content || "").trim().slice(0, QUESTION_MAX),
        };
      })
      .slice(-HISTORY_LIMIT);
  }

  function detailMessage(data, fallback) {
    if (!data || typeof data !== "object") return fallback;
    var d = data.detail;
    if (typeof d === "string" && d.trim()) return d.trim();
    if (Array.isArray(d) && d.length) {
      var parts = d
        .map(function (item) {
          if (typeof item === "string") return item;
          if (item && typeof item.msg === "string") return item.msg;
          return "";
        })
        .filter(Boolean);
      if (parts.length) return parts.join(" ");
    }
    if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
    return fallback;
  }

  function mapHttpError(status, data, response) {
    if (status === 422) {
      return detailMessage(data, "Please check your question and try again.");
    }
    if (status === 429) {
      var retry =
        (data && typeof data.retry_after_seconds === "number" && data.retry_after_seconds) ||
        Number(response && response.headers && response.headers.get("Retry-After")) ||
        null;
      if (retry && retry > 0) {
        return "Too many requests. Please try again in about " + Math.ceil(retry) + " seconds.";
      }
      return "Too many requests. Please wait a moment and try again.";
    }
    if (status === 502) {
      return detailMessage(data, "The assistant is temporarily unavailable. Please try again shortly.");
    }
    if (status === 503) {
      return detailMessage(
        data,
        "The knowledge base is not ready yet. Please try again later."
      );
    }
    if (status >= 500) {
      return detailMessage(data, "Something went wrong on our side. Please try again.");
    }
    return detailMessage(data, "Chat request failed. Please try again.");
  }

  function normalizeSources(sources) {
    if (!Array.isArray(sources)) return [];
    return sources
      .map(function (s) {
        if (!s || typeof s !== "object") return null;
        var url = String(s.url || "").trim();
        if (!/^https?:\/\//i.test(url)) return null;
        return {
          title: String(s.title || "Source").trim() || "Source",
          url: url,
        };
      })
      .filter(Boolean);
  }

  /**
   * @param {string} question
   * @param {Array<{role:string,content:string}>} history prior messages only
   * @returns {Promise<{answer:string,sources:Array<{title:string,url:string}>}>}
   */
  async function sendChatMessage(question, history) {
    var q = String(question || "").trim();
    if (q.length < QUESTION_MIN) {
      throw new Error("Please enter a question.");
    }
    if (q.length > QUESTION_MAX) {
      throw new Error("Please keep your question under 1000 characters.");
    }

    var url = chatUrl();
    if (!url || (url.indexOf("http") === 0 && !/^https?:\/\//i.test(url))) {
      throw new Error("Chat service is not configured for this environment.");
    }
    if (
      typeof location !== "undefined" &&
      location.hostname !== "127.0.0.1" &&
      location.hostname !== "localhost" &&
      location.hostname !== "::1" &&
      !String(global.AAAMT_CHATBOT_API_BASE || "").trim()
    ) {
      throw new Error(
        "Chat API is not configured. Set the deployed API base in chatbot-config.js."
      );
    }

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    if (controller) {
      timer = setTimeout(function () {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);
    }

    var response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          question: q,
          top_k: 4,
          history: trimHistory(history),
        }),
        signal: controller ? controller.signal : undefined,
      });
    } catch (err) {
      if (timer) clearTimeout(timer);
      if (err && err.name === "AbortError") {
        throw new Error("The request timed out. Please try again.");
      }
      throw new Error("Unable to reach the assistant. Check your connection and try again.");
    }
    if (timer) clearTimeout(timer);

    var data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      throw new Error(mapHttpError(response.status, data, response));
    }

    if (!data || typeof data !== "object") {
      throw new Error("Received an unexpected response from the assistant.");
    }

    var redirectUrl = safeRedirect(data.redirect_url);
    var answer = typeof data.answer === "string" ? String(data.answer).trim() : "";
    if (!redirectUrl && !answer) {
      throw new Error("The assistant returned an empty reply. Please try again.");
    }

    return {
      answer: answer,
      sources: normalizeSources(data.sources),
      redirectUrl: redirectUrl,
    };
  }

  function safeRedirect(url) {
    var value = String(url || "").trim();
    if (!value || value.indexOf("\\") !== -1) return "";
    if (value.charAt(0) === "/" && value.charAt(1) !== "/") return value;
    try {
      var parsed = new URL(value);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
    } catch (err) {
      return "";
    }
    return "";
  }

  global.AAAMTChatAPI = {
    sendChatMessage: sendChatMessage,
    HISTORY_LIMIT: HISTORY_LIMIT,
    QUESTION_MAX: QUESTION_MAX,
  };
})(typeof window !== "undefined" ? window : this);
