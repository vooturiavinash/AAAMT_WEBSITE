/**
 * Partnership enquiry mail via Nodemailer + SMTP.
 * Recipients are fixed server-side. Does not read or modify any backend .env file.
 * SMTP settings load from process.env and optional smtp.env in the site root only.
 */
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const FIXED_RECIPIENTS = Object.freeze([
  "sales@aaamt.in",
  "vooturiavinash09@gmail.com",
]);

const MAX = {
  fullName: 120,
  email: 200,
  phone: 20,
  organisation: 200,
  website: 300,
  applyingAs: 80,
  partnershipInterest: 80,
  customerGroups: 120,
  targetCountry: 120,
  startTimeline: 80,
  marketApproach: 4000,
  productInterestItem: 80,
  productInterestCount: 8,
};

function loadSmtpFile(rootDir) {
  const file = path.join(rootDir, "smtp.env");
  if (!fs.existsSync(file)) return {};
  const out = {};
  const text = fs.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) return;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  });
  return out;
}

function getSmtpConfig(rootDir) {
  const fileCfg = loadSmtpFile(rootDir);
  const env = process.env;
  return {
    host: String(fileCfg.SMTP_HOST || env.SMTP_HOST || "").trim(),
    port: Number(fileCfg.SMTP_PORT || env.SMTP_PORT || 587),
    secure: String(fileCfg.SMTP_SECURE || env.SMTP_SECURE || "").toLowerCase() === "true",
    user: String(fileCfg.SMTP_USER || env.SMTP_USER || "").trim(),
    pass: String(fileCfg.SMTP_PASS || env.SMTP_PASS || "").trim(),
    from: String(fileCfg.SMTP_FROM || env.SMTP_FROM || "").trim(),
  };
}

function smtpConfigured(cfg) {
  return Boolean(cfg.host && cfg.from && (cfg.user ? cfg.pass : true));
}

function cleanText(value, maxLen) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLen);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizePartnershipBody(raw) {
  const products = Array.isArray(raw.productInterest)
    ? raw.productInterest
        .map((p) => cleanText(p, MAX.productInterestItem))
        .filter(Boolean)
        .slice(0, MAX.productInterestCount)
    : [];

  return {
    fullName: cleanText(raw.fullName, MAX.fullName),
    email: cleanText(raw.email, MAX.email).toLowerCase(),
    phone: cleanText(raw.phone, MAX.phone).replace(/[^\d+]/g, ""),
    applyingAs: cleanText(raw.applyingAs, MAX.applyingAs),
    organisation: cleanText(raw.organisation, MAX.organisation),
    website: cleanText(raw.website, MAX.website),
    productInterest: products,
    partnershipInterest: cleanText(raw.partnershipInterest, MAX.partnershipInterest),
    customerGroups: cleanText(raw.customerGroups, MAX.customerGroups),
    targetCountry: cleanText(raw.targetCountry, MAX.targetCountry),
    startTimeline: cleanText(raw.startTimeline, MAX.startTimeline),
    marketApproach: cleanText(raw.marketApproach, MAX.marketApproach),
  };
}

function validatePartnership(data) {
  const errors = [];
  if (!data.fullName) errors.push("Full name is required.");
  if (!data.email || !isValidEmail(data.email)) errors.push("A valid email is required.");
  if (!data.phone || data.phone.replace(/\D/g, "").length < 7) {
    errors.push("A valid phone number is required.");
  }
  if (!data.applyingAs) errors.push("How you are applying is required.");
  if (!data.productInterest.length) errors.push("Select at least one product interest.");
  if (!data.partnershipInterest) errors.push("Partnership interest is required.");
  if (!data.customerGroups) errors.push("Customer groups is required.");
  if (!data.targetCountry) errors.push("Primary target country is required.");
  if (!data.startTimeline) errors.push("Start timeline is required.");
  if (!data.marketApproach) errors.push("Market approach is required.");
  return errors;
}

