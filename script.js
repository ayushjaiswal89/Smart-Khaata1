
// =========================================================
// SMART KHAATA - FULL SCRIPT
// =========================================================

// ---------- Utilities ----------
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

const fmt = n =>
  "₹" + Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });

const todayStr = () =>
  new Date().toISOString().slice(0,10);

const monthKey = d =>
  (d || todayStr()).slice(0,7);

// ---------- Local Storage ----------
const store = {

  set(k,v){
    localStorage.setItem(k, JSON.stringify(v));
  },

  get(k,def){
    try{
      return JSON.parse(
        localStorage.getItem(k)
      ) ?? def;
    }catch{
      return def;
    }
  }
};

// ---------- App State ----------
const state = store.get("smart-khaata", {

  home: [],
  rent: [],
  farm: [],

  settings: {
    goalExpense: 5000,
    goalRent: 10000
  }
});

// =========================================================
// DOWNLOAD
// =========================================================

function download(
  filename,
  text,
  mime="text/csv"
){

  const blob = new Blob(
    [text],
    { type: mime }
  );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download = filename;

  a.click();
}

// =========================================================
// TABS
// =========================================================

const sections = {

  home: $("#tab-home"),
  rent: $("#tab-rent"),
  farm: $("#tab-farm"),
  reports: $("#tab-reports"),
  backup: $("#tab-backup"),
  settings: $("#tab-settings")
};

function openTab(name){

  Object.values(sections)
    .forEach(s =>
      s.classList.add("hidden")
    );

  sections[name]
    ?.classList.remove("hidden");

  $$(".tab-btn").forEach(btn =>
    btn.classList.remove("active")
  );

  $(`.tab-btn[data-tab="${name}"]`)
    ?.classList.add("active");
}

$$(".tab-btn").forEach(btn=>{

  btn.onclick = ()=>{

    openTab(btn.dataset.tab);
  };
});

// =========================================================
// HOME
// =========================================================

$("#form-home").date.value =
  todayStr();

$("#form-home").addEventListener(
  "submit",
  e => {

    e.preventDefault();

    const f = e.target;

    state.home.unshift({

      id: crypto.randomUUID(),

      date:
        f.date.value,

      category:
        f.category.value,

      amount:
        Number(f.amount.value),

      note:
        f.note.value
    });

    store.set(
      "smart-khaata",
      state
    );

    f.reset();

    f.date.value =
      todayStr();

    renderHome();
    renderReports();
  }
);

function renderHome(){

  const tbody =
    $("#home-table tbody");

  tbody.innerHTML =
    state.home.map(r=>`

      <tr>

        <td>${r.date}</td>

        <td>${r.category}</td>

        <td>${r.note}</td>

        <td>
          <span class="pill neg">
            ${fmt(r.amount)}
          </span>
        </td>

        <td>

          <button
            onclick="deleteHome('${r.id}')">
            🗑️
          </button>

        </td>

      </tr>

    `).join("");

  const total =
    state.home.reduce(
      (a,b)=>a+b.amount,
      0
    );

  $("#home-month-total")
    .textContent =
      fmt(total);

  $("#home-daily-avg")
    .textContent =
      fmt(
        total /
        Math.max(
          1,
          new Date().getDate()
        )
      );

  const byCat = {};

  state.home.forEach(x=>{

    byCat[x.category] =
      (byCat[x.category] || 0)
      + x.amount;
  });

  $("#home-top-cat")
    .textContent =

      Object.entries(byCat)
        .sort((a,b)=>
          b[1]-a[1]
        )[0]?.[0] || "—";
}

function deleteHome(id){

  state.home =
    state.home.filter(
      x => x.id !== id
    );

  store.set(
    "smart-khaata",
    state
  );

  renderHome();
  renderReports();
}

// =========================================================
// RENT
// =========================================================

$("#form-rent").date.value =
  todayStr();

$("#form-rent").addEventListener(
  "submit",
  e => {

    e.preventDefault();

    const f = e.target;

    state.rent.unshift({

      id: crypto.randomUUID(),

      date:
        f.date.value,

      tenant:
        f.tenant.value,

      month:
        f.month.value,

      amount:
        Number(f.amount.value),

      status:
        f.status.value,

      note:
        f.note.value
    });

    store.set(
      "smart-khaata",
      state
    );

    f.reset();

    f.date.value =
      todayStr();

    renderRent();
    renderReports();
  }
);

