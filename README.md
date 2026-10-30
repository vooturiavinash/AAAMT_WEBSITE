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

Use `npm start` (or `node serve.js`). Do not open the HTML files with double-click (`file://`) — careers, contact, and the chatbot need a local web server.

### What works without extra setup

| Area | Works with `npm start` |
| --- | --- |
| Home, Careers, Contact, Partnership pages | Yes — links use portable `.html` paths |
| Chatbot (Nemo) | Yes — calls the deployed RAG API directly |
| Contact enquiry form | Yes — posts to the live enquiry API |
| Partnership email | Needs `smtp.env` (copy from `smtp.env.example`) |

## Important folders

- `careers.html`, `contact.html` — careers & contact pages
- `js/chatbot.js`, `js/chatbot-api.js`, `js/chatbot-config.js`, `css/chatbot.css`
- `chat-widget/` — embedded assistant UI (assets must stay next to `index.html`)
- `serve.js` — local static server + optional `/api/chat` and mail proxies

## Notes

- Keep the repo root as the server root (the folder that contains `index.html` and `serve.js`).
- `smtp.env` is gitignored — never commit SMTP passwords.
- Clean URLs (`/careers`) still work with `serve.js`, Apache (`.htaccess`), or IIS (`web.config`). Portable `.html` links also work with other static servers.
