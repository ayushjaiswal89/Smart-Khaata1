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

function setupEventListeners() {
  const homeClr = $("#home-clear");
  if(homeClr) homeClr.onclick = ()=>{
    if(confirm("सभी Home रिकॉर्ड हटाएँ?")){
      state.home = [];
      store.set("smart-khaata", state);
      renderHome();
    }
  };

  const homeSrc = $("#home-search");
  if(homeSrc) homeSrc.oninput = renderHome;
  
  const homeMonthFlt = $("#home-month-filter");
  if(homeMonthFlt) homeMonthFlt.onchange = renderHome;

  const homeExp = $("#home-export");
  if(homeExp) homeExp.onclick = ()=>{
    const rows = filteredHome();
    const csv = 
      "date,category,note,amount\n" + 
      rows.map(r => `${r.date},${r.category},"${r.note}",${r.amount}`).join("\n");

    download(`home-${todayStr()}.csv`, csv);
  };

  const rentClr = $("#rent-clear");
  if(rentClr) rentClr.onclick = ()=>{
    if(confirm("सभी Rent इनकम हटाएँ?")){
      state.rent = [];
      store.set("smart-khaata", state);
      renderRent();
    }
  };

  const rentSrc = $("#rent-search");
  if(rentSrc) rentSrc.oninput = renderRent;
  
  const rentMonthFlt = $("#rent-month-filter");
  if(rentMonthFlt) rentMonthFlt.onchange = renderRent;

  const rentExp = $("#rent-export");
  if(rentExp) rentExp.onclick = ()=>{
    const rows = filteredRent();
    const csv =
      "date,tenant,month,amount,status,note\n" +
      rows.map(r =>
        `${r.date},"${r.tenant}",${r.month},${r.amount},${r.status},"${r.note}"`
      ).join("\n");

    download(`rent-${todayStr()}.csv`, csv);
  };

  const farmSrc = $("#farm-search");
  if(farmSrc) farmSrc.oninput = renderFarm;
  
  const farmTypeFlt = $("#farm-type-filter");
  if(farmTypeFlt) farmTypeFlt.onchange = renderFarm;
}

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

// =========================================================
// ---------------------- FARM ----------------------------
// =========================================================

$("#form-farm").date.value = todayStr();
let farmEditId = null;

// Function to toggle form fields based on type
function toggleFarmFields(type) {
  const expenseField = document.querySelectorAll(".farm-expense-field");
  const qtyField = document.querySelectorAll(".farm-qty-field");
  const unitField = document.querySelectorAll(".farm-unit-field");
  const priceField = document.querySelectorAll(".farm-price-field");
  
  expenseField.forEach(el => el.style.display = type==="Expense" ? "block" : "none");
  qtyField.forEach(el => el.style.display = (type==="Yield"||type==="Sale") ? "block" : "none");
  unitField.forEach(el => el.style.display = (type==="Yield"||type==="Sale") ? "block" : "none");
  priceField.forEach(el => el.style.display = type==="Sale" ? "block" : "none");
}

// Attach event listener to farm type select
const farmTypeSelect = $("#farm-type-select");
if (farmTypeSelect) {
  farmTypeSelect.addEventListener("change", (e) => {
    toggleFarmFields(e.target.value);
  });
  // Initialize with default value
  toggleFarmFields(farmTypeSelect.value);
}

function setFarmType(type) {
  const select = $("#farm-type-select");
  select.value = type;
  toggleFarmFields(type);
}

$("#form-farm").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;
  const type = f.type.value;
  
  let farmData = {
    id: farmEditId || crypto.randomUUID(),
    date: f.date.value,
    type: type,
    crop: f.crop.value.trim(),
    note: f.note.value.trim()
  };
  
  if(type==="Expense") {
    farmData.amount = Number(f.amount.value||0);
  } else if(type==="Yield") {
    farmData.quantity = Number(f.quantity.value||0);
    farmData.unit = f.unit.value;
  } else if(type==="Sale") {
    farmData.quantity = Number(f.quantity.value||0);
    farmData.unit = f.unit.value;
    farmData.price = Number(f.price.value||0);
  }
  
  if(farmEditId) {
    state.farm = state.farm.map(x => x.id === farmEditId ? farmData : x);
    farmEditId = null;
    f.querySelector('button[type="submit"]').textContent = "➕ रिकॉर्ड जोड़ें";
  } else {
    state.farm.unshift(farmData);
  }

  store.set("smart-khaata", state);
  f.reset();
  f.date.value = todayStr();
  renderFarm();
  seedMonthSelects();
});


const farmExportBtn = $("#farm-export");
if(farmExportBtn) {
  farmExportBtn.onclick = ()=>{
    const rows = filteredFarm();
    const csv = rows.map(r=>{
      if(r.type==="Expense") {
        return `${r.date},${r.type},"${r.crop}","${fmt(r.amount)}","${r.note}"`;
      } else if(r.type==="Yield") {
        return `${r.date},${r.type},"${r.crop}","${r.quantity} ${r.unit}","${r.note}"`;
      } else {
        return `${r.date},${r.type},"${r.crop}","${r.quantity} ${r.unit} × ${fmt(r.price)}","${r.note}"`;
      }
    }).join("\n");

    download(`farm-${todayStr()}.csv`, "Date,Type,Crop,Value,Note\n"+csv);
  };
}

