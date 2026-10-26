const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const doqzyEnd =
  '              <a class="mega-card mega-product" href="https://doqzy.com/" target="_blank" rel="noopener noreferrer">\n' +
  '                <span class="mega-doqzy-mark" aria-hidden="true">D</span>\n' +
  "                <h3>Doqzy</h3>\n" +
  "                <p>AI-Powered Contract Management for Legal, Procurement, Finance, Sales &amp; Operations Teams</p>\n" +
  "              </a>\n" +
  "            </div>";

const withNote =
  '              <a class="mega-card mega-product" href="https://doqzy.com/" target="_blank" rel="noopener noreferrer">\n' +
  '                <span class="mega-doqzy-mark" aria-hidden="true">D</span>\n' +
  "                <h3>Doqzy</h3>\n" +
  "                <p>AI-Powered Contract Management for Legal, Procurement, Finance, Sales &amp; Operations Teams</p>\n" +
  "              </a>\n" +
  '              <div class="mega-note">\n' +
  '                <div class="mega-note-copy">\n' +
  "                  <strong>One Company.<br>A growing product portfolio</strong>\n" +
  "                  <p>Discover the people, principles and ambition behind AAAMT..</p>\n" +
  "                </div>\n" +
  "              </div>\n" +
  "            </div>";

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const p = path.join(root, file);
  let t = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  if (!t.includes(doqzyEnd)) {
    console.log("skip", file);
    continue;
  }
  t = t
    .replace(doqzyEnd, withNote)
    .replace(/css\/base\.css\?v=[^"]+/g, "css/base.css?v=meganote1");
  fs.writeFileSync(p, t.replace(/\n/g, "\r\n"));
  console.log("ok", file);
}
