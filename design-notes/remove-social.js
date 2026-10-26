const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");

const patterns = [
  /\s*<a class="icon-bubble" href="https:\/\/instagram\.com"[^>]*>[\s\S]*?<\/a>/g,
  /\s*<a class="icon-bubble" href="https:\/\/youtube\.com"[^>]*>[\s\S]*?<\/a>/g,
];

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const p = path.join(root, file);
  let text = fs.readFileSync(p, "utf8");
  const before = text;
  for (const re of patterns) text = text.replace(re, "");
  if (text !== before) {
    fs.writeFileSync(p, text);
    console.log("updated", file);
  } else {
    console.log("skip", file);
  }
}
