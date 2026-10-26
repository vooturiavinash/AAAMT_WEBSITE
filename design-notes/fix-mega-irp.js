const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const oldBlock =
  '              <a class="mega-card mega-product mega-irp" href="https://instituterun.com/" target="_blank" rel="noopener noreferrer" aria-label="InstituteRun — open website">\n' +
  '                <img class="mega-irp-img" src="assets/images/irp.png" alt="InstituteRun: AI-Powered Automation and Communication Platform for Schools, Colleges and Universities" width="425" height="224">\n' +
  "              </a>";

const newBlock =
  '              <a class="mega-card mega-product" href="https://instituterun.com/" target="_blank" rel="noopener noreferrer">\n' +
  '                <img class="mega-product-logo" src="assets/icons/instituterun-mega.svg" alt="" width="35" height="48">\n' +
  "                <h3>InstituteRun</h3>\n" +
  "                <p>AI-Powered Automation &amp; Communication Platform for<br>Schools, Colleges &amp; Universities</p>\n" +
  "              </a>";

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const p = path.join(root, file);
  let t = fs.readFileSync(p, "utf8");
  const normalized = t.replace(/\r\n/g, "\n");
  if (!normalized.includes(oldBlock)) {
    console.log("skip", file);
    continue;
  }
  const updated = normalized
    .replace(oldBlock, newBlock)
    .replace("css/base.css?v=megamenu3", "css/base.css?v=megamenu4");
  fs.writeFileSync(p, updated.replace(/\n/g, "\r\n"));
  console.log("ok", file);
}
