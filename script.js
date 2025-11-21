// ---------- Utilities ----------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const fmt = n => "₹" + (Number(n||0)).toLocaleString("en-IN",{maximumFractionDigits:2});
const todayStr = () => new Date().toISOString().slice(0,10);
const monthKey = d => (d||todayStr()).slice(0,7);

const store = {
  set(k,v){ localStorage.setItem(k, JSON.stringify(v)); },
  get(k,def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def }catch{ return def }
  }
};

// ---------- State ----------
const state = store.get("smart-khaata", {
  home: [], rent: [], farm: [], settings: {goalExpense:0, goalRent:0}
});

// ---------- Safe download (Android + iPhone fix) ----------
function download(filename, text, mime="application/vnd.ms-excel") {
  const BOM = "\uFEFF"; 
  const blob = new Blob([BOM + text], { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    setTimeout(()=> window.open(url, "_blank"), 500);
  }

  setTimeout(()=> { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1500);
}

// ---------- Tabs ----------
const desktopTabs = $$(".desktop-tabs .tab-btn");

const sections = {
  home: $("#tab-home"), 
  rent: $("#tab-rent"), 
  farm: $("#tab-farm"),
  reports: $("#tab-reports"), 
  backup: $("#tab-backup"), 
  settings: $("#tab-settings")
};

// ⭐⭐ WORKING FINAL openTab (only this one must exist)
function openTab(name){
  desktopTabs.forEach(b=>b.classList.remove("active"));
  const desk = $(`.desktop-tabs .tab-btn[data-tab="${name}"]`);
  if(desk) desk.classList.add("active");

  Object.values(sections).forEach(s => s.classList.add("hidden"));
  if(sections[name]) sections[name].classList.remove("hidden");

  $("#mobile-menu")?.classList.remove("open");
  $("#menu-toggle").textContent = "☰";
}

// desktop click
desktopTabs.forEach(b =>
  b.addEventListener("click", ()=> openTab(b.dataset.tab))
);

// ---------- Mobile menu ----------
const mobMenu = $("#mobile-menu");
const mobToggle = $("#menu-toggle");

mobToggle.addEventListener("click", ()=>{
  mobMenu.classList.toggle("open");
  mobToggle.textContent = mobMenu.classList.contains("open") ? "✖" : "☰";
});

mobMenu.querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click", ()=> openTab(btn.dataset.tab));
});

// ---------- Bottom nav ----------
$$(".bottom-nav button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const t = btn.dataset.tab;
    if(t) openTab(t);
    else if(btn.id === "fab-export") $("#home-export").click();
  });
});

// header scroll
window.addEventListener("scroll", ()=> 
  document.querySelector("header").classList.toggle("scrolled", window.scrollY > 30)
);

// ---------- Month helper ----------
function seedMonthSelects(){
  const months = new Set([
    ...state.home.map(x=>monthKey(x.date)),
    ...state.rent.map(x=>x.yearMonth),
    ...state.farm.map(x=>monthKey(x.date)),
    monthKey()
  ].filter(Boolean));

  function fill(sel){
    const el = $(sel); if(!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">सभी महीने</option>' + 
      [...months].sort().map(m=>`<option>${m}</option>`).join("");
    if(months.has(cur)) el.value = cur;
  }

  fill("#home-month-filter");
  fill("#rent-month-filter");
}

// =========================================================
// ---------------------- HOME -----------------------------
// =========================================================

$("#form-home").date.value = todayStr();

$("#form-home").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;

  state.home.unshift({
    id: crypto.randomUUID(),
    date: f.date.value,
    category: f.category.value,
    amount: Number(f.amount.value||0),
    note: f.note.value.trim()
  });

  store.set("smart-khaata", state);

  f.reset(); 
  f.date.value = todayStr();

  renderHome(); 
  seedMonthSelects();
});

$("#home-clear").onclick = ()=>{
  if(confirm("सभी Home रिकॉर्ड हटाएँ?")){
    state.home = [];
    store.set("smart-khaata", state);
    renderHome();
  }
};

$("#home-search").oninput = renderHome;
$("#home-month-filter").onchange = renderHome;

$("#home-export").onclick = ()=>{
  const rows = filteredHome();
  const csv = 
    "date,category,note,amount\n" + 
    rows.map(r => `${r.date},${r.category},"${r.note}",${r.amount}`).join("\n");

  download(`home-${todayStr()}.csv`, csv);
};

