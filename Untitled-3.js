// ========== EmailJS CONFIG ==========
const EMAILJS_SERVICE_ID = 'service_0h69aid';
const EMAILJS_TEMPLATE_ID = 'template_0hxydrk';
const EMAILJS_PUBLIC_KEY = 'TSGZv3-zG_k-2u3mW';

const K = { users:'sys_users', visits:'sys_visits', logins:'sys_logins', session:'sys_session' };
let pendingCode = null;
let pendingForgotEmail = null;

// ========== INIT ==========
window.onload = function() {
  emailjs.init(EMAILJS_PUBLIC_KEY);
  let v = parseInt(localStorage.getItem(K.visits)||'0') + 1;
  localStorage.setItem(K.visits, v);
  const session = getSession();
  if (session) {
    if (session.role === 'admin') showAdminPage(session);
    else showUserDashboard(session);
  }
};

// ========== SESSION ==========
function getSession() { return JSON.parse(sessionStorage.getItem(K.session)||'null'); }
function setSession(u) { sessionStorage.setItem(K.session, JSON.stringify(u)); }
function clearSession() { sessionStorage.removeItem(K.session); }

// ========== PAGE NAVIGATION ==========
function showPage(id) {
  ['welcomePage','loginPage','registerPage','forgotPage','userPage','adminPage'].forEach(p => {
    const el = document.getElementById(p);
    if (el) el.style.display = 'none';
  });
  document.getElementById(id).style.display = 'block';
  // Reset forgot page when visiting
  if (id === 'forgotPage') {
    document.getElementById('resetCard').style.display = 'none';
    document.getElementById('forgotEmail').value = '';
    document.getElementById('forgotMsg').className = 'msg';
  }
  return false;
}

// ========== HELPERS ==========
function getUsers() { return JSON.parse(localStorage.getItem(K.users)||'[]'); }
function saveUsers(u) { localStorage.setItem(K.users, JSON.stringify(u)); }
function showMsg(id, type, text) {
  const el = document.getElementById(id);
  el.className = 'msg ' + type;
  el.innerHTML = text;
}

// ========== REGISTER ==========
function register() {
  const name = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const emailConfirm = document.getElementById('regEmailConfirm').value.trim();
  const pass = document.getElementById('regPass').value;
  const passConfirm = document.getElementById('regPassConfirm').value;
  const dd = document.getElementById('dobDD').value.trim();
  const mm = document.getElementById('dobMM').value.trim();
  const yy = document.getElementById('dobYY').value.trim();

  if (!name||!email||!emailConfirm||!pass||!passConfirm||!dd||!mm||!yy) {
    showMsg('regMsg','error','Please fill all fields.'); return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) { showMsg('regMsg','error','Enter a valid email.'); return; }
  if (email !== emailConfirm) { showMsg('regMsg','error','Emails do not match.'); return; }
  if (pass.length < 6) { showMsg('regMsg','error','Password must be at least 6 characters.'); return; }
  if (pass !== passConfirm) { showMsg('regMsg','error','Passwords do not match.'); return; }
  if (!/^\d{2}$/.test(dd)||!/^\d{2}$/.test(mm)||!/^\d{4}$/.test(yy)) {
    showMsg('regMsg','error','Enter valid date of birth (DD/MM/YYYY).'); return;
  }
  let users = getUsers();
  if (users.find(u => u.email === email)) { showMsg('regMsg','error','Email already registered.'); return; }
  const dob = dd+'/'+mm+'/'+yy;
  users.push({ name, email, password: pass, dob, role:'user', registered: new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}) });
  saveUsers(users);
  showMsg('regMsg','success','Account created successfully! You can now login.');
  document.getElementById('regFullName').value='';
  document.getElementById('regEmail').value='';
  document.getElementById('regEmailConfirm').value='';
  document.getElementById('regPass').value='';
  document.getElementById('regPassConfirm').value='';
  document.getElementById('dobDD').value='';
  document.getElementById('dobMM').value='';
  document.getElementById('dobYY').value='';
  setTimeout(()=>showPage('loginPage'), 2000);
}

