const fs = require("fs");

const files = [
  "careers.html",
  "contact.html",
  "index.html",
  "partner-with-aaamt.html",
  "partnership.html",
  "products.html",
  "role.html",
];

const pairs = [
  [/We\uFFFDre/g, "We're"],
  [/we\uFFFDre/g, "we're"],
  [/We\uFFFDll/g, "We'll"],
  [/You\uFFFDll/g, "You'll"],
  [/you\uFFFDre/g, "you're"],
  [/Don\uFFFDt/g, "Don't"],
  [/Let\uFFFDs/g, "Let's"],
  [/organization\uFFFDs/g, "organization's"],
  [/AI NATIVE \uFFFD B2B SAAS \uFFFD DIGITAL/g, "AI NATIVE · B2B SAAS · DIGITAL"],
  [/ENTERPRISE SOFTWARE \uFFFD AI \uFFFD DIGITAL/g, "ENTERPRISE SOFTWARE · AI · DIGITAL"],
  [/Product \uFFFD Hyderabad/g, "Product · Hyderabad"],
  [/Revenue \uFFFD Hyderabad/g, "Revenue · Hyderabad"],
  [/Engineering \uFFFD Hyderabad/g, "Engineering · Hyderabad"],
  [/Modal concept \uFFFD no/g, "Modal concept — no"],
  [/PDF or DOCX \uFFFD size/g, "PDF or DOCX — size"],
  [/Partnership Enquire \uFFFD AAAMT/g, "Partnership Enquire — AAAMT"],
  [/Partnership \uFFFD AAAMT/g, "Partnership — AAAMT"],
  [/1\uFFFD3 months/g, "1–3 months"],
  [/3\uFFFD6 months/g, "3–6 months"],
  [/<strong>\uFFFD 2026/g, "<strong>© 2026"],
  [/aria-label="Close">\uFFFD<\/button>/g, 'aria-label="Close">×</button>'],
  [/aria-hidden="true">\uFFFD<\/span>/g, 'aria-hidden="true">·</span>'],
];

for (const f of files) {
  let t = fs.readFileSync(f, "utf8");
  for (const [re, rep] of pairs) t = t.replace(re, rep);
  const left = (t.match(/\uFFFD/g) || []).length;
  fs.writeFileSync(f, t, "utf8");
  console.log(f, "remaining", left);
  if (left) {
    for (const m of t.matchAll(/.{0,30}\uFFFD.{0,30}/g)) {
      console.log(" ", JSON.stringify(m[0]));
    }
  }
}