function renderRent(){

  const tbody =
    $("#rent-table tbody");

  tbody.innerHTML =
    state.rent.map(r=>`

      <tr>

        <td>${r.date}</td>

        <td>${r.tenant}</td>

        <td>${r.month}</td>

        <td>
          <span class="pill pos">
            ${fmt(r.amount)}
          </span>
        </td>

        <td>${r.status}</td>

        <td>

          <button
            onclick="deleteRent('${r.id}')">
            🗑️
          </button>

        </td>

      </tr>

    `).join("");

  const total =
    state.rent.reduce(
      (a,b)=>a+b.amount,
      0
    );

  const pending =
    state.rent
      .filter(x =>
        x.status === "Pending"
      )
      .reduce(
        (a,b)=>a+b.amount,
        0
      );

  $("#rent-month-total")
    .textContent =
      fmt(total);

  $("#rent-pending")
    .textContent =
      fmt(pending);

  $("#rent-tenants")
    .textContent =
      new Set(
        state.rent.map(
          x => x.tenant
        )
      ).size;
}

function deleteRent(id){

  state.rent =
    state.rent.filter(
      x => x.id !== id
    );

  store.set(
    "smart-khaata",
    state
  );

  renderRent();
  renderReports();
}

// =========================================================
// FARM
// =========================================================

$("#form-farm").date.value =
  todayStr();

let farmEditId = null;

// ---------- Toggle Fields ----------

function toggleFarmFields(type){

  $$(".farm-expense-field")
    .forEach(el =>
      el.style.display =
        type === "Expense"
        ? "block"
        : "none"
    );

  $$(".farm-qty-field")
    .forEach(el =>
      el.style.display =
        type !== "Expense"
        ? "block"
        : "none"
    );

  $$(".farm-unit-field")
    .forEach(el =>
      el.style.display =
        type !== "Expense"
        ? "block"
        : "none"
    );

  $$(".farm-price-field")
    .forEach(el =>
      el.style.display =
        type === "Sale"
        ? "block"
        : "none"
    );
}

$("#farm-type-select")
  .addEventListener(
    "change",
    e =>
      toggleFarmFields(
        e.target.value
      )
  );

toggleFarmFields("Expense");

// ---------- Quick Buttons ----------

function setFarmType(type){

  $("#farm-type-select").value =
    type;

  toggleFarmFields(type);
}

// ---------- Add Record ----------

$("#form-farm")
  .addEventListener(
    "submit",
    e => {

      e.preventDefault();

      const f = e.target;

      const type =
        f.type.value;

      const data = {

        id:
          farmEditId
          ||
          crypto.randomUUID(),

        date:
          f.date.value,

        type,

        crop:
          f.crop.value,

        note:
          f.note.value
      };

      if(type === "Expense"){

        data.amount =
          Number(f.amount.value);

      }else{

        data.quantity =
          Number(f.quantity.value);

        data.unit =
          f.unit.value;
      }

      if(type === "Sale"){

        data.price =
          Number(f.price.value);
      }

      if(farmEditId){

        state.farm =
          state.farm.map(x =>
            x.id === farmEditId
            ? data
            : x
          );

        farmEditId = null;

      }else{

        state.farm.unshift(data);
      }

      store.set(
        "smart-khaata",
        state
      );

      f.reset();

      f.date.value =
        todayStr();

      toggleFarmFields("Expense");

      renderFarm();
      renderReports();
    }
);

// ---------- Helpers ----------

function getFarmAmount(r){

  if(r.type === "Expense")
    return r.amount || 0;

  if(r.type === "Sale")
    return (
      r.quantity || 0
    ) * (
      r.price || 0
    );

  return 0;
}

function getFarmDisplay(r){

  if(r.type === "Expense")
    return fmt(r.amount);

  if(r.type === "Yield")
    return `${r.quantity} ${r.unit}`;

  if(r.type === "Sale")
    return `
      ${r.quantity}
      ${r.unit}
      ×
      ${fmt(r.price)}
    `;
}

// ---------- Render ----------

