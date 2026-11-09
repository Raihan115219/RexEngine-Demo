# RexEngine-Demo

Interactive frontend demo of **RexEngine** — an AI-powered social media marketing platform for real estate.

Built with HTML, CSS, Tailwind CSS (CDN) and vanilla JavaScript. No build step.

## Run

Open `landing.html` (marketing landing page) or `index.html` (dashboard) in a browser. An internet connection is needed for Tailwind, Lucide icons, Google Fonts and Unsplash images.

Some browsers block local scripts when opened as files; if the page looks unstyled, serve the folder instead:

```bash
python -m http.server 5174
```

## Landing page

`landing.html` — hero with the floating orb and platform chips, how it works, features, platforms, integrations, FAQ and a final call to action. "Start free" and "Log in" open the dashboard; signing out of the dashboard returns here.

## Dashboard pages

- Overview dashboard
- Properties (URL import + manual entry)
- Content Studio (AI generation demo with live platform previews)
- Content Calendar (month / week / day / list)
- Approvals
- Media Library
- Social Accounts
- Settings

> All data is sample data. No scraping, AI APIs, OAuth or publishing are performed.
