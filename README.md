# AAAMT Website

Static HTML/CSS/JS site for AAAMT. No PHP or Python is required to run the pages.

## Run on any PC

```bash
git clone https://github.com/vooturiavinash/AAAMT_WEBSITE.git
cd AAAMT_WEBSITE
npm install
npm start
```

Then open **http://127.0.0.1:8765**

Use `npm start` (or `node serve.js`). Do **not** open the HTML files with double-click (`file://`) — careers, contact, and the chatbot need a local web server.

### What works with `npm start`

| Area | Works |
| --- | --- |
| Home, Careers, Contact, Partnership pages | Yes — nav uses portable `*.html` links (also works on plain static hosts) |
| Chatbot (Nemo) | Yes — locally uses same-origin `/api/chat` via `serve.js` (CORS blocks calling the RAG API from localhost). On **https://aaamt.in** the widget calls the deployed RAG API directly |
| Contact enquiry form | Yes — posts to the live enquiry API |
| Partnership email | Needs `smtp.env` (copy from `smtp.env.example`) |

### Plain static server (no Node proxies)

Pages still load if you serve the repo root with any static server, because links are `careers.html` / `contact.html` (not `/careers`). Chatbot replies need `npm start` (or another reverse proxy to `/api/chat`) when the page origin is localhost.

## Important folders

- `careers.html`, `contact.html` — careers & contact pages
- `js/chatbot.js`, `js/chatbot-api.js`, `js/chatbot-config.js`, `css/chatbot.css`
- `chat-widget/` — embedded assistant UI (assets must stay next to `chat-widget/index.html`)
- `serve.js` — local static server + `/api/chat`, enquiry, and partnership mail proxies

## Notes

- Keep the repo root as the server root (the folder that contains `index.html` and `serve.js`).
- `smtp.env` is gitignored — never commit SMTP passwords.
- Clean URLs (`/careers`) still work with `serve.js` or Apache (`.htaccess`). Portable `.html` links also work without rewrite rules.