// ========== LOGIN ==========
function login() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!email||!pass) { showMsg('loginMsg','error','Enter email and password.'); return; }
  // Admin check
  if (email === 'admin@site.com' && pass === 'admin@123') {
    let logins = parseInt(localStorage.getItem(K.logins)||'0')+1;
    localStorage.setItem(K.logins, logins);
    const now = new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
    const session = { name:'Admin', email, role:'admin', loginTime: now };
    showMsg('loginMsg','success','Admin login successful!');
    setTimeout(()=>showAdminPage(session), 1000);
    return;
  }
  const users = getUsers();
  const user = users.find(u => u.email===email && u.password===pass);
  if (!user) { showMsg('loginMsg','error','Invalid email or password.'); return; }
  let logins = parseInt(localStorage.getItem(K.logins)||'0')+1;
  localStorage.setItem(K.logins, logins);
  const now = new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  const session = { name:user.name, email:user.email, role:user.role, dob:user.dob, loginTime:now };
  showMsg('loginMsg','success','Login successful! Loading dashboard...');
  setTimeout(()=>showUserDashboard(session), 1000);
}

// ========== USER DASHBOARD ==========
function showUserDashboard(session) {
  setSession(session);
  showPage('userPage');
  document.getElementById('userWelcomeName').textContent = session.name;
  document.getElementById('uName').textContent = session.name;
  document.getElementById('uEmail').textContent = session.email;
  document.getElementById('uDOB').textContent = session.dob || '-';
  document.getElementById('uLoginTime').textContent = session.loginTime || '-';
}