function getDisplayValue(r){
  if(r.type==="Expense") return fmt(r.amount);
  if(r.type==="Yield") return `${r.quantity} ${r.unit}`;
  if(r.type==="Sale") return `${r.quantity} ${r.unit} × ${fmt(r.price)}`;
  return "—";
}

function getNumericValue(r){
  if(r.type==="Expense") return r.amount;
  if(r.type==="Sale") return r.quantity * r.price;
  return 0;
}

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
      <td data-label="तारीख">${r.date}</td>
      <td data-label="टाइप">${r.type}</td>
      <td data-label="फ़सल">${r.crop}</td>
      <td data-label="विवरण"><span class="pill ${r.type==='Expense'?'neg':'pos'}">${getDisplayValue(r)}</span></td>
      <td data-label="नोट">${r.note||""}</td>
      <td>
        <button class="btn secondary small" data-edit="${r.id}" style="margin-right:4px">✏️</button>
        <button class="btn secondary small" data-del="${r.id}">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.onclick = ()=>{
      const row = state.farm.find(x=>x.id === btn.dataset.edit);
      if(!row) return;
      
      farmEditId = row.id;
      const f = $("#form-farm");
      f.date.value = row.date;
      f.type.value = row.type;
      f.crop.value = row.crop;
      f.note.value = row.note;
      
      if(row.type==="Expense") {
        f.amount.value = row.amount;
      } else if(row.type==="Yield") {
        f.quantity.value = row.quantity;
        f.unit.value = row.unit;
      } else if(row.type==="Sale") {
        f.quantity.value = row.quantity;
        f.unit.value = row.unit;
        f.price.value = row.price;
      }
      
      f.querySelector('button[type="submit"]').textContent = "💾 अपडेट करें";
      f.dispatchEvent(new Event("change"));
      f.querySelector('input[name="date"]').focus();
      openTab("farm");
    };
  });

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.farm = state.farm.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata", state);
      renderFarm();
    };
  });

  const expense = state.farm
    .filter(x=>x.type==="Expense")
    .reduce((a,b)=>a+(b.amount||0),0);

  const sales = state.farm
    .filter(x=>x.type==="Sale")
    .reduce((a,b)=>a+(b.quantity*b.price||0),0);

  const profit = sales - expense;

  $("#farm-expense").textContent = fmt(expense);
  $("#farm-sales").textContent = fmt(sales);
  
  const profitEl = $("#farm-profit");
  profitEl.textContent = fmt(profit);
  profitEl.style.color = profit >= 0 ? "#7ef29a" : "#ff9b9b";

  const goal = Math.max(1, expense + sales);
  $("#farm-expense-bar").style.width = (expense/goal*100)+"%";
  $("#farm-sales-bar").style.width   = (sales/goal*100)+"%";
  
  // Update chart
  const maxVal = Math.max(expense, sales, 1);
  $("#exp-bar").style.height = (expense/maxVal*100)+"%";
  $("#sale-bar").style.height = (sales/maxVal*100)+"%";
}

let farmSortField = 'date';
let farmSortDir = 1;

function sortFarm(field) {
  if (farmSortField === field) {
    farmSortDir = -farmSortDir;
  } else {
    farmSortField = field;
    farmSortDir = 1;
  }
  state.farm.sort((a, b) => {
    let va, vb;
    if (field === 'date') {
      va = new Date(a.date);
      vb = new Date(b.date);
    } else if (field === 'amount') {
      va = getNumericValue(a);
      vb = getNumericValue(b);
    } else {
      va = a[field] || '';
      vb = b[field] || '';
    }
    if (va < vb) return -farmSortDir;
    if (va > vb) return farmSortDir;
    return 0;
  });
  renderFarm();
}


function renderReports(){
  const homeTotal = state.home.reduce((a,b)=>a+b.amount,0);
  const rentTotal = state.rent.filter(x=>x.status!="Pending").reduce((a,b)=>a+b.amount,0);
  const sale = state.farm.filter(x=>x.type==="Sale").reduce((a,b)=>a+(b.quantity*b.price||0),0);
  const exp  = state.farm.filter(x=>x.type==="Expense").reduce((a,b)=>a+(b.amount||0),0);

  $("#r-home").textContent = fmt(homeTotal);
  $("#r-rent").textContent = fmt(rentTotal);
  $("#r-farm").textContent = fmt(sale - exp);

  const sum = Math.max(1, homeTotal + rentTotal);
  $("#r-ratio").style.width = (rentTotal/sum*100)+"%";
}

// =========================================================
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

// =========================================================
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

// =========================================================
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


