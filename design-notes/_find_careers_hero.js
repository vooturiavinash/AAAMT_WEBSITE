const fs = require("fs");
const path = require("path");
const dir = path.join(
  process.env.USERPROFILE || "",
  ".cursor",
  "projects",
  "c-Users-User-OneDrive-Desktop-AAAMT-1",
  "agent-tools"
);
const keys = [
  "Grow through ownership",
  "BUILD YOUR CAREERS",
  "Build products",
  "Discover life at AAAMT",
  "View open roles",
];
if (!fs.existsSync(dir)) {
  console.log("no agent-tools");
  process.exit(0);
}
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith(".txt") && !f.endsWith(".json")) continue;
  const t = fs.readFileSync(path.join(dir, f), "utf8");
  if (keys.some((k) => t.includes(k))) console.log("hit", f);
}
