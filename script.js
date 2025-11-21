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
  const BOM = "\uFEFF"; // unicode BOM for Hindi/Unicode
  const blob = new Blob([BOM + text], { type: mime + ";charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();

  // iOS fallback: open in new tab to force viewer
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    setTimeout(()=> window.open(url, "_blank"), 500);
  }

  setTimeout(()=> { URL.revokeObjectURL(url); document.body.removeChild(a); }, 1500);
}

// ---------- Tabs ----------
const desktopTabs = $$(".desktop-tabs .tab-btn");
const allTabBtns = () => $$(".tab-btn"); // includes mobile menu buttons
const sections = {
  home: $("#tab-home"), rent: $("#tab-rent"), farm: $("#tab-farm"),
  reports: $("#tab-reports"), backup: $("#tab-backup"), settings: $("#tab-settings")
};

function openTab(name){
  // set active on desktop tabs
  desktopTabs.forEach(b=>b.classList.remove("active"));
  const desktop = $(`.desktop-tabs .tab-btn[data-tab="${name}"]`);
  if(desktop) desktop.classList.add("active");

  // hide / show sections
  Object.values(sections).forEach(s => s.classList.add("hidden"));
  if(sections[name]) sections[name].classList.remove("hidden");

  // close mobile menu if open
  $("#mobile-menu")?.classList.remove("open");
}

// desktop tab clicks
desktopTabs.forEach(b => b.addEventListener("click", ()=> openTab(b.dataset.tab)));

// ---------- Mobile menu ----------
const mobMenu = $("#mobile-menu");
const mobToggle = $("#menu-toggle");
mobToggle.addEventListener("click", ()=>{
  mobMenu.classList.toggle("open");
  document.body.classList.toggle("menu-open", mobMenu.classList.contains("open"));
  mobToggle.textContent = mobMenu.classList.contains("open") ? "✖" : "☰";
});
mobMenu.querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click", ()=> openTab(btn.dataset.tab));
});

// bottom nav -> open tabs
$$(".bottom-nav button").forEach(btn=>{
  btn.addEventListener("click", ()=> {
    const t = btn.dataset.tab;
    if(t) openTab(t);
    else if(btn.id === "fab-export") { $("#home-export").click(); }
  });
});

// header scroll effect
window.addEventListener("scroll", ()=> document.querySelector("header").classList.toggle("scrolled", window.scrollY > 30));

// ---------- Month seed helper ----------
function seedMonthSelects(){
  const months = new Set([
    ...state.home.map(x=>monthKey(x.date)),
    ...state.rent.map(x=>x.yearMonth),
    ...state.farm.map(x=>monthKey(x.date)),
    monthKey()
  ].filter(Boolean));

  const mk = sel => {
    const el = $(sel); if(!el) return;
    const cur = el.value;
    el.innerHTML = '<option value="">सभी महीने</option>' + [...months].sort().map(m=>`<option>${m}</option>`).join("");
    if([...months].includes(cur)) el.value = cur;
  };

  mk("#home-month-filter");
  mk("#rent-month-filter");
}

// ---------- HOME ----------
$("#form-home").date.value = todayStr();
$("#form-home").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;
  const row = { id: crypto.randomUUID(), date: f.date.value, category: f.category.value, amount: Number(f.amount.value||0), note: f.note.value.trim() };
  state.home.unshift(row); store.set("smart-khaata", state);
  f.reset(); f.date.value = todayStr();
  renderHome(); seedMonthSelects();
});

$("#home-clear").addEventListener("click", ()=> {
  if(confirm("सभी Home रिकॉर्ड हटाएँ?")){ state.home = []; store.set("smart-khaata", state); renderHome(); }
});
$("#home-search").addEventListener("input", renderHome);
$("#home-month-filter").addEventListener("change", renderHome);

$("#home-export").addEventListener("click", ()=>{
  const rows = filteredHome();
  const csv = ["date,category,note,amount"].concat(rows.map(r=>[r.date, r.category, `"${(r.note||"").replaceAll('"','""')}"`, r.amount].join(","))).join("\n");
  download(`home-${todayStr()}.csv`, csv);
});

