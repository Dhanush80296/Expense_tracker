function currentUser(){return JSON.parse(localStorage.getItem('currentUser')||'null')}
function requireRole(role){
  const u=currentUser();
  if(!u || u.role!==role){location.href='../index.html';return null}
  return u;
}
function logout(){localStorage.removeItem('currentUser');location.href='../index.html'}
function getExpenses(){return JSON.parse(localStorage.getItem('expenseData')||'[]')}
function saveExpenses(x){localStorage.setItem('expenseData',JSON.stringify(x))}
function getBudgets(){return JSON.parse(localStorage.getItem('expenseBudgets')||'{}')}
function saveBudgets(x){localStorage.setItem('expenseBudgets',JSON.stringify(x))}
function money(n){return '₹'+Number(n||0).toFixed(2)}
