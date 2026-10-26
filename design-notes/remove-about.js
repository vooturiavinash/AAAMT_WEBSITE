const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const megaNote = `              <a class="mega-note" href="about.html">
                <div class="mega-note-copy">
                  <strong>One Company.<br>A growing product portfolio</strong>
                  <p>Discover the people, principles and ambition behind AAAMT..</p>
                </div>
                <span>About AAAMT <img src="assets/icons/arrow-orange.svg" alt="" width="24" height="24"></span>
              </a>
`;

const pathAboutIndex = `          <article class="path-card">
            <img src="assets/images/path-about1.jpeg" alt="AAAMT team standing together">
            <h3>Get to know AAAMT</h3>
            <p>Understand our products, people and operating philosophy.</p>
            <a href="about.html">About AAAMT <img src="assets/icons/arrow-orange.svg" alt="" width="24" height="24"></a>
          </article>
`;

const pathAboutProducts =
  `          <article class="path-card"><img src="assets/images/path-about.png" alt=""><h3>Get to know AAAMT</h3><p>Understand our products, people and operating philosophy.</p><a href="about.html">About AAAMT <img src="assets/icons/arrow-orange.svg" alt="" width="24" height="24"></a></article>
`;

for (const file of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  const p = path.join(root, file);
  let t = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  const before = t;

  // Nav About Us (with optional is-current)
  t = t.replace(/\n\s*<a class="nav-link(?: is-current)?" href="about\.html">About Us<\/a>/g, "");

  // Footer / inline About Us link
  t = t.replace(/<a href="about\.html">About Us<\/a>/g, "");

  // Mega About AAAMT card
  t = t.replace(megaNote, "");

  // Path cards
  t = t.replace(pathAboutIndex, "");
  t = t.replace(pathAboutProducts, "");

  // Hero CTA that pointed at about
  t = t.replace(
    '<a class="btn btn-white" href="about.html">Our approach</a>',
    '<a class="btn btn-white" href="contact.html">Get in Touch</a>'
  );

  // Cache bumps
  t = t
    .replace(/css\/base\.css\?v=megamenu\d+/g, "css/base.css?v=noabout1")
    .replace(/css\/home\.css\?v=[^"]+/g, "css/home.css?v=noabout1");

  if (t !== before) {
    fs.writeFileSync(p, t.replace(/\n/g, "\r\n"));
    console.log("updated", file);
  } else {
    console.log("skip", file);
  }
}

const aboutPath = path.join(root, "about.html");
if (fs.existsSync(aboutPath)) {
  fs.unlinkSync(aboutPath);
  console.log("deleted about.html");
}
