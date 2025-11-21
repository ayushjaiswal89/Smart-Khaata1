/* --------------------------
   UTILITIES
---------------------------*/
const $ = (s,o=document)=>o.querySelector(s);
const $$ = (s,o=document)=>[...o.querySelectorAll(s)];
const fmt = n=>"₹"+(Number(n||0)).toLocaleString("en-IN",{maximumFractionDigits:2});
const today = ()=>new Date().toISOString().slice(0,10);
const monthKey = d=>(d||today()).slice(0,7);

const store = {
  set(k,v){ localStorage.setItem(k,JSON.stringify(v)); },
  get(k,d){ try{return JSON.parse(localStorage.getItem(k))??d}catch{return d;} }
};

/* --------------------------
   STATE
---------------------------*/
const state = store.get("smart-khaata", {
  home:[], rent:[], farm:[],
  settings:{goalExpense:0, goalRent:0}
});




/* ============================
   UNIVERSAL MOBILE CSV DOWNLOAD
   (Android + iPhone Fully Working)
============================ */

function download(filename, text, mime = "text/csv") {

  const BOM = "\uFEFF";   // Hindi/Unicode support

  const blob = new Blob([BOM + text], {
    type: "application/octet-stream"   // IMPORTANT FIX for Android+IOS
  });

  const url = URL.createObjectURL(blob);

  // Create link
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;

  // Needed for iPhone/Android download
  document.body.appendChild(a);
  a.click();

  // ------------------------------
  // iPhone Safari: Open fallback
  // ------------------------------
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    setTimeout(() => {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => document.body.removeChild(iframe), 2000);
    }, 500);
  }

  // Clean
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 1500);
}


/* -------------------------------------------------
   TABS SYSTEM – Desktop & Mobile both now clean
--------------------------------------------------*/
function openTab(tab){
  // desktop
  $$(".tabs .tab-btn").forEach(b=>b.classList.remove("active"));
  const d = $(`.tabs .tab-btn[data-tab="${tab}"]`);
  if(d) d.classList.add("active");

  // sections
  $$(".tab").forEach(x=>x.classList.add("hidden"));
  $(`#tab-${tab}`).classList.remove("hidden");
}

$$(".tabs .tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> openTab(btn.dataset.tab) );
});

/* -------------------------------------------------
   MOBILE MENU (FINAL WORKING VERSION)
--------------------------------------------------*/
const mobMenu = $("#mobile-menu");
const mobToggle = $("#menu-toggle");

mobToggle.addEventListener("click", ()=>{
  mobMenu.classList.toggle("open");
  document.body.classList.toggle("menu-open", mobMenu.classList.contains("open"));

  mobToggle.textContent = mobMenu.classList.contains("open")
    ? "✖ Close"
    : "☰ Menu";
});

// Mobile tab click → open + close menu
$("#mobile-menu").querySelectorAll("button").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    openTab(btn.dataset.tab);
    mobMenu.classList.remove("open");
    mobToggle.textContent="☰ Menu";
  });
});

/* -------------------------------------------------
   SCROLL HEADER EFFECT
--------------------------------------------------*/
window.addEventListener("scroll",()=>{
  $("header").classList.toggle("scrolled", window.scrollY>30);
});

/* -------------------------------------------------
   HOME / RENT / FARM / REPORTS / SETTINGS
   (Full original logic kept SAME — only optimized)
--------------------------------------------------*/

// ************  HOME  ************
$("#form-home").date.value = today();

$("#form-home").addEventListener("submit",e=>{
  e.preventDefault();
  const f=e.target;

  state.home.unshift({
    id:crypto.randomUUID(),
    date:f.date.value,
    category:f.category.value,
    amount:Number(f.amount.value),
    note:f.note.value
  });

  store.set("smart-khaata", state);
  f.reset(); f.date.value=today();
  renderHome(); seedMonths();
});

$("#home-search").oninput = renderHome;
$("#home-month-filter").onchange = renderHome;

$("#home-clear").onclick = ()=>{
  if(confirm("सभी Home रिकॉर्ड हटाएँ?")){
    state.home = [];
    store.set("smart-khaata", state);
    renderHome();
  }
};

$("#home-export").onclick = ()=>{
  const rows = filteredHome();
  const csv = "date,category,note,amount\n" +
    rows.map(r=>`${r.date},${r.category},"${r.note}",${r.amount}`).join("\n");
  download("home.csv",csv);
};