function filteredHome(){
  const q = $("#home-search").value.toLowerCase().trim();
  const m = $("#home-month-filter").value;
  return state.home.filter(r=>{
    const mOk = !m || monthKey(r.date) === m;
    const qOk = !q || r.category.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q);
    return mOk && qOk;
  });
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
      <td data-label="Action"><button class="btn secondary small" data-del="${r.id}">हटाएँ</button></td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.addEventListener("click", ()=> {
      state.home = state.home.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata", state);
      renderHome();
    });
  });

  const totalMonth = state.home.filter(x=>monthKey(x.date)===monthKey()).reduce((a,b)=>a+b.amount,0);
  $("#home-month-total").textContent = fmt(totalMonth);
  const goal = Number(state.settings.goalExpense||0) || 1;
  $("#home-month-bar").style.width = Math.min(100,(totalMonth/goal*100)).toFixed(1) + "%";
  const byCat = {}; state.home.forEach(x=> byCat[x.category] = (byCat[x.category]||0) + x.amount);
  $("#home-top-cat").textContent = Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";
  $("#home-daily-avg").textContent = fmt(totalMonth / new Date().getDate() || 0);
}

// ---------- RENT ----------
$("#form-rent").date.value = todayStr();
$("#form-rent").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;
  const year = (f.date.value||todayStr()).slice(0,4);
  const ym = year + "-" + ({Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"}[f.month.value]);
  const row = { id: crypto.randomUUID(), date: f.date.value, tenant: f.tenant.value.trim(), month: f.month.value, yearMonth: ym, amount: Number(f.amount.value||0), status: f.status.value, note: f.note.value.trim() };
  state.rent.unshift(row); store.set("smart-khaata", state);
  f.reset(); f.date.value = todayStr(); f.status.value = "Received";
  renderRent(); seedMonthSelects();
});

$("#rent-clear").addEventListener("click", ()=>{ if(confirm("सभी Rent इनकम हटाएँ?")){ state.rent = []; store.set("smart-khaata",state); renderRent(); }});
$("#rent-search").addEventListener("input", renderRent);
$("#rent-month-filter").addEventListener("change", renderRent);

$("#rent-export").addEventListener("click", ()=>{
  const rows = filteredRent();
  const csv = ["date,tenant,month,amount,status,note"].concat(rows.map(r=>[r.date, `"${(r.tenant||"").replaceAll('"','""')}"`, r.month, r.amount, r.status, `"${(r.note||"").replaceAll('"','""')}"`].join(","))).join("\n");
  download(`rent-${todayStr()}.csv`, csv);
});

function filteredRent(){
  const q = $("#rent-search").value.toLowerCase().trim();
  const m = $("#rent-month-filter").value;
  return state.rent.filter(r=>{
    const mOk = !m || r.yearMonth === m;
    const qOk = !q || r.tenant.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q);
    return mOk && qOk;
  });
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
  tbody.querySelectorAll("[data-del]").forEach(b=> b.onclick = ()=> { state.rent = state.rent.filter(x=>x.id!==b.dataset.del); store.set("smart-khaata",state); renderRent(); });

  const ym = monthKey();
  const total = state.rent.filter(x=>x.yearMonth===ym && x.status!=="Pending").reduce((a,b)=>a+b.amount,0);
  const pending = state.rent.filter(x=>x.yearMonth===ym && x.status!=="Received").reduce((a,b)=>a+b.amount,0);

  $("#rent-month-total").textContent = fmt(total);
  $("#rent-pending").textContent = fmt(pending);
  $("#rent-tenants").textContent = new Set(state.rent.map(x=>x.tenant)).size;
}

// ---------- FARM ----------
$("#form-farm").date.value = todayStr();
$("#form-farm").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;
  const row = { id: crypto.randomUUID(), date: f.date.value, type: f.type.value, crop: f.crop.value.trim(), value: Number(f.value.value||0), note: f.note.value.trim() };
  state.farm.unshift(row); store.set("smart-khaata", state);
  f.reset(); f.date.value = todayStr();
  renderFarm(); seedMonthSelects();
});

$("#farm-clear").addEventListener("click", ()=> { if(confirm("सभी Farm रिकॉर्ड हटाएँ?")){ state.farm=[]; store.set("smart-khaata", state); renderFarm(); }});
$("#farm-search").addEventListener("input", renderFarm);
$("#farm-type-filter").addEventListener("change", renderFarm);

