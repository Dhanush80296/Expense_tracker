# Expense Tracker — Original Design, React + Vite

Converted from the uploaded original HTML/CSS/JavaScript project. The original `css/style.css` is preserved unchanged, and the same pages, labels, dashboard cards, navigation and functionality are implemented with React components.

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Admin demo
- Email: admin@expense.com
- Password: admin123

## Vercel
Push the project to GitHub and import into Vercel. Framework: Vite. Build: `npm run build`. Output: `dist`. The included `vercel.json` supports direct links to routes.

## Review
React + Vite, User/Admin modules, signup/login using Local Storage, transactions, budgets, reports and CSV export.

## Limitations
Local Storage is browser/device-specific. Passwords stored in Local Storage and hardcoded admin credentials are **demo-only**, not secure for production. No shared server database is used. Deployment must be performed in your Vercel account.


## Role selection login
The login screen first asks whether to log in as Admin or User. Each selection opens its own login form, and credentials are checked against that selected role. New accounts sign up as users only.


## React component structure
- `src/App.jsx`: Main application component, login/signup, Admin and User modules, routing logic and application features.
- `src/main.jsx`: React entry point. It mounts `App` inside `BrowserRouter`.
- `src/style.css`: Application styling.