function buildEmailBodies(data) {
  const lines = [
    "New partnership enquiry from the AAAMT website.",
    "",
    "— Profile —",
    `Full name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `How applying: ${data.applyingAs}`,
    `Organisation: ${data.organisation || "—"}`,
    `Website/profile: ${data.website || "—"}`,
    "",
    "— Partnership fit —",
    `Product interest: ${data.productInterest.join(", ")}`,
    `Partnership interest: ${data.partnershipInterest}`,
    `Customer groups: ${data.customerGroups}`,
    `Primary target country: ${data.targetCountry}`,
    `Start timeline: ${data.startTimeline}`,
    "",
    "Market approach:",
    data.marketApproach,
  ];
  const text = lines.join("\n");

  const row = (label, value) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top;">${escapeHtml(
      label
    )}</td><td style="padding:6px 0;color:#101827;">${escapeHtml(value)}</td></tr>`;

  const html = `
    <div style="font-family:Manrope,Arial,sans-serif;font-size:14px;line-height:1.55;color:#101827;">
      <p>New partnership enquiry from the AAAMT website.</p>
      <h3 style="margin:20px 0 8px;">Profile</h3>
      <table>${row("Full name", data.fullName)}${row("Email", data.email)}${row(
        "Phone",
        data.phone
      )}${row("How applying", data.applyingAs)}${row(
        "Organisation",
        data.organisation || "—"
      )}${row("Website/profile", data.website || "—")}</table>
      <h3 style="margin:20px 0 8px;">Partnership fit</h3>
      <table>${row("Product interest", data.productInterest.join(", "))}${row(
        "Partnership interest",
        data.partnershipInterest
      )}${row("Customer groups", data.customerGroups)}${row(
        "Primary target country",
        data.targetCountry
      )}${row("Start timeline", data.startTimeline)}</table>
      <h3 style="margin:20px 0 8px;">Market approach</h3>
      <p style="white-space:pre-wrap;">${escapeHtml(data.marketApproach)}</p>
    </div>
  `;

  return { text, html };
}

async function sendPartnershipEnquiry(rootDir, rawPayload) {
  const data = normalizePartnershipBody(rawPayload || {});
  const errors = validatePartnership(data);
  if (errors.length) {
    const err = new Error(errors.join(" "));
    err.code = "VALIDATION";
    err.status = 422;
    err.details = errors;
    throw err;
  }

  const cfg = getSmtpConfig(rootDir);
  if (!smtpConfigured(cfg)) {
    const err = new Error(
      "SMTP is not configured. Create smtp.env (see smtp.env.example) with SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM."
    );
    err.code = "SMTP_NOT_CONFIGURED";
    err.status = 503;
    throw err;
  }

  const { text, html } = buildEmailBodies(data);
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure || cfg.port === 465,
    auth: cfg.user
      ? {
          user: cfg.user,
          pass: cfg.pass,
        }
      : undefined,
  });

  // One message to both fixed recipients; success only if the server accepts delivery.
  const info = await transporter.sendMail({
    from: cfg.from,
    to: FIXED_RECIPIENTS.join(", "),
    replyTo: data.email,
    subject: "New Partnership Enquiry - AAAMT",
    text,
    html,
  });

  const accepted = Array.isArray(info.accepted) ? info.accepted.map(String) : [];
  const missing = FIXED_RECIPIENTS.filter((addr) => {
    return !accepted.some((a) => a.toLowerCase().includes(addr.toLowerCase()));
  });

  // Some SMTP servers omit accepted details; treat empty rejected + no error as success.
  const rejected = Array.isArray(info.rejected) ? info.rejected.map(String) : [];
  if (rejected.length) {
    const err = new Error(
      "The mail server rejected one or more recipients: " + rejected.join(", ")
    );
    err.code = "SMTP_REJECTED";
    err.status = 502;
    throw err;
  }

  if (accepted.length && missing.length) {
    const err = new Error(
      "Not all recipients were accepted by the mail server: " + missing.join(", ")
    );
    err.code = "SMTP_PARTIAL";
    err.status = 502;
    throw err;
  }

  return {
    ok: true,
    messageId: info.messageId || "",
    recipients: FIXED_RECIPIENTS.slice(),
  };
}

module.exports = {
  FIXED_RECIPIENTS,
  getSmtpConfig,
  smtpConfigured,
  sendPartnershipEnquiry,
};