function filteredHome(){
  const q = $("#home-search").value.toLowerCase().trim();
  const m = $("#home-month-filter").value;

  return state.home.filter(r=>
    (!m || monthKey(r.date)===m) &&
    (!q || r.category.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q))
  );
}

function renderHome(){
  const rows = filteredHome();
  const tbody = $("#home-table tbody");

  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td data-label="तारीख">${r.date}</td>
      <td data-label="कैटेगरी">${r.category}</td>
      <td data-label="विवरण">${r.note||""}</td>
      <td data-label="राशि"><span class="pill neg">${fmt(r.amount)}</span></td>
      <td><button class="btn secondary small" data-del="${r.id}">हटाएँ</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.home = state.home.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata", state);
      renderHome();
    };
  });

  const tm = state.home
    .filter(x=>monthKey(x.date)===monthKey())
    .reduce((a,b)=>a+b.amount,0);

  $("#home-month-total").textContent = fmt(tm);

  const goal = state.settings.goalExpense || 1;
  $("#home-month-bar").style.width = (tm/goal*100)+"%";

  const byCat = {};
  state.home.forEach(x=> byCat[x.category]=(byCat[x.category]||0)+x.amount);

  $("#home-top-cat").textContent = 
    Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";

  $("#home-daily-avg").textContent = fmt(tm / new Date().getDate());
}

// =========================================================
// ---------------------- RENT ----------------------------
// =========================================================

$("#form-rent").date.value = todayStr();

$("#form-rent").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;

  const ym = f.date.value.slice(0,4) + "-" + {
    Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
    Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"
  }[f.month.value];

  state.rent.unshift({
    id: crypto.randomUUID(),
    date: f.date.value,
    tenant: f.tenant.value.trim(),
    month: f.month.value,
    yearMonth: ym,
    amount: Number(f.amount.value||0),
    status: f.status.value,
    note: f.note.value.trim()
  });

  store.set("smart-khaata", state);

  f.reset(); 
  f.date.value = todayStr();
  f.status.value = "Received";

  renderRent(); 
  seedMonthSelects();
});

$("#rent-clear").onclick = ()=>{
  if(confirm("सभी Rent इनकम हटाएँ?")){
    state.rent = [];
    store.set("smart-khaata", state);
    renderRent();
  }
};

$("#rent-search").oninput = renderRent;
$("#rent-month-filter").onchange = renderRent;

$("#rent-export").onclick = ()=>{
  const rows = filteredRent();
  const csv =
    "date,tenant,month,amount,status,note\n" +
    rows.map(r =>
      `${r.date},"${r.tenant}",${r.month},${r.amount},${r.status},"${r.note}"`
    ).join("\n");

  download(`rent-${todayStr()}.csv`, csv);
};

function filteredRent(){
  const q = $("#rent-search").value.toLowerCase();
  const m = $("#rent-month-filter").value;

  return state.rent.filter(r=>
    (!m || r.yearMonth===m) &&
    (!q || r.tenant.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q))
  );
}

function renderRent(){
  const rows = filteredRent();
  const tbody = $("#rent-table tbody");

  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.tenant}</td>
      <td>${r.month}</td>
      <td><span class="pill pos">${fmt(r.amount)}</span></td>
      <td>${r.status}</td>
      <td><button class="btn secondary small" data-del="${r.id}">हटाएँ</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.rent = state.rent.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata", state);
      renderRent();
    };
  });

  const ym = monthKey();

  const total = state.rent
    .filter(x=>x.yearMonth===ym && x.status!="Pending")
    .reduce((a,b)=>a+b.amount,0);

  const pending = state.rent
    .filter(x=>x.yearMonth===ym && x.status!="Received")
    .reduce((a,b)=>a+b.amount,0);

  $("#rent-month-total").textContent = fmt(total);
  $("#rent-pending").textContent = fmt(pending);
  $("#rent-tenants").textContent = new Set(state.rent.map(x=>x.tenant)).size;
}


// ---------------------- FARM ----------------------------
// =========================================================

$("#form-farm").date.value = todayStr();

$("#form-farm").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;

  state.farm.unshift({
    id: crypto.randomUUID(),
    date: f.date.value,
    type: f.type.value,
    crop: f.crop.value.trim(),
    value: Number(f.value.value||0),
    note: f.note.value.trim()
  });

  store.set("smart-khaata", state);

  f.reset();
  f.date.value = todayStr();

  renderFarm();
  seedMonthSelects();
});