// ========== ADMIN DASHBOARD ==========
function showAdminPage(session) {
  setSession(session);
  showPage('adminPage');

  const users = getUsers();
  const visits = parseInt(localStorage.getItem(K.visits)||'0');
  const logins = parseInt(localStorage.getItem(K.logins)||'0');
  const now = new Date();

  // --- NAVBAR ---
  document.getElementById('adminName').textContent = session.name || 'Admin';
  const dtEl = document.getElementById('adminDateTime');
  if (dtEl) dtEl.textContent = now.toLocaleString('en-IN', {timeZone:'Asia/Kolkata', weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});

  // --- KPI CARDS ---
  document.getElementById('statUsers').textContent = users.length;
  document.getElementById('statLogins').textContent = logins;
  document.getElementById('statVisits').textContent = visits;
  document.getElementById('statActive').textContent = session ? 1 : 0;
  const badge = document.getElementById('userCountBadge');
  if (badge) badge.textContent = users.length + ' user' + (users.length !== 1 ? 's' : '');

  // --- BAR CHART (Login Activity - simulated weekly data) ---
  const barChart = document.getElementById('loginBarChart');
  const barLabels = document.getElementById('barChartLabels');
  if (barChart) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const baseData = [users.length, logins, visits, users.length+1, logins+2, Math.max(1,visits-3), users.length];
    const maxVal = Math.max(...baseData, 1);
    barChart.innerHTML = baseData.map((val, i) => {
      const heightPct = Math.max(4, Math.round((val / maxVal) * 100));
      const colors = ['#a78bfa','#818cf8','#60a5fa','#34d399','#a78bfa','#f472b6','#fbbf24'];
      return `<div class="adm-bar" style="height:${heightPct}%;background:linear-gradient(180deg,${colors[i]},${colors[i]}88)" title="${days[i]}: ${val}"><div class="adm-bar-tooltip">${val}</div></div>`;
    }).join('');
    if (barLabels) barLabels.innerHTML = days.map(d => `<div class="adm-bar-label">${d}</div>`).join('');
  }

  // --- DONUT CHART (Role Distribution) ---
  const donutEl = document.getElementById('donutChart');
  const donutLegend = document.getElementById('donutLegend');
  const donutTotal = document.getElementById('donutTotal');
  if (donutEl && users.length > 0) {
    const roles = {};
    users.forEach(u => { const r = u.role || 'user'; roles[r] = (roles[r]||0)+1; });
    const roleColors = { user:'#34d399', admin:'#a78bfa', guest:'#60a5fa' };
    const total = users.length;
    if (donutTotal) donutTotal.textContent = total;
    let cumAngle = 0;
    const segments = Object.entries(roles).map(([role, count]) => {
      const pct = count / total;
      const angle = pct * 360;
      const start = cumAngle;
      cumAngle += angle;
      return { role, count, pct, start, angle, color: roleColors[role] || '#9ca3af' };
    });
    const gradParts = segments.map(s => {
      const end = s.start + s.angle;
      return `${s.color} ${s.start.toFixed(1)}deg ${end.toFixed(1)}deg`;
    });
    donutEl.style.background = `conic-gradient(${gradParts.join(',')}, transparent 0)`;
    if (donutLegend) {
      donutLegend.innerHTML = segments.map(s =>
        `<div class="adm-donut-leg-item"><div class="adm-donut-leg-dot" style="background:${s.color}"></div>${s.role.charAt(0).toUpperCase()+s.role.slice(1)}<div class="adm-donut-leg-pct">${Math.round(s.pct*100)}%</div></div>`
      ).join('');
    }
  } else if (donutTotal) {
    donutTotal.textContent = 0;
  }

  // --- USERS TABLE ---
  const tbody = document.getElementById('usersTableBody');
  if (tbody) {
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#6b7280;padding:24px;">No users registered yet</td></tr>';
    } else {
      tbody.innerHTML = users.map((u, i) =>
        `<tr>
          <td>${i+1}</td>
          <td>${u.name}</td>
          <td>${u.email}</td>
          <td>${u.dob||'-'}</td>
          <td><span class="adm-role-badge adm-role-${u.role||'user'}">${u.role||'user'}</span></td>
          <td><button class="adm-del-btn" onclick="deleteUser('${u.email}')">Delete</button></td>
        </tr>`
      ).join('');
    }
  }

  // --- ACTIVITY FEED ---
  const feed = document.getElementById('activityFeed');
  if (feed) {
    const events = [
      { icon:'🔐', color:'#a78bfa', text:`Admin <strong>${session.name}</strong> logged in`, time: now.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'}) },
      { icon:'👥', color:'#34d399', text:`${users.length} registered user${users.length!==1?'s':''} in the system`, time:'System' },
      { icon:'🌐', color:'#60a5fa', text:`${visits} total page visits recorded`, time:'Analytics' },
      { icon:'🔑', color:'#fbbf24', text:`${logins} total login sessions`, time:'Sessions' },
      { icon:'🛡️', color:'#f472b6', text:'Admin dashboard loaded successfully', time:'Now' },
    ];
    feed.innerHTML = events.map(e =>
      `<div class="adm-feed-item" style="border-color:${e.color}">
        <div class="adm-feed-icon">${e.icon}</div>
        <div class="adm-feed-info">
          <div class="adm-feed-text">${e.text}</div>
          <div class="adm-feed-time">${e.time}</div>
        </div>
      </div>`
    ).join('');
  }
}

function deleteUser(email) {
  if (!confirm('Delete user '+email+'?')) return;
  saveUsers(getUsers().filter(u => u.email !== email));
  showAdminPage(getSession());
}

// ========== LOGOUT ==========
function logoutUser() { clearSession(); showPage('welcomePage'); }
function logoutAdmin() { clearSession(); showPage('welcomePage'); }
function goToSite() { window.open('https://9anime.org.lv/', '_blank'); }