$("#farm-export").addEventListener("click", ()=>{
  const rows = filteredFarm();
  const csv = ["date,type,crop,value,note"].concat(rows.map(r=>[r.date, r.type, `"${(r.crop||"").replaceAll('"','""')}"`, r.value, `"${(r.note||"").replaceAll('"','""')}"`].join(","))).join("\n");
  download(`farm-${todayStr()}.csv`, csv);
});

function filteredFarm(){
  const q = $("#farm-search").value.toLowerCase().trim();
  const t = $("#farm-type-filter").value;
  return state.farm.filter(r=> (!t || r.type===t) && (!q || r.crop.toLowerCase().includes(q) || (r.note||"").toLowerCase().includes(q)) );
}

function renderFarm(){
  const rows = filteredFarm();
  const tbody = $("#farm-table tbody");
  tbody.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.date}</td><td>${r.type}</td><td>${r.crop}</td><td>${r.value}</td><td>${r.note||""}</td>
      <td><button class="btn secondary small" data-del="${r.id}">हटाएँ</button></td>
    </tr>
  `).join("");
  tbody.querySelectorAll("[data-del]").forEach(b=> b.onclick = ()=> { state.farm = state.farm.filter(x=>x.id!==b.dataset.del); store.set("smart-khaata", state); renderFarm(); });

  const expense = state.farm.filter(x=>x.type==="Expense").reduce((a,b)=>a+b.value,0);
  const sales   = state.farm.filter(x=>x.type==="Sale").reduce((a,b)=>a+b.value,0);
  const profit   = sales - expense;

  $("#farm-expense").textContent = fmt(expense);
  $("#farm-sales").textContent = fmt(sales);
  $("#farm-profit").textContent = fmt(profit);

  const goal = Math.max(1, expense + sales);
  $("#farm-expense-bar").style.width = Math.min(100,(expense/goal*100)).toFixed(1)+"%";
  $("#farm-sales-bar").style.width   = Math.min(100,(sales/goal*100)).toFixed(1)+"%";
}

// ---------- REPORTS ----------
function renderReports(){
  const homeTotal = state.home.reduce((a,b)=>a+b.amount,0);
  const rentTotal = state.rent.filter(x=>x.status!=="Pending").reduce((a,b)=>a+b.amount,0);
  const farmProfit = state.farm.filter(x=>x.type==="Sale").reduce((a,b)=>a+b.value,0) - state.farm.filter(x=>x.type==="Expense").reduce((a,b)=>a+b.value,0);

  $("#r-home").textContent = fmt(homeTotal);
  $("#r-rent").textContent = fmt(rentTotal);
  $("#r-farm").textContent = fmt(farmProfit);

  const sum = Math.max(1, homeTotal + rentTotal);
  $("#r-ratio").style.width = Math.min(100,(rentTotal/sum*100)).toFixed(1)+"%";
}

// ---------- BACKUP ----------
$("#backup-export").addEventListener("click", ()=>{
  const data = JSON.stringify(state, null, 2);
  $("#backup-text").value = data;
  download(`smart-khaata-backup-${todayStr()}.json`, data, "application/json");
});
$("#backup-import").addEventListener("change", async e=>{
  const file = e.target.files[0]; if(!file) return;
  try{
    const text = await file.text();
    const data = JSON.parse(text);
    ["home","rent","farm","settings"].forEach(k=> state[k] = data[k] ?? state[k]);
    store.set("smart-khaata", state);
    renderAll();
    alert("इम्पोर्ट सफल ✅");
  }catch(err){ alert("Invalid JSON"); }
  e.target.value = "";
});

// ---------- SETTINGS ----------
function loadSettings(){
  $("#goal-expense").value = state.settings.goalExpense ?? 0;
  $("#goal-rent").value = state.settings.goalRent ?? 0;
}
$("#save-settings").addEventListener("click", ()=>{
  state.settings.goalExpense = Number($("#goal-expense").value||0);
  state.settings.goalRent = Number($("#goal-rent").value||0);
  store.set("smart-khaata", state);
  $("#save-msg").textContent = "सेव हुआ ✅";
  setTimeout(()=> $("#save-msg").textContent="",1500);
  renderReports();
});

// ---------- Helpers ----------
function renderAll(){ renderHome(); renderRent(); renderFarm(); renderReports(); seedMonthSelects(); loadSettings(); }
renderAll();
