
import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useLocation,
  Navigate,
  Link
} from "react-router-dom";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

import { auth, db } from "./firebase";
import "./style.css";

const ADMIN_EMAIL = "dharmarevu66@gmail.com";

const cats = [
  "Food",
  "Travel",
  "Education",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other"
];

const money = n => "₹" + Number(n || 0).toFixed(2);

// ==========================================
// MAIN APP
// ==========================================

function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");

  const [users, setUsers] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]);
  const [budget, setBudget] = useState(0);

  const [refreshKey, setRefreshKey] = useState(0);

  const nav = useNavigate();
  const loc = useLocation();

  const isAdmin = session?.role === "admin";

  const rolePath = loc.pathname.startsWith("/admin")
    ? "admin"
    : "user";

  // Firebase authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async firebaseUser => {
        try {
          setAuthError("");

          if (!firebaseUser) {
            setSession(null);
            return;
          }

          const email = (firebaseUser.email || "").toLowerCase();

          const role =
            email === ADMIN_EMAIL ? "admin" : "user";

          const profileRef = doc(db, "users", firebaseUser.uid);

          const profile = await getDoc(profileRef);

          const profileData = profile.exists()
            ? profile.data()
            : {};

          const userData = {
            uid: firebaseUser.uid,
            name:
              profileData.name ||
              (role === "admin"
                ? "Administrator"
                : email.split("@")[0]),
            email,
            role
          };

          if (!profile.exists()) {
            await setDoc(profileRef, {
              ...userData,
              createdAt: serverTimestamp()
            });
          }

          // Save the most recent authenticated access time for the admin users list.
          await setDoc(profileRef, {
            lastAccessedAt: serverTimestamp()
          }, { merge: true });

          setSession(userData);

        } catch (error) {
          console.error("Authentication error:", error);
          setAuthError(error.message);
          setSession(null);

        } finally {
          setAuthReady(true);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  // Firestore real-time listeners
  useEffect(() => {
    if (!session) {
      setUsers([]);
      setAllTransactions([]);
      setBudget(0);
      return;
    }

    const transactionsRef = collection(db, "transactions");

    const txQuery = isAdmin
      ? transactionsRef
      : query(
          transactionsRef,
          where("uid", "==", session.uid)
        );

    const unsubscribeTransactions = onSnapshot(
      txQuery,
      snapshot => {
        setAllTransactions(
          snapshot.docs.map(d => ({
            id: d.id,
            ...d.data()
          }))
        );
      },
      error => {
        console.error("Transaction listener:", error);
      }
    );

    let unsubscribeUsers = () => {};

    if (isAdmin) {
      unsubscribeUsers = onSnapshot(
        collection(db, "users"),
        snapshot => {
          setUsers(
            snapshot.docs.map(d => ({
              uid: d.id,
              ...d.data()
            }))
          );
        },
        error => {
          console.error("Users listener:", error);
        }
      );
    }

    const budgetRef = doc(db, "budgets", session.uid);

    const unsubscribeBudget = onSnapshot(
      budgetRef,
      snapshot => {
        setBudget(
          snapshot.exists()
            ? Number(snapshot.data().amount || 0)
            : 0
        );
      },
      error => {
        console.error("Budget listener:", error);
      }
    );

    return () => {
      unsubscribeTransactions();
      unsubscribeUsers();
      unsubscribeBudget();
    };

  }, [session, isAdmin, refreshKey]);

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setSession(null);
      nav("/");
    } catch (error) {
      alert(error.message);
    }
  };

  if (!authReady) {
    return (
      <div className="auth-body">
        <div className="auth-card">
          Loading your account...
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="auth-body">
        <div className="auth-card">
          <h2>Unable to load account</h2>
          <p className="message warning">{authError}</p>
          <button
            className="btn primary"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loc.pathname === "/signup") {
    return <Signup />;
  }

  if (!session) {
    return <Login />;
  }

  if (rolePath !== session.role) {
    return (
      <Navigate
        to={
          session.role === "admin"
            ? "/admin/dashboard"
            : "/user/dashboard"
        }
        replace
      />
    );
  }

  const links = isAdmin
    ? [
        ["/admin/dashboard", "Dashboard"],
        ["/admin/users", "Users"],
        ["/admin/transactions", "Transactions"]
      ]
    : [
        ["/user/dashboard", "Dashboard"],
        ["/user/add-expense", "Add Transaction"],
        ["/user/expenses", "Transactions"],
        ["/user/budget", "Budget"],
        ["/user/reports", "Reports"]
      ];

  const pathParts = loc.pathname.split("/").filter(Boolean);
  const page = pathParts[1] || "";
  const selectedUserId = pathParts[2] || "";

  const myTransactions = allTransactions.filter(
    t => t.uid === session.uid
  );

  const refresh = () => {
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="app">

      <aside className="sidebar">
        <h2>
          {isAdmin ? "Admin Panel" : "Expense Tracker"}
        </h2>

        <nav>
          {links.map(([path, label]) => (
            <Link
              key={path}
              className={
                loc.pathname === path ? "active" : ""
              }
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

        {isAdmin ? (
          page === "users" && selectedUserId ? (
            <AdminUserTransactions
              user={users.find(u => u.uid === selectedUserId)}
              transactions={allTransactions.filter(t => t.uid === selectedUserId)}
            />
          ) : page === "users" ? (
            <AdminUsers
              users={users}
              transactions={allTransactions}
            />
          ) : page === "transactions" ? (
            <AdminTransactions
              transactions={allTransactions}
              users={users}
              refresh={refresh}
            />
          ) : (
            <AdminDashboard
              users={users}
              transactions={allTransactions}
            />
          )
        ) : page === "add-expense" ? (
          <AddTransaction session={session} />
        ) : page === "expenses" ? (
          <Transactions
            session={session}
            transactions={myTransactions}
            refresh={refresh}
          />
        ) : page === "budget" ? (
          <Budget
            budget={budget}
            session={session}
            transactions={myTransactions}
          />
        ) : page === "reports" ? (
          <Reports transactions={myTransactions} />
        ) : (
          <Dashboard
            session={session}
            transactions={myTransactions}
          />
        )}

      </main>
    </div>
  );
}

// ==========================================
// LOGIN
// ==========================================

function Login() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();

    const em = email.trim().toLowerCase();

    if (role === "admin" && em !== ADMIN_EMAIL) {
      setMsg("Please use the registered administrator email.");
      return;
    }

    if (role === "user" && em === ADMIN_EMAIL) {
      setMsg("Please select Admin Login for this email.");
      return;
    }

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        em,
        password
      );

      const actualEmail = (
        result.user.email || ""
      ).toLowerCase();

      if (
        (role === "admin" && actualEmail !== ADMIN_EMAIL) ||
        (role === "user" && actualEmail === ADMIN_EMAIL)
      ) {
        await signOut(auth);
        setMsg("Incorrect account type selected.");
        return;
      }

      nav(
        role === "admin"
          ? "/admin/dashboard"
          : "/user/dashboard"
      );

    } catch (err) {
      setMsg(authMessage(err));
    }
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
                type="button"
                onClick={() => {
                  setRole("admin");
                  setMsg("");
                }}
              >
                <span className="role-icon">A</span>
                <strong>Admin Login</strong>
                <small>
                  Manage users and transactions
                </small>
              </button>

              <button
                className="role-choice"
                type="button"
                onClick={() => {
                  setRole("user");
                  setMsg("");
                }}
              >
                <span className="role-icon">U</span>
                <strong>User Login</strong>
                <small>
                  Track expenses and budgets
                </small>
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
                {role === "admin"
                  ? "Admin Login"
                  : "User Login"}
              </h2>

              <button
                className="btn secondary"
                type="button"
                onClick={() => {
                  setRole("");
                  setEmail("");
                  setPassword("");
                  setMsg("");
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
                Login as {role === "admin" ? "Admin" : "User"}
              </button>
            </form>

            <p className="message warning" role="alert">
              {msg}
            </p>

            {role === "user" && (
              <p>
                New user? <Link to="/signup">Create an account</Link>
              </p>
            )}

            {role === "admin" && (
              <div className="demo-box">
                Admin account: {ADMIN_EMAIL}
                <br />
                Use the password you set in Firebase Authentication.
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

// ==========================================
// SIGNUP
// ==========================================

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const nav = useNavigate();

  async function submit(e) {
    e.preventDefault();

    const em = email.trim().toLowerCase();

    if (em === ADMIN_EMAIL) {
      setMsg("This email is reserved for the administrator.");
      return;
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        em,
        password
      );

      await setDoc(
        doc(db, "users", credential.user.uid),
        {
          uid: credential.user.uid,
          name: name.trim(),
          email: em,
          role: "user",
          createdAt: serverTimestamp()
        }
      );

      nav("/user/dashboard");

    } catch (err) {
      setMsg(authMessage(err));
    }
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
            minLength="6"
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

// ==========================================
// ERROR MESSAGES
// ==========================================

function authMessage(err) {
  const messages = {
    "auth/email-already-in-use":
      "This email is already registered. Please log in.",

    "auth/invalid-credential":
      "Incorrect email or password.",

    "auth/weak-password":
      "Password must contain at least 6 characters.",

    "auth/invalid-email":
      "Please enter a valid email address.",

    "auth/network-request-failed":
      "Network error. Check your internet connection."
  };

  return messages[err.code] || err.message || "Something went wrong.";
}

// ==========================================
// USER DASHBOARD
// ==========================================

function Dashboard({ session, transactions }) {
  const a = transactions;

  const inc = a
    .filter(x => x.type === "income")
    .reduce((s, x) => s + Number(x.amount), 0);

  const exp = a
    .filter(x => x.type === "expense")
    .reduce((s, x) => s + Number(x.amount), 0);

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const vals = months.map((_, i) =>
    a
      .filter(
        x =>
          x.type === "expense" &&
          new Date(x.date).getMonth() === i &&
          new Date(x.date).getFullYear() === new Date().getFullYear()
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
          ["Total Income", money(inc)],
          ["Total Expenses", money(exp)],
          ["Balance", money(inc - exp)],
          ["Transactions", a.length]
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
                  height: Math.max((v / max) * 170, 5) + "px"
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
            [...a]
              .sort((x, y) =>
                String(y.date).localeCompare(String(x.date))
              )
              .slice(0, 5)
              .map(x => (
                <p key={x.id}>
                  <b>{x.title}</b> - {money(x.amount)}
                  {" "}
                  <span className={"badge " + x.type}>
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

// ==========================================
// ADD TRANSACTION
// ==========================================

function AddTransaction({ session }) {
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();

    const form = e.currentTarget;
    const f = new FormData(form);

    try {
      await addDoc(collection(db, "transactions"), {
        uid: session.uid,
        email: session.email,
        userName: session.name,
        type: f.get("type"),
        title: f.get("title"),
        amount: Number(f.get("amount")),
        category: f.get("category"),
        date: f.get("date"),
        note: f.get("note") || "",
        createdAt: serverTimestamp()
      });

      form.reset();
      setMsg("Transaction saved successfully.");

    } catch (err) {
      console.error(err);
      setMsg("Could not save transaction: " + err.message);
    }
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
            defaultValue={new Date().toLocaleDateString("en-CA")}
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

// ==========================================
// USER TRANSACTIONS
// ==========================================

function Transactions({ session, transactions, refresh }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);

  const rows = transactions.filter(
    x =>
      (filter === "all" || x.type === filter) &&
      (
        (x.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (x.category || "").toLowerCase().includes(search.toLowerCase())
      )
  );

  async function del(id) {
    if (confirm("Delete transaction?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        refresh();
      } catch (err) {
        alert(err.message);
      }
    }
  }

  async function edit(e) {
    e.preventDefault();

    const f = new FormData(e.currentTarget);

    try {
      await updateDoc(
        doc(db, "transactions", editing.id),
        {
          title: f.get("title"),
          amount: Number(f.get("amount")),
          category: f.get("category"),
          date: f.get("date")
        }
      );

      setEditing(null);
      refresh();

    } catch (err) {
      alert(err.message);
    }
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
            {rows.length ? (
              rows.map(x => (
                <tr key={x.id}>
                  <td>{x.date}</td>
                  <td>{x.title}</td>
                  <td>{x.category}</td>
                  <td>
                    <span className={"badge " + x.type}>
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

// ==========================================
// BUDGET
// ==========================================

function Budget({ budget, session, transactions }) {
  const [value, setValue] = useState(budget);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setValue(budget);
  }, [budget]);

  const spent = transactions
    .filter(x => {
      const d = new Date(x.date);
      const now = new Date();

      return (
        x.type === "expense" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, x) => sum + Number(x.amount), 0);

  async function save(e) {
    e.preventDefault();

    try {
      await setDoc(
        doc(db, "budgets", session.uid),
        {
          uid: session.uid,
          amount: Number(value)
        }
      );

      setMsg("Budget saved.");

    } catch (err) {
      setMsg("Could not save budget: " + err.message);
    }
  }

  return (
    <>
      <h1>Monthly Budget</h1>

      <section className="form-card">

        <form onSubmit={save}>
          <label>Monthly Budget (₹)</label>

          <input
            type="number"
            min="0"
            value={value}
            onChange={e => setValue(e.target.value)}
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
          Budget: <b>{money(budget)}</b>
        </p>

        <div className="progress">
          <div
            style={{
              width:
                Math.min(
                  100,
                  budget ? (spent / budget) * 100 : 0
                ) + "%"
            }}
          />
        </div>

        <p className={budget && spent > budget ? "warning" : "success"}>
          {budget && spent > budget
            ? "Budget exceeded!"
            : "You are within your budget."}
        </p>

      </section>
    </>
  );
}

// ==========================================
// REPORTS
// ==========================================

function Reports({ transactions }) {
  const inc = transactions.filter(x => x.type === "income")
    .reduce((s, x) => s + Number(x.amount), 0);
  const exp = transactions.filter(x => x.type === "expense")
    .reduce((s, x) => s + Number(x.amount), 0);

  const groups = {};
  transactions.filter(x => x.type === "expense").forEach(x => {
    const category = x.category || "Other";
    groups[category] = (groups[category] || 0) + Number(x.amount);
  });

  const categoryRows = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  const maxCategoryAmount = Math.max(1, ...categoryRows.map(([, amount]) => amount));
  const categoryColors = {
    Food: "#f97316",
    Travel: "#0ea5e9",
    Education: "#8b5cf6",
    Shopping: "#ec4899",
    Bills: "#64748b",
    Health: "#10b981",
    Entertainment: "#eab308",
    Other: "#6366f1"
  };
  const fallbackColors = ["#14b8a6", "#a855f7", "#ef4444", "#84cc16", "#3b82f6"];
  const getCategoryColor = (category, index) =>
    categoryColors[category] || fallbackColors[index % fallbackColors.length];

  function exportCSV() {
    const rows = [
      ["Date", "Title", "Category", "Type", "Amount", "Note"],
      ...transactions.map(x => [x.date, x.title, x.category, x.type, x.amount, x.note])
    ];
    const csv = rows.map(r =>
      r.map(v => '"' + String(v ?? "").replaceAll('"', '""') + '"').join(",")
    ).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const el = document.createElement("a");
    el.href = url;
    el.download = "expense-report.csv";
    el.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="topbar">
        <h1>Reports & Insights</h1>
        <button className="btn primary" onClick={exportCSV}>Export CSV</button>
      </div>

      <section className="form-card">
        <h2>Category-wise Spending</h2>
        <p className="muted">Vertical chart showing total expenses in each category</p>
        {categoryRows.length ? (
          <div className="category-chart-vertical">
            {categoryRows.map(([category, amount], index) => (
              <div className="category-chart-column" key={category}>
                <strong className="category-chart-amount">{money(amount)}</strong>
                <div className="category-chart-column-track">
                  <div
                    className="category-chart-column-bar"
                    style={{
                      height: `${(amount / maxCategoryAmount) * 100}%`,
                      backgroundColor: getCategoryColor(category, index)
                    }}
                    title={`${category}: ${money(amount)}`}
                  />
                </div>
                <span className="category-chart-name">{category}</span>
              </div>
            ))}
          </div>
        ) : <div className="empty">No expense data available for the chart.</div>}
      </section>

      <section className="form-card">
        <h2>Financial Summary</h2>
        <div className="summary-grid">
          <div><span>Total income</span><strong>{money(inc)}</strong></div>
          <div><span>Total expenses</span><strong>{money(exp)}</strong></div>
          <div><span>Balance</span><strong>{money(inc - exp)}</strong></div>
          <div><span>Total transactions</span><strong>{transactions.length}</strong></div>
        </div>
      </section>
    </>
  );
}

// ==========================================
// ADMIN DASHBOARD
// ==========================================

function AdminDashboard({ users, transactions }) {
  const income = transactions
    .filter(x => x.type === "income")
    .reduce((s, x) => s + Number(x.amount), 0);

  const expenses = transactions
    .filter(x => x.type === "expense")
    .reduce((s, x) => s + Number(x.amount), 0);

  return (
    <>
      <h1>Admin Dashboard</h1>

      <div className="cards">

        {[
          [
            "Registered Users",
            users.filter(u => u.role !== "admin").length
          ],
          ["Transactions", transactions.length],
          ["Total Income", money(income)],
          ["Total Expenses", money(expenses)]
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
          Admin can monitor registered users and all
          transactions stored in the shared Firebase database.
        </p>
      </section>
    </>
  );
}

// ==========================================
// ADMIN USERS
// ==========================================

function AdminUsers({ users, transactions }) {
  const nav = useNavigate();
  const normalUsers = users.filter(u => u.role !== "admin");
  return (
    <>
      <h1>Registered Users</h1>
      <p className="muted">Select a user's name to view their individual transactions.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Created</th><th>Last Accessed Date</th><th>Last Accessed Time</th><th>Transactions</th></tr></thead>
          <tbody>
            {normalUsers.length ? normalUsers.map(u => (
              <tr
                key={u.uid}
                className="clickable-user-row"
                onClick={() => nav(`/admin/users/${u.uid}`)}
                title="View this user's transactions"
              >
                <td><Link className="user-name-link" to={`/admin/users/${u.uid}`} onClick={e => e.stopPropagation()}>{u.name || "Unnamed user"}</Link></td>
                <td>{u.email}</td>
                <td>{u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : "—"}</td>
                <td>{u.lastAccessedAt?.toDate ? u.lastAccessedAt.toDate().toLocaleDateString() : "Not accessed yet"}</td>
                <td>{u.lastAccessedAt?.toDate ? u.lastAccessedAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                <td>{transactions.filter(t => t.uid === u.uid).length}</td>
              </tr>
            )) : <tr><td colSpan="6" className="empty">No users registered.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ==========================================
// ADMIN INDIVIDUAL USER TRANSACTIONS
// ==========================================

function AdminUserTransactions({ user, transactions }) {
  const nav = useNavigate();
  if (!user) {
    return (
      <>
        <button className="btn secondary" onClick={() => nav("/admin/users")}>Back to Users</button>
        <section className="form-card"><h2>User not found</h2></section>
      </>
    );
  }

  const income = transactions.filter(t => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const expenses = transactions.filter(t => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const sortedTransactions = [...transactions].sort((a, b) =>
    String(b.date || "").localeCompare(String(a.date || ""))
  );

  return (
    <>
      <div className="topbar">
        <div>
          <button className="btn secondary" onClick={() => nav("/admin/users")}>← Back to Users</button>
          <h1 style={{ marginTop: 18 }}>{user.name || "User"} – Transactions</h1>
          <p className="muted">{user.email}</p>
        </div>
      </div>

      <div className="cards">
        {[
          ["Total Transactions", transactions.length],
          ["Total Income", money(income)],
          ["Total Expenses", money(expenses)],
          ["Balance", money(income - expenses)]
        ].map(([label, value]) => (
          <div className="card" key={label}><h3>{label}</h3><div className="amount">{value}</div></div>
        ))}
      </div>

      <h2>All Transactions of {user.name || "this user"}</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Date</th><th>Title</th><th>Category</th><th>Type</th><th>Amount</th><th>Note</th></tr></thead>
          <tbody>
            {sortedTransactions.length ? sortedTransactions.map(t => (
              <tr key={t.id}>
                <td>{t.date || "—"}</td><td>{t.title || "—"}</td><td>{t.category || "—"}</td>
                <td><span className={"badge " + t.type}>{t.type}</span></td>
                <td>{money(t.amount)}</td><td>{t.note || "—"}</td>
              </tr>
            )) : <tr><td colSpan="6" className="empty">This user has not added any transactions yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ==========================================
// ADMIN ALL TRANSACTIONS
// ==========================================

function AdminTransactions({ transactions, users, refresh }) {
  async function del(id) {
    if (confirm("Delete this transaction?")) {
      try {
        await deleteDoc(doc(db, "transactions", id));
        refresh();
      } catch (err) {
        alert(err.message);
      }
    }
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
            {transactions.length ? (
              transactions.map(x => (
                <tr key={x.id}>
                  <td>{x.date}</td>

                  <td>
                    {users.find(u => u.uid === x.uid)?.name ||
                      x.userName ||
                      x.email ||
                      "Unknown"}
                  </td>

                  <td>{x.title}</td>
                  <td>{x.category}</td>

                  <td>
                    <span className={"badge " + x.type}>
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
