
import React, { useState } from 'react';
import {
  useNavigate,
  useLocation,
  Navigate,
  Link
} from 'react-router-dom';

import './style.css';

const ADMIN = 'admin@expense.com';

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const write = (key, val) =>
  localStorage.setItem(key, JSON.stringify(val));

const users = () => read('expenseUsers', []);
const transactions = () => read('expenseData', []);
const budgets = () => read('expenseBudgets', {});

const money = n => '₹' + Number(n || 0).toFixed(2);
const current = () => read('currentUser', null);

const cats = [
  'Food',
  'Travel',
  'Education',
  'Shopping',
  'Bills',
  'Health',
  'Entertainment',
  'Other'
];

// ==================== MAIN APP ====================

function App() {
  const [session, setSession] = useState(current());
  const [tick, setTick] = useState(0);

  const nav = useNavigate();
  const loc = useLocation();

  const refresh = () => setTick(t => t + 1);

  const logout = () => {
    localStorage.removeItem('currentUser');
    setSession(null);
    nav('/');
  };

  function login(u) {
    write('currentUser', u);
    setSession(u);
    nav(u.role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }

  if (loc.pathname === '/signup') {
    return <Signup nav={nav} />;
  }

  if (loc.pathname === '/' || loc.pathname === '/index.html') {
    return <Login login={login} />;
  }

  const role = loc.pathname.startsWith('/admin') ? 'admin' : 'user';

  if (!session || session.role !== role) {
    return <Navigate to="/" replace />;
  }

  const links = role === 'admin'
    ? [
        ['/admin/dashboard', 'Dashboard'],
        ['/admin/users', 'Users'],
        ['/admin/transactions', 'Transactions']
      ]
    : [
        ['/user/dashboard', 'Dashboard'],
        ['/user/add-expense', 'Add Transaction'],
        ['/user/expenses', 'Transactions'],
        ['/user/budget', 'Budget'],
        ['/user/reports', 'Reports']
      ];

  const page = loc.pathname.split('/').pop();

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>
          {role === 'admin' ? 'Admin Panel' : 'Expense Tracker'}
        </h2>

        <nav>
          {links.map(([path, label]) => (
            <Link
              key={path}
              className={loc.pathname === path ? 'active' : ''}
              to={path}
            >
              {label}
            </Link>
          ))}

          <a
            href="#"
            onClick={e => {
              e.preventDefault();
              logout();
            }}
          >
            Logout
          </a>
        </nav>
      </aside>

      <main className="content">
        {role === 'admin' ? (
          page === 'users' ? (
            <AdminUsers refresh={refresh} />
          ) : page === 'transactions' ? (
            <AdminTransactions refresh={refresh} />
          ) : (
            <AdminDashboard />
          )
        ) : (
          page === 'add-expense' ? (
            <AddTransaction session={session} refresh={refresh} />
          ) : page === 'expenses' ? (
            <Transactions session={session} refresh={refresh} />
          ) : page === 'budget' ? (
            <Budget session={session} refresh={refresh} />
          ) : page === 'reports' ? (
            <Reports session={session} />
          ) : (
            <Dashboard session={session} />
          )
        )}
      </main>
    </div>
  );
}

// ==================== LOGIN ====================