// ========== FORGOT PASSWORD ==========
function sendVerificationCode() {
  const email = document.getElementById('forgotEmail').value.trim();
  if (!email) { showMsg('forgotMsg','error','Enter your registered email.'); return; }
  const users = getUsers();
  const user = users.find(u => u.email===email);
  if (!user) { showMsg('forgotMsg','error','Email not found. Please register first.'); return; }
  pendingCode = Math.floor(100000+Math.random()*900000).toString();
  pendingForgotEmail = email;
  const btn = document.getElementById('sendCodeBtn');
  btn.innerHTML = 'Sending...';
  btn.disabled = true;
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    to_email: email, to_name: user.name, otp_code: pendingCode
  }).then(()=>{
    showMsg('forgotMsg','success','Code sent to '+email+'!');
    document.getElementById('resetCard').style.display = 'block';
    btn.innerHTML='Send →'; btn.disabled=false;
  }).catch(err=>{
    showMsg('forgotMsg','error','Failed: '+JSON.stringify(err));
    btn.innerHTML='Send →'; btn.disabled=false;
  });
}

function resetPassword() {
  const code = document.getElementById('verifyCode').value.trim();
  const newPass = document.getElementById('newPass').value;
  const newConfirm = document.getElementById('newPassConfirm').value;
  if (code !== pendingCode) { showMsg('resetMsg','error','Invalid PIN. Try again.'); return; }
  if (!newPass||newPass.length<6) { showMsg('resetMsg','error','Password must be at least 6 characters.'); return; }
  if (newPass !== newConfirm) { showMsg('resetMsg','error','Passwords do not match.'); return; }
  let users = getUsers();
  const idx = users.findIndex(u => u.email===pendingForgotEmail);
  if (idx > -1) { users[idx].password = newPass; saveUsers(users); }
  pendingCode = null; pendingForgotEmail = null;
  showMsg('resetMsg','success','Password reset! You can now login.');
  setTimeout(()=>showPage('loginPage'), 2500);
}

// ========== ADMIN PIN MODAL ==========
const ADMIN_PIN = '1234'; // Change this to your desired PIN
let pinInput = '';

function openAdminPinModal() {
  pinInput = '';
  updateDots();
  document.getElementById('pinMsg').className = 'msg';
  document.getElementById('adminPinModal').style.display = 'flex';
}

function closePinModal() {
  pinInput = '';
  updateDots();
  document.getElementById('adminPinModal').style.display = 'none';
  document.getElementById('pinMsg').className = 'msg';
}

function pinPress(num) {
  if (pinInput.length >= 4) return;
  pinInput += num;
  updateDots();
  if (pinInput.length === 4) {
    setTimeout(pinSubmit, 150);
  }
}

function pinClear() {
  pinInput = pinInput.slice(0, -1);
  updateDots();
}

function updateDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('dot' + i);
    dot.className = 'pin-dot' + (i < pinInput.length ? ' filled' : '');
  }
}

function pinSubmit() {
  if (pinInput.length < 4) {
    showMsg('pinMsg', 'error', 'Please enter the 4-digit PIN.');
    return;
  }
  if (pinInput === ADMIN_PIN) {
    // Mark dots green briefly then proceed
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('dot' + i);
      dot.style.background = '#10b981';
      dot.style.borderColor = '#10b981';
      dot.style.boxShadow = '0 0 10px rgba(16,185,129,0.8)';
    }
    showMsg('pinMsg', 'success', '✓ PIN verified! Redirecting...');
    setTimeout(() => {
      closePinModal();
      showPage('loginPage');
      // Pre-fill admin email hint
      document.getElementById('loginEmail').value = 'admin@site.com';
      document.getElementById('loginEmail').focus();
    }, 800);
  } else {
    // Shake dots red
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById('dot' + i);
      dot.className = 'pin-dot error';
    }
    showMsg('pinMsg', 'error', '✗ Wrong PIN! Try again.');
    pinInput = '';
    setTimeout(() => {
      updateDots();
      document.getElementById('pinMsg').className = 'msg';
    }, 900);
  }
}
