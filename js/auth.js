const ADMIN_EMAIL = 'admin@expense.com';
const ADMIN_PASSWORD = 'admin123';

function getUsers(){ return JSON.parse(localStorage.getItem('expenseUsers') || '[]'); }
function saveUsers(users){ localStorage.setItem('expenseUsers', JSON.stringify(users)); }

if(location.pathname.endsWith('index.html') || location.pathname.endsWith('/')){
  const form=document.getElementById('loginForm');
  if(form) form.addEventListener('submit',e=>{
    e.preventDefault();
    const email=document.getElementById('loginEmail').value.trim().toLowerCase();
    const password=document.getElementById('loginPassword').value;
    const msg=document.getElementById('loginMessage');
    if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD){
      localStorage.setItem('currentUser',JSON.stringify({name:'Administrator',email,role:'admin'}));
      location.href='admin/dashboard.html'; return;
    }
    const user=getUsers().find(u=>u.email===email && u.password===password);
    if(!user){msg.textContent='Invalid email or password.';msg.className='message warning';return;}
    localStorage.setItem('currentUser',JSON.stringify({name:user.name,email:user.email,role:'user'}));
    location.href='user/dashboard.html';
  });
}
const signupForm=document.getElementById('signupForm');
if(signupForm) signupForm.addEventListener('submit',e=>{
  e.preventDefault();
  const name=document.getElementById('signupName').value.trim();
  const email=document.getElementById('signupEmail').value.trim().toLowerCase();
  const password=document.getElementById('signupPassword').value;
  const users=getUsers(), msg=document.getElementById('signupMessage');
  if(email===ADMIN_EMAIL || users.some(u=>u.email===email)){msg.textContent='Email already registered.';msg.className='message warning';return;}
  users.push({id:Date.now(),name,email,password,createdAt:new Date().toISOString()});
  saveUsers(users);
  msg.textContent='Account created. Redirecting to login...';msg.className='message success';
  setTimeout(()=>location.href='index.html',700);
});