$("#farm-clear").onclick = ()=>{
  if(confirm("सभी Farm रिकॉर्ड हटाएँ?")){
    state.farm = [];
    store.set("smart-khaata", state);
    renderFarm();
  }
};

$("#farm-search").oninput = renderFarm;
$("#farm-type-filter").onchange = renderFarm;

$("#farm-export").onclick = ()=>{
  const rows = filteredFarm();
  const csv =
    "date,type,crop,value,note\n" +
    rows.map(r =>
      `${r.date},${r.type},"${r.crop}",${r.value},"${r.note}"`
    ).join("\n");

  download(`farm-${todayStr()}.csv`, csv);
};

function filteredFarm(){
  const q = $("#farm-search").value.toLowerCase();
  const t = $("#farm-type-filter").value;

  return state.farm.filter(r=>
    (!t || r.type===t) &&
    (!q || r.crop.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q))
  );
}

function renderFarm(){
  const rows = filteredFarm();
  const tbody = $("#farm-table tbody");

  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.type}</td>
      <td>${r.crop}</td>
      <td>${r.value}</td>
      <td>${r.note||""}</td>
      <td><button class="btn secondary small" data-del="${r.id}">हटाएँ</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.farm = state.farm.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata", state);
      renderFarm();
    };
  });

  const expense = state.farm
    .filter(x=>x.type==="Expense")
    .reduce((a,b)=>a+b.value,0);

  const sales = state.farm
    .filter(x=>x.type==="Sale")
    .reduce((a,b)=>a+b.value,0);

  $("#farm-expense").textContent = fmt(expense);
  $("#farm-sales").textContent = fmt(sales);
  $("#farm-profit").textContent = fmt(sales - expense);

  const goal = Math.max(1, expense + sales);
  $("#farm-expense-bar").style.width = (expense/goal*100)+"%";
  $("#farm-sales-bar").style.width   = (sales/goal*100)+"%";
}


// ---------------------- REPORTS --------------------------
// =========================================================

function renderReports(){
  const homeTotal = state.home.reduce((a,b)=>a+b.amount,0);
  const rentTotal = state.rent.filter(x=>x.status!="Pending").reduce((a,b)=>a+b.amount,0);
  const sale = state.farm.filter(x=>x.type==="Sale").reduce((a,b)=>a+b.value,0);
  const exp  = state.farm.filter(x=>x.type==="Expense").reduce((a,b)=>a+b.value,0);

  $("#r-home").textContent = fmt(homeTotal);
  $("#r-rent").textContent = fmt(rentTotal);
  $("#r-farm").textContent = fmt(sale - exp);

  const sum = Math.max(1, homeTotal + rentTotal);
  $("#r-ratio").style.width = (rentTotal/sum*100)+"%";
}


// ---------------------- BACKUP ---------------------------
// =========================================================

$("#backup-export").onclick = ()=>{
  const data = JSON.stringify(state,null,2);
  $("#backup-text").value = data;
  download(`smart-khaata-backup-${todayStr()}.json`, data, "application/json");
};

$("#backup-import").onchange = async e=>{
  const file = e.target.files[0];
  if(!file) return;

  try{
    const d = JSON.parse(await file.text());
    ["home","rent","farm","settings"].forEach(k=> state[k] = d[k] ?? state[k]);

    store.set("smart-khaata", state);
    renderAll();
    alert("इम्पोर्ट सफल!");
  }catch(e){
    alert("Invalid JSON!");
  }
};


// ---------------------- SETTINGS -------------------------
// =========================================================

function loadSettings(){
  $("#goal-expense").value = state.settings.goalExpense || 0;
  $("#goal-rent").value = state.settings.goalRent || 0;
}

$("#save-settings").onclick = ()=>{
  state.settings.goalExpense = Number($("#goal-expense").value||0);
  state.settings.goalRent    = Number($("#goal-rent").value||0);
  store.set("smart-khaata", state);

  $("#save-msg").textContent = "सेव हुआ!";
  setTimeout(()=> $("#save-msg").textContent="",1500);

  renderReports();
};


// ---------------------- INIT -----------------------------
// =========================================================

function renderAll(){
  renderHome();
  renderRent();
  renderFarm();
  renderReports();
  seedMonthSelects();
  loadSettings();
}

renderAll();
openTab("home");