function filteredHome(){
  const q=$("#home-search").value.toLowerCase();
  const m=$("#home-month-filter").value;

  return state.home.filter(r=>
    (!m || monthKey(r.date)==m) &&
    (!q || r.category.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
  );
}

function renderHome(){
  const rows = filteredHome();
  const body = $("#home-table tbody");

  body.innerHTML = rows.map(r=>`
    <tr>
      <td data-label="तारीख">${r.date}</td>
      <td data-label="कैटेगरी">${r.category}</td>
      <td data-label="विवरण">${r.note}</td>
      <td data-label="राशि"><span class="pill neg">${fmt(r.amount)}</span></td>
      <td><button data-del="${r.id}" class="btn secondary small">हटाएँ</button></td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick = ()=>{
      state.home = state.home.filter(x=>x.id!=b.dataset.del);
      store.set("smart-khaata",state);
      renderHome();
    };
  });

  // KPIs
  const tm = state.home.filter(x=>monthKey(x.date)==monthKey()).reduce((a,b)=>a+b.amount,0);
  $("#home-month-total").textContent = fmt(tm);

  const goal = state.settings.goalExpense||1;
  $("#home-month-bar").style.width = (tm/goal*100).toFixed(1)+"%";

  const cat = {};
  state.home.forEach(x=>cat[x.category]=(cat[x.category]||0)+x.amount);
  $("#home-top-cat").textContent = Object.entries(cat).sort((a,b)=>b[1]-a[1])[0]?.[0]||"—";

  $("#home-daily-avg").textContent = fmt( tm / new Date().getDate() );
}

// **************** RENT ****************
// (same optimized structure like home)

$("#form-rent").date.value=today();

$("#form-rent").addEventListener("submit",e=>{
  e.preventDefault();
  const f=e.target;

  const ym = f.date.value.slice(0,4)+"-"+({
    Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
    Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12",
  }[f.month.value]);

  state.rent.unshift({
    id:crypto.randomUUID(),
    date:f.date.value,
    tenant:f.tenant.value,
    month:f.month.value,
    yearMonth:ym,
    amount:Number(f.amount.value),
    status:f.status.value,
    note:f.note.value
  });

  store.set("smart-khaata",state);
  f.reset(); f.date.value=today();
  renderRent(); seedMonths();
});

$("#rent-search").oninput = renderRent;
$("#rent-month-filter").onchange = renderRent;

$("#rent-clear").onclick = ()=>{
  if(confirm("सभी Rent हटाएँ?")){
    state.rent=[];
    store.set("smart-khaata",state);
    renderRent();
  }
};

$("#rent-export").onclick = ()=>{
  const rows = filteredRent();
  const csv = "date,tenant,month,amount,status,note\n" +
    rows.map(r=>`${r.date},"${r.tenant}",${r.month},${r.amount},${r.status},"${r.note}"`).join("\n");
  download("rent.csv",csv);
};

function filteredRent(){
  const q=$("#rent-search").value.toLowerCase();
  const m=$("#rent-month-filter").value;

  return state.rent.filter(r=>
    (!m || r.yearMonth==m) &&
    (!q || r.tenant.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
  );
}

function renderRent(){
  const rows = filteredRent();
  const body = $("#rent-table tbody");

  body.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.tenant}</td>
      <td>${r.month}</td>
      <td><span class="pill pos">${fmt(r.amount)}</span></td>
      <td>${r.status}</td>
      <td><button data-del="${r.id}" class="btn secondary small">हटाएँ</button></td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick=()=>{
      state.rent=state.rent.filter(x=>x.id!=b.dataset.del);
      store.set("smart-khaata",state);
      renderRent();
    };
  });

  const ym = monthKey();
  const total = state.rent.filter(x=>x.yearMonth==ym && x.status!="Pending")
               .reduce((a,b)=>a+b.amount,0);

  const pending = state.rent.filter(x=>x.yearMonth==ym && x.status!="Received")
                 .reduce((a,b)=>a+b.amount,0);

  $("#rent-month-total").textContent=fmt(total);
  $("#rent-pending").textContent=fmt(pending);
  $("#rent-tenants").textContent=new Set(state.rent.map(x=>x.tenant)).size;
}

/* ---------------- FARM ---------------- */
$("#form-farm").date.value=today();

$("#form-farm").addEventListener("submit",e=>{
  e.preventDefault();
  const f=e.target;

  state.farm.unshift({
    id:crypto.randomUUID(),
    date:f.date.value,
    type:f.type.value,
    crop:f.crop.value,
    value:Number(f.value.value),
    note:f.note.value
  });

  store.set("smart-khaata",state);
  f.reset(); f.date.value=today();
  renderFarm(); seedMonths();
});

$("#farm-search").oninput = renderFarm;
$("#farm-type-filter").onchange = renderFarm;

$("#farm-clear").onclick = ()=>{
  if(confirm("सभी Farm हटाएँ?")){
    state.farm=[];
    store.set("smart-khaata",state);
    renderFarm();
  }
};

$("#farm-export").onclick = ()=>{
  const rows = filteredFarm();
  const csv="date,type,crop,value,note\n"+
    rows.map(r=>`${r.date},${r.type},"${r.crop}",${r.value},"${r.note}"`).join("\n");
  download("farm.csv",csv);
};

function filteredFarm(){
  const q=$("#farm-search").value.toLowerCase();
  const t=$("#farm-type-filter").value;

  return state.farm.filter(r=>
    (!t || r.type==t) &&
    (!q || r.crop.toLowerCase().includes(q) || r.note.toLowerCase().includes(q))
  );
}

function renderFarm(){
  const rows = filteredFarm();
  const body = $("#farm-table tbody");

  body.innerHTML = rows.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${r.type}</td>
      <td>${r.crop}</td>
      <td>${r.value}</td>
      <td>${r.note}</td>
      <td><button data-del="${r.id}" class="btn secondary small">हटाएँ</button></td>
    </tr>
  `).join("");

  body.querySelectorAll("[data-del]").forEach(b=>{
    b.onclick=()=>{
      state.farm=state.farm.filter(x=>x.id!=b.dataset.del);
      store.set("smart-khaata",state);
      renderFarm();
    };
  });

  const exp = state.farm.filter(x=>x.type=="Expense").reduce((a,b)=>a+b.value,0);
  const sal = state.farm.filter(x=>x.type=="Sale").reduce((a,b)=>a+b.value,0);
  const prof = sal-exp;

  $("#farm-expense").textContent=fmt(exp);
  $("#farm-sales").textContent=fmt(sal);
  $("#farm-profit").textContent=fmt(prof);

  const t = Math.max(1,exp+sal);
  $("#farm-expense-bar").style.width=(exp/t*100)+"%";
  $("#farm-sales-bar").style.width=(sal/t*100)+"%";
}

/* ---------------- REPORTS ---------------- */
function renderReports(){
  const home = state.home.reduce((a,b)=>a+b.amount,0);
  const rent = state.rent.filter(x=>x.status!="Pending").reduce((a,b)=>a+b.amount,0);

  const sale = state.farm.filter(x=>x.type=="Sale").reduce((a,b)=>a+b.value,0);
  const exp  = state.farm.filter(x=>x.type=="Expense").reduce((a,b)=>a+b.value,0);
  const prof = sale-exp;

  $("#r-home").textContent=fmt(home);
  $("#r-rent").textContent=fmt(rent);
  $("#r-farm").textContent=fmt(prof);

  const tot = Math.max(1,home+rent);
  $("#r-ratio").style.width=(rent/tot*100)+"%";
}

/* ---------------- SETTINGS ---------------- */
function loadSettings(){
  $("#goal-expense").value = state.settings.goalExpense||0;
  $("#goal-rent").value = state.settings.goalRent||0;
}
$("#save-settings").onclick = ()=>{
  state.settings.goalExpense = Number($("#goal-expense").value);
  state.settings.goalRent = Number($("#goal-rent").value);
  store.set("smart-khaata",state);
  $("#save-msg").textContent="Saved!";
  setTimeout(()=>$("#save-msg").textContent="",1200);
  renderReports();
};

/* ---------------- BACKUP ---------------- */
$("#backup-export").onclick = ()=>{
  const json = JSON.stringify(state,null,2);
  $("#backup-text").value = json;
  download("backup.json", json, "application/json");
};

$("#backup-import").onchange = async e=>{
  const f=e.target.files[0];
  if(!f) return;
  try{
    const d=JSON.parse(await f.text());
    Object.assign(state, d);
    store.set("smart-khaata",state);
    renderAll();
    alert("Backup imported successfully!");
  }catch{
    alert("Invalid JSON!");
  }
};

/* ---------------- RENDER ALL ---------------- */
function seedMonths(){
  const m=new Set([
    ...state.home.map(x=>monthKey(x.date)),
    ...state.rent.map(x=>x.yearMonth),
    ...state.farm.map(x=>monthKey(x.date)),
    monthKey()
  ]);

  function fill(id){
    const s=$(id);
    const v=s.value;
    s.innerHTML='<option value="">सभी महीने</option>'+
       [...m].sort().map(x=>`<option>${x}</option>`).join("");
    if(m.has(v)) s.value=v;
  }

  fill("#home-month-filter");
  fill("#rent-month-filter");
}

function renderAll(){
  renderHome();
  renderRent();
  renderFarm();
  renderReports();
  seedMonths();
  loadSettings();
}

renderAll();

