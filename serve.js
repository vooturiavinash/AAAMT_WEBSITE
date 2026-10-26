#!/usr/bin/env node
/**
 * Static file server with:
 * - Partnership enquiry mail via Nodemailer + SMTP (no third-party email API)
 * - Optional legacy contact enquiry proxy
 * - Chat proxy to deployed AAAMT RAG API (Render)
 *
 * Run: npm install && node serve.js
 * SMTP: copy smtp.env.example → smtp.env (does not use or modify any backend .env)
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const {
  sendPartnershipEnquiry,
  getSmtpConfig,
  smtpConfigured,
  FIXED_RECIPIENTS,
} = require("./lib/partnership-mail");

const ROOT = __dirname;
const UPSTREAM = "https://communication.aaamt.in/api/Email/demo-survey";
const CHAT_UPSTREAM =
  process.env.AAAMT_CHAT_UPSTREAM ||
  "https://aaamt-website-rag-backend.onrender.com/api/chat";
const HOST = "127.0.0.1";
const PORT = 8765;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
  ".map": "application/json",
};

function sendJson(res, status, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Content-Length": Buffer.byteLength(data),
    "Cache-Control": "no-cache",
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function proxyEnquiry(req, res, raw) {
  let payload;
  try {
    payload = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
  } catch {
    sendJson(res, 400, { message: "Invalid JSON body" });
    return;
  }

  const body = JSON.stringify({
    applicationName: payload.applicationName || "AAAMT Website",
    fullName: payload.fullName || "",
    emailId: payload.emailId || "",
    phoneNumber: payload.phoneNumber || "",
    companyName: payload.companyName || "",
    message: payload.message || "",
    recipientEmail: payload.recipientEmail || "sales@aaamt.in",
    toEmail: payload.toEmail || "sales@aaamt.in",
  });
  const upstreamUrl = new URL(UPSTREAM);
  const options = {
    protocol: upstreamUrl.protocol,
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || 443,
    path: upstreamUrl.pathname + upstreamUrl.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const upstream = https.request(options, (upRes) => {
    const chunks = [];
    upRes.on("data", (chunk) => chunks.push(chunk));
    upRes.on("end", () => {
      const buf = Buffer.concat(chunks);
      res.writeHead(upRes.statusCode || 502, {
        "Content-Type": upRes.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      });
      res.end(buf);
    });
  });

  upstream.setTimeout(30000, () => {
    upstream.destroy(new Error("Upstream timeout"));
  });

  upstream.on("error", (err) => {
    sendJson(res, 502, { message: "Enquiry proxy failed", detail: String(err.message || err) });
  });

  upstream.write(body);
  upstream.end();
}

function proxyChat(req, res, raw) {
  let payload;
  try {
    payload = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
  } catch {
    sendJson(res, 400, { detail: "Invalid JSON body" });
    return;
  }

  const body = JSON.stringify({
    question: payload.question || "",
    top_k: payload.top_k != null ? payload.top_k : 3,
    history: Array.isArray(payload.history) ? payload.history : [],
  });
  const upstreamUrl = new URL(CHAT_UPSTREAM);
  const lib = upstreamUrl.protocol === "https:" ? https : http;
  const options = {
    protocol: upstreamUrl.protocol,
    hostname: upstreamUrl.hostname,
    port: upstreamUrl.port || (upstreamUrl.protocol === "https:" ? 443 : 80),
    path: upstreamUrl.pathname + upstreamUrl.search,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const upstream = lib.request(options, (upRes) => {
    const chunks = [];
    upRes.on("data", (chunk) => chunks.push(chunk));
    upRes.on("end", () => {
      const buf = Buffer.concat(chunks);
      const headers = {
        "Content-Type": upRes.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      };
      if (upRes.headers["retry-after"]) {
        headers["Retry-After"] = upRes.headers["retry-after"];
      }
      res.writeHead(upRes.statusCode || 502, headers);
      res.end(buf);
    });
  });

  upstream.setTimeout(65000, () => {
    upstream.destroy(new Error("Chat upstream timeout"));
  });

  upstream.on("error", (err) => {
    sendJson(res, 502, {
      detail: "Unable to reach the chat service. The deployed RAG backend may be unavailable.",
      message: String(err.message || err),
    });
  });

  upstream.write(body);
  upstream.end();
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  let relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!relative) relative = "index.html";
  const resolved = path.resolve(root, relative);
  const rootNorm = path.resolve(root).toLowerCase();
  if (!resolved.toLowerCase().startsWith(rootNorm)) return null;
  return resolved;
}

function dirIndexPath(urlPathname) {
  const rel = urlPathname.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!rel) return null;
  return path.join(ROOT, rel, "index.html");
}

function serveStatic(req, res) {
  let filePath = safeJoin(ROOT, req.url || "/");
  if (!filePath) {
    res.writeHead(403, { "Cache-Control": "no-cache" });
    res.end("Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    function sendFile(targetPath) {
      fs.readFile(targetPath, (readErr, data) => {
        if (readErr) {
          res.writeHead(404, { "Cache-Control": "no-cache" });
          res.end("Not found");
          return;
        }
        const ext = path.extname(targetPath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME[ext] || "application/octet-stream",
          "Cache-Control": "no-cache",
        });
        res.end(data);
      });
    }

    // Directory → index.html (e.g. /privacy-policy/)
    if (!err && stats.isDirectory()) {
      return sendFile(path.join(filePath, "index.html"));
    }

    // Clean URLs: /contact -> contact.html (and other extensionless pages)
    if (err || !stats.isFile()) {
      if (!path.extname(filePath)) {
        const withHtml = filePath + ".html";
        return fs.stat(withHtml, (htmlErr, htmlStats) => {
          if (!htmlErr && htmlStats.isFile()) return sendFile(withHtml);
          res.writeHead(404, { "Cache-Control": "no-cache" });
          res.end("Not found");
        });
      }
      res.writeHead(404, { "Cache-Control": "no-cache" });
      res.end("Not found");
      return;
    }

    sendFile(filePath);
  });
}

const server = http.createServer(async (req, res) => {
  const rawUrl = req.url || "/";
  const pathname = rawUrl.split("?")[0];
  const search = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?")) : "";

  // Legacy privacy aliases → canonical trailing-slash URL
  const privacyAliases = new Set([
    "/privacy",
    "/privacy.html",
    "/privacy-policy.html",
    "/PRIVACY_POLICY.html",
  ]);
  if (privacyAliases.has(pathname) || /^\/privacy_policy\.html$/i.test(pathname)) {
    res.writeHead(301, {
      Location: "/privacy-policy/" + search,
      "Cache-Control": "no-cache",
    });
    res.end();
    return;
  }

  // Never show .html in the address bar — redirect to clean URLs
  if (/\.html$/i.test(pathname)) {
    let clean =
      pathname.toLowerCase() === "/index.html"
        ? "/"
        : pathname.replace(/\.html$/i, "");
    // Prefer trailing slash when a folder index exists (privacy-policy/)
    if (clean !== "/" && fs.existsSync(dirIndexPath(clean))) {
      clean = clean + "/";
    }
    res.writeHead(301, {
      Location: clean + search,
      "Cache-Control": "no-cache",
    });
    res.end();
    return;
  }

  // Canonical trailing slash for directories with index.html
  if (
    pathname !== "/" &&
    !pathname.endsWith("/") &&
    !path.extname(pathname) &&
    fs.existsSync(dirIndexPath(pathname))
  ) {
    res.writeHead(301, {
      Location: pathname + "/" + search,
      "Cache-Control": "no-cache",
    });
    res.end();
    return;
  }

  if (
    (pathname === "/api/enquiry" ||
      pathname === "/api/partnership-enquiry" ||
      pathname === "/api/chat") &&
    req.method === "OPTIONS"
  ) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept",
      "Cache-Control": "no-cache",
    });
    res.end();
    return;
  }

  if (pathname === "/api/partnership-enquiry" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      let payload;
      try {
        payload = JSON.parse(raw.length ? raw.toString("utf8") : "{}");
      } catch {
        sendJson(res, 400, { message: "Invalid JSON body" });
        return;
      }
      // Ignore any client-supplied recipient fields — recipients are fixed server-side.
      delete payload.to;
      delete payload.cc;
      delete payload.bcc;
      delete payload.recipientEmail;
      delete payload.toEmail;
      delete payload.recipients;

      const result = await sendPartnershipEnquiry(ROOT, payload);
      sendJson(res, 200, {
        message: "Partnership enquiry emailed successfully",
        recipients: result.recipients,
        messageId: result.messageId,
      });
    } catch (err) {
      const status = err && err.status ? err.status : 502;
      sendJson(res, status, {
        message: String((err && err.message) || "Failed to send partnership enquiry"),
        code: err && err.code ? err.code : "MAIL_ERROR",
        details: err && err.details ? err.details : undefined,
      });
    }
    return;
  }

  if (pathname === "/api/enquiry" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      proxyEnquiry(req, res, raw);
    } catch (err) {
      sendJson(res, 502, { message: "Enquiry proxy failed", detail: String(err.message || err) });
    }
    return;
  }

  if (pathname === "/api/chat" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      proxyChat(req, res, raw);
    } catch (err) {
      sendJson(res, 502, {
        detail: "Chat proxy failed",
        message: String(err.message || err),
      });
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(404, { "Cache-Control": "no-cache" });
    res.end("Not found");
    return;
  }

  serveStatic(req, res);
});

server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Stop the other process, then run: node serve.js`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, HOST, () => {
  const smtp = getSmtpConfig(ROOT);
  console.log(`Serving ${ROOT} at http://${HOST}:${PORT}`);
  console.log(
    `Partnership mail: POST http://${HOST}:${PORT}/api/partnership-enquiry -> ${FIXED_RECIPIENTS.join(", ")}`
  );
  console.log(
    smtpConfigured(smtp)
      ? `SMTP: configured (${smtp.host}:${smtp.port})`
      : "SMTP: NOT configured — copy smtp.env.example to smtp.env and fill SMTP_* values"
  );
  console.log(`Enquiry proxy: POST http://${HOST}:${PORT}/api/enquiry -> ${UPSTREAM}`);
  console.log(`Chat proxy: POST http://${HOST}:${PORT}/api/chat -> ${CHAT_UPSTREAM}`);
});
