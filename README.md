<<<<<<< HEAD
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
=======
# Expense Tracker

A beginner-friendly SDC project built using only HTML, CSS and JavaScript.

## Requirements covered
1. Problem statement: track transactions, categories, budgets and financial insights.
2. Two modules: Admin and User.
3. HTML, CSS and JavaScript only.
4. CSS Grid/Flexbox responsive UI.
5. Signup/Login with Local Storage.
6. JavaScript role-based navigation.
7. Working transactions, budgets, reports, CSV export and admin management.
8. GitHub-ready project.

## Admin login
Email: admin@expense.com
Password: admin123

## How to run
Open `index.html` in a browser.

## Important note
This project uses Local Storage, so authentication and data are intended for an academic/demo application, not real financial security.
>>>>>>> 0f77f5f21f53d2bb7a7db6f2d025ef9b5c57f4f0