function Login({ login }) {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  function submit(e) {
    e.preventDefault();

    const em = email.trim().toLowerCase();
    let u = null;

    if (role === 'admin') {
      if (em === ADMIN && password === 'admin123') {
        u = {
          name: 'Administrator',
          email: ADMIN,
          role: 'admin'
        };
      }
    } else if (role === 'user') {
      const found = users().find(
        x => x.email === em && x.password === password
      );

      if (found) {
        u = {
          name: found.name,
          email: found.email,
          role: 'user'
        };
      }
    }

    if (!u) {
      setMsg(
        'Invalid ' +
        (role === 'admin' ? 'admin' : 'user') +
        ' email or password.'
      );
      return;
    }

    login(u);
  }

  return (
    <div className="auth-body">
      <div className="auth-card">
        <h1>Expense Tracker</h1>

        <p className="muted">
          Track your money. Manage your goals.
        </p>

        {!role ? (
          <>
            <h2>Login as</h2>

            <p className="muted">
              Please select your account type to continue.
            </p>

            <div className="role-choices">
              <button
                className="role-choice"
                onClick={() => {
                  setRole('admin');
                  setMsg('');
                }}
                type="button"
              >
                <span className="role-icon">A</span>
                <strong>Admin Login</strong>
                <small>Manage users and transactions</small>
              </button>

              <button
                className="role-choice"
                onClick={() => {
                  setRole('user');
                  setMsg('');
                }}
                type="button"
              >
                <span className="role-icon">U</span>
                <strong>User Login</strong>
                <small>Track expenses and budgets</small>
              </button>
            </div>

            <p>
              New user? <Link to="/signup">Create an account</Link>
            </p>
          </>
        ) : (
          <>
            <div className="role-heading">
              <h2>
                {role === 'admin' ? 'Admin Login' : 'User Login'}
              </h2>

              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setRole('');
                  setEmail('');
                  setPassword('');
                  setMsg('');
                }}
              >
                Change role
              </button>
            </div>

            <form onSubmit={submit}>
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />

              <label>Password</label>

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />

              <button className="btn primary">
                Login as {role === 'admin' ? 'Admin' : 'User'}
              </button>
            </form>

            <p className="message warning" role="alert">
              {msg}
            </p>

            {role === 'admin' ? (
              <div className="demo-box">
                <b>Admin demo credentials</b>
                <br />
                Email: admin@expense.com
                <br />
                Password: admin123
              </div>
            ) : (
              <p>
                New user? <Link to="/signup">Create an account</Link>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ==================== SIGNUP ====================

function Signup({ nav }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  function submit(e) {
    e.preventDefault();

    const em = email.trim().toLowerCase();

    if (em === ADMIN || users().some(u => u.email === em)) {
      return setMsg('Email already registered.');
    }

    write('expenseUsers', [
      ...users(),
      {
        id: Date.now(),
        name: name.trim(),
        email: em,
        password,
        createdAt: new Date().toISOString()
      }
    ]);

    nav('/');
  }

  return (
    <div className="auth-body">
      <div className="auth-card">
        <h1>Create Account</h1>

        <p className="muted">
          Start tracking your expenses.
        </p>

        <form onSubmit={submit}>
          <label>Full Name</label>

          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />

          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            minLength="4"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button className="btn primary">
            Sign Up
          </button>
        </form>

        <p className="message warning">{msg}</p>

        <p>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

// ==================== USER DASHBOARD ====================

function Dashboard({ session }) {
  const a = transactions().filter(
    x => x.email === session.email
  );

  const inc = a
    .filter(x => x.type === 'income')
    .reduce((s, x) => s + Number(x.amount), 0);

  const exp = a
    .filter(x => x.type === 'expense')
    .reduce((s, x) => s + Number(x.amount), 0);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const vals = months.map((_, i) =>
    a
      .filter(
        x =>
          x.type === 'expense' &&
          new Date(x.date).getMonth() === i
      )
      .reduce((s, x) => s + Number(x.amount), 0)
  );

  const max = Math.max(1, ...vals);

  return (
    <>
      <div className="topbar">
        <h1>Dashboard</h1>
        <span>Welcome, {session.name}</span>
      </div>

      <div className="cards">
        {[
          ['Total Income', money(inc)],
          ['Total Expenses', money(exp)],
          ['Balance', money(inc - exp)],
          ['Transactions', a.length]
        ].map(([label, value]) => (
          <div className="card" key={label}>
            <h3>{label}</h3>
            <div className="amount">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <section className="form-card">
          <h2>Monthly Expense Chart</h2>

          <div className="chart">
            {vals.map((v, i) => (
              <div
                key={i}
                className="bar"
                style={{
                  height: Math.max(v / max * 170, 5) + 'px'
                }}
              >
                <small>{money(v)}</small>
                <span>{months[i]}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="form-card">
          <h2>Recent Transactions</h2>

          {a.length ? (
            a.slice(-5).reverse().map(x => (
              <p key={x.id}>
                <b>{x.title}</b> - {money(x.amount)}
                {' '}
                <span className={'badge ' + x.type}>
                  {x.type}
                </span>
              </p>
            ))
          ) : (
            <div className="empty">No transactions yet.</div>
          )}
        </section>
      </div>
    </>
  );
}

// ==================== ADD TRANSACTION ====================

function AddTransaction({ session, refresh }) {
  const [msg, setMsg] = useState('');

  function submit(e) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    write('expenseData', [
      ...transactions(),
      {
        id: Date.now(),
        email: session.email,
        type: f.get('type'),
        title: f.get('title'),
        amount: Number(f.get('amount')),
        category: f.get('category'),
        date: f.get('date'),
        note: f.get('note')
      }
    ]);

    e.currentTarget.reset();
    setMsg('Transaction saved successfully.');
    refresh();
  }

  return (
    <>
      <h1>Add Transaction</h1>

      <section className="form-card">
        <form onSubmit={submit}>
          <label>Type</label>

          <select name="type">
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <label>Title</label>

          <input
            name="title"
            placeholder="e.g. Food"
            required
          />

          <label>Amount</label>

          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
          />

          <label>Category</label>

          <select name="category">
            {cats.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <label>Date</label>

          <input
            name="date"
            type="date"
            defaultValue={new Date().toLocaleDateString('en-CA')}
            required
          />

          <label>Note</label>

          <textarea name="note" rows="3" />

          <button className="btn primary">
            Save Transaction
          </button>
        </form>

        <p className="success">{msg}</p>
      </section>
    </>
  );
}

// ==================== TRANSACTIONS ====================

function Transactions({ session, refresh }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  const a = transactions().filter(
    x =>
      x.email === session.email &&
      (filter === 'all' || x.type === filter) &&
      (
        x.title.toLowerCase().includes(search.toLowerCase()) ||
        x.category.toLowerCase().includes(search.toLowerCase())
      )
  );

  function del(id) {
    if (!confirm('Delete transaction?')) return;

    write(
      'expenseData',
      transactions().filter(x => x.id !== id)
    );

    refresh();
  }

  function edit(e) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    write(
      'expenseData',
      transactions().map(x =>
        x.id === editing.id
          ? {
              ...x,
              title: f.get('title'),
              amount: Number(f.get('amount')),
              category: f.get('category'),
              date: f.get('date')
            }
          : x
      )
    );

    setEditing(null);
    refresh();
  }

  return (
    <>
      <h1>Transactions</h1>

      <div className="toolbar">
        <input
          placeholder="Search title/category"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      {editing && (
        <section className="form-card">
          <h2>Edit Transaction</h2>

          <form onSubmit={edit}>
            <label>Title</label>

            <input
              name="title"
              defaultValue={editing.title}
              required
            />

            <label>Amount</label>

            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={editing.amount}
              required
            />

            <label>Category</label>

            <select
              name="category"
              defaultValue={editing.category}
            >
              {cats.map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>

            <label>Date</label>

            <input
              name="date"
              type="date"
              defaultValue={editing.date}
              required
            />

            <button className="btn primary">
              Save Changes
            </button>

            <button
              type="button"
              className="btn secondary"
              onClick={() => setEditing(null)}
            >
              Cancel
            </button>
          </form>
        </section>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {a.length ? (
              a.map(x => (
                <tr key={x.id}>
                  <td>{x.date}</td>
                  <td>{x.title}</td>
                  <td>{x.category}</td>

                  <td>
                    <span className={'badge ' + x.type}>
                      {x.type}
                    </span>
                  </td>

                  <td>{money(x.amount)}</td>

                  <td>
                    <button
                      className="btn secondary"
                      onClick={() => setEditing(x)}
                    >
                      Edit
                    </button>

                    {' '}

                    <button
                      className="btn danger"
                      onClick={() => del(x.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ==================== BUDGET ====================

function Budget({ session, refresh }) {
  const [budget, setBudget] = useState(
    budgets()[session.email] || 0
  );

  const [msg, setMsg] = useState('');

  const now = new Date();

  const spent = transactions()
    .filter(
      x =>
        x.email === session.email &&
        x.type === 'expense' &&
        new Date(x.date).getMonth() === now.getMonth() &&
        new Date(x.date).getFullYear() === now.getFullYear()
    )
    .reduce((s, x) => s + Number(x.amount), 0);

  return (
    <>
      <h1>Monthly Budget</h1>

      <section className="form-card">
        <form
          onSubmit={e => {
            e.preventDefault();

            write('expenseBudgets', {
              ...budgets(),
              [session.email]: Number(budget)
            });

            setMsg('Budget saved.');
            refresh();
          }}
        >
          <label>Monthly Budget (₹)</label>

          <input
            type="number"
            min="0"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            required
          />

          <button className="btn primary">
            Save Budget
          </button>
        </form>

        <p className="success">{msg}</p>
      </section>

      <section className="form-card">
        <h2>Budget Usage</h2>

        <p>
          Spent this month: <b>{money(spent)}</b>
        </p>

        <p>
          Budget: <b>{money(budgets()[session.email] || 0)}</b>
        </p>

        <div className="progress">
          <div
            style={{
              width: Math.min(
                100,
                budgets()[session.email]
                  ? spent / budgets()[session.email] * 100
                  : 0
              ) + '%'
            }}
          />
        </div>

        <p
          className={
            budgets()[session.email] &&
            spent > budgets()[session.email]
              ? 'warning'
              : 'success'
          }
        >
          {budgets()[session.email] &&
          spent > budgets()[session.email]
            ? 'Budget exceeded!'
            : 'You are within your budget.'}
        </p>
      </section>
    </>
  );
}

// ==================== REPORTS ====================

function Reports({ session }) {
  const a = transactions().filter(
    x => x.email === session.email
  );

  const inc = a
    .filter(x => x.type === 'income')
    .reduce((s, x) => s + Number(x.amount), 0);

  const exp = a
    .filter(x => x.type === 'expense')
    .reduce((s, x) => s + Number(x.amount), 0);

  const groups = {};

  a
    .filter(x => x.type === 'expense')
    .forEach(x => {
      groups[x.category] =
        (groups[x.category] || 0) + Number(x.amount);
    });

  function exportCSV() {
    const rows = [
      ['Date', 'Title', 'Category', 'Type', 'Amount', 'Note'],
      ...a.map(x => [
        x.date,
        x.title,
        x.category,
        x.type,
        x.amount,
        x.note
      ])
    ];

    const csv = rows
      .map(r =>
        r
          .map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"')
          .join(',')
      )
      .join('\n');

    const url = URL.createObjectURL(
      new Blob([csv], { type: 'text/csv' })
    );

    const el = document.createElement('a');
    el.href = url;
    el.download = 'expense-report.csv';
    el.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <div className="topbar">
        <h1>Reports & Insights</h1>

        <button className="btn primary" onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <div className="grid-2">
        <section className="form-card">
          <h2>Category Spending</h2>

          {Object.keys(groups).length ? (
            Object.entries(groups).map(([k, v]) => (
              <p key={k}>
                <b>{k}</b>: {money(v)}
              </p>
            ))
          ) : (
            <div className="empty">No expense data.</div>
          )}
        </section>

        <section className="form-card">
          <h2>Financial Summary</h2>

          <p>Total income: <b>{money(inc)}</b></p>
          <p>Total expenses: <b>{money(exp)}</b></p>
          <p>Balance: <b>{money(inc - exp)}</b></p>
          <p>Total transactions: <b>{a.length}</b></p>
        </section>
      </div>
    </>
  );
}

// ==================== ADMIN DASHBOARD ====================

function AdminDashboard() {
  const a = transactions();

  return (
    <>
      <h1>Admin Dashboard</h1>

      <div className="cards">
        {[
          ['Registered Users', users().length],
          ['Transactions', a.length],
          [
            'Total Income',
            money(
              a
                .filter(x => x.type === 'income')
                .reduce((s, x) => s + Number(x.amount), 0)
            )
          ],
          [
            'Total Expenses',
            money(
              a
                .filter(x => x.type === 'expense')
                .reduce((s, x) => s + Number(x.amount), 0)
            )
          ]
        ].map(([k, v]) => (
          <div className="card" key={k}>
            <h3>{k}</h3>
            <div className="amount">{v}</div>
          </div>
        ))}
      </div>

      <section className="form-card">
        <h2>System Overview</h2>

        <p>
          Admin can monitor registered users and all transactions
          stored in this browser.
        </p>
      </section>
    </>
  );
}

// ==================== ADMIN USERS ====================

function AdminUsers({ refresh }) {
  function del(email) {
    if (!confirm('Delete user and their transactions?')) return;

    write(
      'expenseUsers',
      users().filter(x => x.email !== email)
    );

    write(
      'expenseData',
      transactions().filter(x => x.email !== email)
    );

    const b = budgets();
    delete b[email];

    write('expenseBudgets', b);

    refresh();
  }

  return (
    <>
      <h1>Registered Users</h1>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {users().length ? (
              users().map(x => (
                <tr key={x.id}>
                  <td>{x.name}</td>
                  <td>{x.email}</td>
                  <td>
                    {new Date(x.createdAt).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      className="btn danger"
                      onClick={() => del(x.email)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty">
                  No users registered.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ==================== ADMIN TRANSACTIONS ====================

function AdminTransactions({ refresh }) {
  function del(id) {
    if (!confirm('Delete transaction?')) return;

    write(
      'expenseData',
      transactions().filter(x => x.id !== id)
    );

    refresh();
  }

  return (
    <>
      <h1>All Transactions</h1>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Title</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {transactions().length ? (
              transactions().map(x => (
                <tr key={x.id}>
                  <td>{x.date}</td>

                  <td>
                    {users().find(u => u.email === x.email)?.name ||
                      x.email}
                  </td>

                  <td>{x.title}</td>
                  <td>{x.category}</td>

                  <td>
                    <span className={'badge ' + x.type}>
                      {x.type}
                    </span>
                  </td>

                  <td>{money(x.amount)}</td>

                  <td>
                    <button
                      className="btn danger"
                      onClick={() => del(x.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty">
                  No transactions.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default App;
