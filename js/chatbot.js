/**
 * AAAMT Nemo chat panel — same behavior as the RAG frontend widget.
 * Careers keywords and API redirect_url follow frontend/src/app.jsx.
 * API via AAAMTChatAPI (chatbot-api.js); no secrets.
 */
(function () {
  var DIALOG_ID = "aaamt-chat-dialog";
  var NEMO_AVATAR = "assets/images/nemo-avatar.jpeg";
  var CAREERS_URL = "/careers";

  var history = [];
  var pending = false;
  var lastFocus = null;
  var messageCount = 0;

  var SEND_ARROW =
    '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function ensurePanel() {
    var existing = document.getElementById(DIALOG_ID);
    if (existing) return existing;

    var dialog = document.createElement("div");
    dialog.id = DIALOG_ID;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "aaamt-chat-title");
    dialog.hidden = true;

    dialog.innerHTML =
      '<iframe class="chatbot-embed" title="Nemo Virtual Assistant" src="/chat-widget/index.html?embed=1"></iframe>';

    document.body.appendChild(dialog);
    return dialog;
  }

  function threadEl(dialog) {
    return $("[data-chatbot-thread]", dialog);
  }

  function welcomeEl(dialog) {
    return $("[data-chatbot-welcome]", dialog);
  }

  function updateNewChatVisibility(dialog) {
    var btn = $("[data-chatbot-new]", dialog);
    if (btn) btn.hidden = messageCount === 0;
  }

  function showConversationView(dialog) {
    var welcome = welcomeEl(dialog);
    var thread = threadEl(dialog);
    if (welcome) welcome.hidden = true;
    if (thread) thread.hidden = false;
  }

  function showWelcomeView(dialog) {
    var welcome = welcomeEl(dialog);
    var thread = threadEl(dialog);
    if (welcome) welcome.hidden = false;
    if (thread) {
      thread.hidden = true;
      thread.innerHTML = "";
    }
  }

  function setSendEnabled(dialog) {
    var input = $("[data-chatbot-input]", dialog);
    var send = $("[data-chatbot-send]", dialog);
    if (!input || !send) return;
    var ok = !pending && String(input.value || "").trim().length > 0;
    send.disabled = !ok;
  }

  function setSendLoading(dialog, loading) {
    var send = $("[data-chatbot-send]", dialog);
    if (!send) return;
    if (loading) {
      send.innerHTML = '<span class="chatbot-send-spinner" aria-hidden="true"></span>';
    } else {
      send.innerHTML = SEND_ARROW;
    }
  }

  function scrollToBottom(dialog) {
    var area = $("[data-chatbot-messages]", dialog);
    if (area) area.scrollTop = area.scrollHeight;
  }

  function appendMessage(dialog, role, text, opts) {
    opts = opts || {};
    var thread = threadEl(dialog);
    if (!thread) return;

    showConversationView(dialog);
    messageCount += 1;
    updateNewChatVisibility(dialog);

    var row = document.createElement("article");
    row.className =
      "chatbot-msg-row " +
      (role === "user" ? "is-user" : "is-assistant") +
      (opts.error ? " is-error" : "");

    if (role === "assistant") {
      var avatar = document.createElement("div");
      avatar.className = "chatbot-msg-avatar";
      avatar.innerHTML =
        '<img src="' +
        NEMO_AVATAR +
        '" alt="" width="42" height="42" decoding="async">';
      row.appendChild(avatar);
    }

    var content = document.createElement("div");
    content.className = "chatbot-msg-content";

    var author = document.createElement("div");
    author.className = "chatbot-msg-author";
    author.textContent = role === "user" ? "You" : "Nemo Assistant";
    content.appendChild(author);

    var bubble = document.createElement("div");
    bubble.className = "chatbot-bubble";
    if (role === "assistant" && !opts.error) {
      bubble.classList.add("is-markdown");
      bubble.innerHTML = renderMarkdown(text);
    } else {
      bubble.textContent = text;
    }
    content.appendChild(bubble);

    row.appendChild(content);

    var typing = $("[data-chatbot-typing]", thread);
    if (typing) thread.insertBefore(row, typing);
    else thread.appendChild(row);
    scrollToBottom(dialog);
  }

  function showTyping(dialog, on) {
    var thread = threadEl(dialog);
    if (!thread) return;
    var existing = $("[data-chatbot-typing]", thread);
    if (!on) {
      if (existing) existing.remove();
      return;
    }
    if (existing) return;

    showConversationView(dialog);

    var row = document.createElement("div");
    row.className = "chatbot-msg-row is-assistant";
    row.setAttribute("data-chatbot-typing", "");
    row.setAttribute("aria-live", "polite");
    row.setAttribute("aria-label", "Nemo is thinking");
    row.innerHTML =
      '<div class="chatbot-msg-avatar">' +
      '<img src="' +
      NEMO_AVATAR +
      '" alt="" width="42" height="42" decoding="async">' +
      "</div>" +
      '<div class="chatbot-msg-content">' +
      '<div class="chatbot-msg-author">Nemo virtual Assistant</div>' +
      '<div class="chatbot-typing-bubble"><span></span><span></span><span></span><p>Thinking...</p></div>' +
      "</div>";
    thread.appendChild(row);
    scrollToBottom(dialog);
  }

  function resetConversation(dialog) {
    history = [];
    pending = false;
    messageCount = 0;
    showTyping(dialog, false);
    showWelcomeView(dialog);
    updateNewChatVisibility(dialog);
    var input = $("[data-chatbot-input]", dialog);
    if (input) {
      input.value = "";
      input.disabled = false;
      input.style.height = "auto";
    }
    setSendLoading(dialog, false);
    setSendEnabled(dialog);
  }

  function isOpen(dialog) {
    return dialog.classList.contains("is-open");
  }

  function openPanel(dialog, launcher) {
    lastFocus = document.activeElement;
    dialog.hidden = false;
    void dialog.offsetWidth;
    dialog.classList.add("is-open");
    document.body.classList.add("chatbot-open");
    if (launcher) {
      launcher.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      launcher.setAttribute("aria-label", "Close Nemo Virtual Assistant");
    }
    var input = $("[data-chatbot-input]", dialog);
    window.setTimeout(function () {
      if (input) input.focus();
    }, 50);
  }

  function closePanel(dialog, launcher) {
    dialog.classList.remove("is-open");
    document.body.classList.remove("chatbot-open");
    if (launcher) {
      launcher.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open AAAMT AI Assistant");
    }
    window.setTimeout(function () {
      if (!isOpen(dialog)) dialog.hidden = true;
    }, 280);
    if (launcher && typeof launcher.focus === "function") launcher.focus();
    else if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  function togglePanel(dialog, launcher) {
    if (isOpen(dialog)) closePanel(dialog, launcher);
    else openPanel(dialog, launcher);
  }

  async function submitQuestion(dialog, question) {
    var api = window.AAAMTChatAPI;
    if (!api || typeof api.sendChatMessage !== "function") {
      appendMessage(dialog, "assistant", "Chat is not available right now.", { error: true });
      return;
    }

    var q = String(question || "").trim();
    if (!q || pending) return;

    if (isCareersQuery(q)) {
      window.location.assign(CAREERS_URL);
      return;
    }

    appendMessage(dialog, "user", q);
    var input = $("[data-chatbot-input]", dialog);
    if (input) {
      input.value = "";
      input.style.height = "auto";
    }
    pending = true;
    setSendEnabled(dialog);
    setSendLoading(dialog, true);
    if (input) input.disabled = true;
    showTyping(dialog, true);

    try {
      var result = await api.sendChatMessage(q, history);
      showTyping(dialog, false);
      if (result.redirectUrl) {
        window.location.assign(result.redirectUrl);
        return;
      }
      appendMessage(dialog, "assistant", result.answer);
      history.push({ role: "user", content: q });
      history.push({ role: "assistant", content: result.answer });
      if (history.length > api.HISTORY_LIMIT) {
        history = history.slice(-api.HISTORY_LIMIT);
      }
    } catch (err) {
      showTyping(dialog, false);
      appendMessage(
        dialog,
        "assistant",
        (err && err.message) || "Something went wrong. Please try again.",
        { error: true }
      );
    } finally {
      pending = false;
      setSendLoading(dialog, false);
      if (input) input.disabled = false;
      setSendEnabled(dialog);
      if (input) input.focus();
    }
  }

  function isCareersQuery(text) {
    var normalized = String(text || "")
      .replace(/\s+/g, " ")
      .replace(/[.!?]+$/, "")
      .trim()
      .toLowerCase();
    return (
      normalized === "career" ||
      normalized === "careers" ||
      normalized === "job" ||
      normalized === "jobs"
    );
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderInline(value) {
    return value
      .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_match, label, url) {
        return (
          '<a href="' +
          url +
          '" target="_blank" rel="noopener noreferrer">' +
          label +
          "</a>"
        );
      })
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>");
  }

  function renderMarkdown(source) {
    var text = escapeHtml(source).replace(/\r\n/g, "\n").trim();
    if (!text) return "";
    return text
      .split(/\n{2,}/)
      .map(function (block) {
        var lines = block.split("\n");
        var bullet = lines.some(function (line) {
          return /^\s*[-*]\s+/.test(line);
        });
        var numbered = lines.some(function (line) {
          return /^\s*\d+\.\s+/.test(line);
        });
        if (bullet && lines.every(function (line) {
          return line.trim() === "" || /^\s*[-*]\s+/.test(line);
        })) {
          return (
            "<ul>" +
            lines
              .filter(function (line) {
                return /^\s*[-*]\s+/.test(line);
              })
              .map(function (line) {
                return "<li>" + renderInline(line.replace(/^\s*[-*]\s+/, "")) + "</li>";
              })
              .join("") +
            "</ul>"
          );
        }
        if (numbered && lines.every(function (line) {
          return line.trim() === "" || /^\s*\d+\.\s+/.test(line);
        })) {
          return (
            "<ol>" +
            lines
              .filter(function (line) {
                return /^\s*\d+\.\s+/.test(line);
              })
              .map(function (line) {
                return "<li>" + renderInline(line.replace(/^\s*\d+\.\s+/, "")) + "</li>";
              })
              .join("") +
            "</ol>"
          );
        }
        return "<p>" + lines.map(renderInline).join("<br>") + "</p>";
      })
      .join("");
  }

  function bind() {
    var launchers = document.querySelectorAll(".chatbot-float");
    if (!launchers.length) return;

    var dialog = ensurePanel();

    launchers.forEach(function (launcher) {
      if (launcher.tagName === "A") {
        launcher.addEventListener("click", function (e) {
          e.preventDefault();
        });
      }
      launcher.setAttribute("type", launcher.tagName === "BUTTON" ? "button" : "");
      launcher.setAttribute("aria-haspopup", "dialog");
      launcher.setAttribute("aria-controls", DIALOG_ID);
      launcher.setAttribute("aria-expanded", "false");
      launcher.setAttribute("aria-label", "Open AAAMT AI Assistant");

      launcher.addEventListener("click", function (e) {
        e.preventDefault();
        togglePanel(dialog, launcher);
      });
    });

    var primaryLauncher = launchers[0];

    window.addEventListener("message", function (event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== "aaamt-chat-close") return;
      if (isOpen(dialog)) closePanel(dialog, primaryLauncher);
    });

    dialog.addEventListener("click", function (e) {
      var t = e.target;
      if (t.closest("[data-chatbot-close]")) {
        closePanel(dialog, primaryLauncher);
        return;
      }
      if (t.closest("[data-chatbot-new]")) {
        resetConversation(dialog);
        return;
      }
    });

    var form = $("[data-chatbot-form]", dialog);
    var input = $("[data-chatbot-input]", dialog);
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        submitQuestion(dialog, input && input.value);
      });
    }
    if (input) {
      input.addEventListener("input", function () {
        setSendEnabled(dialog);
        input.style.height = "auto";
        input.style.height = Math.min(120, input.scrollHeight) + "px";
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (!pending && String(input.value || "").trim()) {
            submitQuestion(dialog, input.value);
          }
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen(dialog)) {
        closePanel(dialog, primaryLauncher);
      }
    });

    setSendEnabled(dialog);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bind);
  } else {
    bind();
  }
})();