function renderFarm(){

  const tbody =
    $("#farm-table tbody");

  const q =
    $("#farm-search")
      ?.value
      ?.toLowerCase() || "";

  const t =
    $("#farm-type-filter")
      ?.value || "";

  const rows =
    state.farm.filter(r =>

      (!t || r.type === t)

      &&

      (
        !q ||

        r.crop
          .toLowerCase()
          .includes(q)

        ||

        (r.note || "")
          .toLowerCase()
          .includes(q)
      )
    );

  tbody.innerHTML =
    rows.map(r=>`

      <tr>

        <td>${r.date}</td>

        <td>${r.type}</td>

        <td>${r.crop}</td>

        <td>

          <span class="pill
            ${r.type==="Expense"
              ? "neg"
              : "pos"
            }">

            ${getFarmDisplay(r)}

          </span>

        </td>

        <td>${r.note}</td>

        <td>

          <button
            onclick="editFarm('${r.id}')">
            ✏️
          </button>

          <button
            onclick="deleteFarm('${r.id}')">
            🗑️
          </button>

        </td>

      </tr>

    `).join("");

  // KPI

  const expense =
    state.farm
      .filter(x =>
        x.type === "Expense"
      )
      .reduce(
        (a,b)=>
          a + (
            b.amount || 0
          ),
        0
      );

  const sales =
    state.farm
      .filter(x =>
        x.type === "Sale"
      )
      .reduce(
        (a,b)=>
          a + (
            (b.quantity||0)
            *
            (b.price||0)
          ),
        0
      );

  const profit =
    sales - expense;

  $("#farm-expense")
    .textContent =
      fmt(expense);

  $("#farm-sales")
    .textContent =
      fmt(sales);

  const profitEl =
    $("#farm-profit");

  profitEl.textContent =
    fmt(profit);

  profitEl.style.color =
    profit >= 0
      ? "#7ef29a"
      : "#ff6b6b";

  // Graph

  const max =
    Math.max(
      expense,
      sales,
      1
    );

  $("#exp-bar").style.height =
    (expense/max*100) + "%";

  $("#sale-bar").style.height =
    (sales/max*100) + "%";
}

// ---------- Delete ----------

function deleteFarm(id){

  state.farm =
    state.farm.filter(
      x => x.id !== id
    );

  store.set(
    "smart-khaata",
    state
  );

  renderFarm();
  renderReports();
}

// ---------- Edit ----------

function editFarm(id){

  const row =
    state.farm.find(
      x => x.id === id
    );

  if(!row) return;

  farmEditId = row.id;

  const f =
    $("#form-farm");

  f.date.value =
    row.date;

  f.type.value =
    row.type;

  f.crop.value =
    row.crop;

  f.note.value =
    row.note;

  if(row.type === "Expense"){

    f.amount.value =
      row.amount;

  }else{

    f.quantity.value =
      row.quantity;

    f.unit.value =
      row.unit;
  }

  if(row.type === "Sale"){

    f.price.value =
      row.price;
  }

  toggleFarmFields(row.type);

  openTab("farm");
}

// ---------- Search ----------

$("#farm-search")
  ?.addEventListener(
    "input",
    renderFarm
  );

$("#farm-type-filter")
  ?.addEventListener(
    "change",
    renderFarm
  );

// =========================================================
// REPORTS
// =========================================================

function renderReports(){

  const home =
    state.home.reduce(
      (a,b)=>a+b.amount,
      0
    );

  const rent =
    state.rent.reduce(
      (a,b)=>a+b.amount,
      0
    );

  const expense =
    state.farm
      .filter(x =>
        x.type==="Expense"
      )
      .reduce(
        (a,b)=>
          a + (
            b.amount || 0
          ),
        0
      );

  const sales =
    state.farm
      .filter(x =>
        x.type==="Sale"
      )
      .reduce(
        (a,b)=>
          a + (
            (b.quantity||0)
            *
            (b.price||0)
          ),
        0
      );

  $("#r-home")
    .textContent =
      fmt(home);

  $("#r-rent")
    .textContent =
      fmt(rent);

  $("#r-farm")
    .textContent =
      fmt(
        sales - expense
      );
}

// =========================================================
// SETTINGS
// =========================================================

$("#save-settings")
  ?.addEventListener(
    "click",
    ()=>{

      state.settings.goalExpense =
        Number(
          $("#goal-expense")
            .value
        );

      state.settings.goalRent =
        Number(
          $("#goal-rent")
            .value
        );

      store.set(
        "smart-khaata",
        state
      );

      $("#save-msg")
        .textContent =
          "सेव हुआ!";

      setTimeout(()=>{

        $("#save-msg")
          .textContent = "";

      },1500);
    }
);

// =========================================================
// BACKUP
// =========================================================

$("#backup-export")
  ?.addEventListener(
    "click",
    ()=>{

      const data =
        JSON.stringify(
          state,
          null,
          2
        );

      $("#backup-text")
        .value = data;

      download(
        "smart-khaata-backup.json",
        data,
        "application/json"
      );
    }
);

// =========================================================
// LANGUAGE TOGGLE
// =========================================================

let currentLang = "hi";

$("#lang-toggle")
  ?.addEventListener(
    "click",
    ()=>{

      currentLang =
        currentLang === "hi"
        ? "en"
        : "hi";

      $("#lang-toggle")
        .textContent =

          currentLang === "hi"
          ? "EN"
          : "HI";

      document.documentElement.lang =
        currentLang;
    }
);

// =========================================================
// INIT
// =========================================================

function renderAll(){

  renderHome();
  renderRent();
  renderFarm();
  renderReports();
}

renderAll();

openTab("home");

