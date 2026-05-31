// ---------- Utilities ----------
function fmt(n){
  const value = Number(n||0);
  const currency = state?.settings?.currency || 'INR';
  if(currency === 'USD'){
    return new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:2 }).format(value);
  }
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:2 }).format(value);
}
const todayStr = () => new Date().toISOString().slice(0,10);
const monthKey = d => (d||todayStr()).slice(0,7);

// store and DOM helpers moved to helpers.js (loaded before this file)

const defaultSettings = {
  goalExpense: 0,
  goalRent: 0,
  darkMode: false,
  language: 'hi',
  currency: 'INR',
  backupReminder: true,
  notifications: true,
  exportCsv: false
};

const settingsControls = [
  { key: 'goalExpense', selector: '#goal-expense', type: 'number' },
  { key: 'goalRent', selector: '#goal-rent', type: 'number' },
  { key: 'darkMode', selector: '#dark-mode-toggle', type: 'checked' },
  { key: 'language', selector: '#language-select', type: 'value' },
  { key: 'currency', selector: '#currency-select', type: 'value' },
  { key: 'backupReminder', selector: '#backup-reminder-toggle', type: 'checked' },
  { key: 'notifications', selector: '#notification-toggle', type: 'checked' },
  { key: 'exportCsv', selector: '#export-csv-toggle', type: 'checked' }
];

// validatePhoneNumber, normalizePhone, escapeHtml, setFieldError and clearFieldError
// are provided by helpers.js

// ---------- State ----------
const state = store.get("smart-khaata1", {
  home: [], rent: [], farm: [], settings: { ...defaultSettings }
});

let homeEditId = null;
let homeSortField = 'date';
let homeSortDir = -1; // descending

const translations = {
  hi: {
    appTitle: 'Smart Khaata',
    appSubtitle: 'Home • Rent • Farm',
    tabHome: '🏠 Home',
    tabRent: '🏢 Rent',
    tabFarm: '🌾 Farm',
    tabReports: '📊 Reports',
    tabBackup: '🗄️ Backup',
    tabSettings: '⚙️ Settings',
    bannerText: 'अपने खर्च, किराया और खेती को एक ही जगह पर ट्रैक करें। डेटा आपका फोन में सुरक्षित रहता है।',
    pullToRefresh: 'Pull to refresh',

    homeTitle: '🏠 Home Expenses',
    homeDescription: 'घर के खर्च जोड़ें, कैटेगरी के हिसाब से ट्रैक करें।',
    labelDate: 'तारीख',
    labelCategory: 'कैटेगरी',
    categoryGrocery: 'किराना',
    categoryUtility: 'यूटिलिटी',
    categoryMedical: 'दवा',
    categoryTransport: 'परिवहन',
    categoryEducation: 'शिक्षा',
    categoryOther: 'अन्य',
    labelAmount: 'राशि',
    labelNote: 'विवरण',
    homeNotePlaceholder: 'उदा. दूध, सब्ज़ी, बिजली बिल...',
    homeAddExpense: '➕ खर्च जोड़ें',
    homeClear: 'सूची साफ़ करें',
    homeMonthTotalLabel: 'इस माह कुल खर्च',
    homeDailyAvgLabel: 'दैनिक औसत',
    homeTopCategoryLabel: 'सबसे बड़ी कैटेगरी',
    homeSearchPlaceholder: 'खोजें (कैटेगरी/विवरण)',
    allMonths: 'सभी महीने',
    homeExport: 'CSV एक्सपोर्ट',
    homeDate: 'तारीख',
    homeCategory: 'कैटेगरी',
    homeDescriptionCol: 'विवरण',
    homeAmount: 'राशि',

    rentTitle: '🏢 Rent Income',
    rentDescription: 'किराये की इनकम, देय/प्राप्ति और टेनेंट ट्रैक करें।',
    labelTenant: 'टेनेंट',
    labelMonth: 'महीना',
    monthJan: 'Jan',
    monthFeb: 'Feb',
    monthMar: 'Mar',
    monthApr: 'Apr',
    monthMay: 'May',
    monthJun: 'Jun',
    monthJul: 'Jul',
    monthAug: 'Aug',
    monthSep: 'Sep',
    monthOct: 'Oct',
    monthNov: 'Nov',
    monthDec: 'Dec',
    labelWhatsapp: '📱 WhatsApp',
    whatsappPlaceholder: 'जैसे 9876543210',
    whatsappHelper: '10 अंकों का नंबर डालें या खाली छोड़ें।',
    labelRentAmount: 'किराया',
    labelStatus: 'स्टेटस',
    statusReceived: 'Received',
    statusPending: 'Pending',
    statusPartial: 'Partial',
    labelPrevReading: 'पहला रीडिंग',
    labelCurrentReading: 'वर्तमान रीडिंग',
    labelRatePerUnit: 'दर/यूनिट',
    readingExample: 'जैसे 520',
    readingExampleDecimal: 'जैसे 573.51',
    labelUnitsAuto: 'यूनिट (ऑटो)',
    labelLightBillAuto: 'बिजली बिल (ऑटो)',
    labelTotalRentBill: 'कुल (किराया + बिल)',
    zeroValue: '0.00',
    rupeeZero: '₹0',
    labelMeterPhoto: 'मीटर फोटो (वैकल्पिक)',
    notePlaceholder: 'कोई विशेष जानकारी...',
    rentAddIncome: '➕ इनकम जोड़ें',
    rentClear: 'सूची साफ़ करें',
    rentMonthTotalLabel: 'माह की कुल वसूली',
    rentElectricTotalLabel: 'लाइट बिल कुल',
    rentCombinedTotalLabel: 'माह कुल (Rent+Light)',
    rentReceivedLabel: '✓ Received',
    rentPendingLabel: '⏳ Pending',
    rentPartialLabel: '◐ Partial',
    rentTenantsLabel: 'टेनेंट्स',
    rentSearchPlaceholder: 'टेनेंट/नोट खोजें',
    rentExport: 'CSV एक्सपोर्ट',
    rentDate: 'तारीख',
    rentTenant: 'टेनेंट',
    rentMonth: 'महीना',
    rentUnits: 'इकाइयाँ',
    rentLightBill: 'लाइट बिल',
    rentTotal: 'कुल',
    rentStatus: 'स्टेटस',
    rentAmount: 'राशि',

    farmTitle: '🌾 Farm Management',
    farmDescription: 'खर्च/उत्पादन/बिक्री—एक ही जगह।',
    farmButtonExpense: '+ Expense',
    farmButtonYield: '+ Yield',
    farmButtonSale: '+ Sale',
    labelType: 'टाइप',
    farmTypeExpense: 'Expense',
    farmTypeYield: 'Yield',
    farmTypeSale: 'Sale',
    labelCrop: 'फ़सल',
    cropWheat: 'Wheat',
    cropRice: 'Rice',
    cropSoybean: 'Soybean',
    cropCotton: 'Cotton',
    cropOther: 'Other',
    labelExpenseCategory: 'खर्च की श्रेणी',
    selectCategory: '',
    expenseSeed: 'बीज',
    expenseFertilizer: 'खाद',
    expenseLabor: 'मजदूरी',
    expenseDiesel: 'डीजल',
    expenseIrrigation: 'सिंचाई',
    labelQuantity: 'मात्रा',
    labelUnit: 'यूनिट',
    labelPrice: 'कीमत',
    unitKg: 'Kg',
    unitQuintal: 'Quintal',
    unitTon: 'Ton',
    farmAddRecord: '➕ रिकॉर्ड जोड़ें',
    farmTotalExpense: 'कुल खर्च',
    farmTotalSales: 'कुल बिक्री',
    farmProfit: 'लाभ',
    farmSearchPlaceholder: 'खोजें (फ़सल/नोट)',
    allTypes: 'सभी टाइप',
    farmExport: 'CSV एक्सपोर्ट',
    farmGraphLabel: 'Expense vs Sale',
    farmDate: 'तारीख ⬍',
    farmType: 'टाइप',
    farmCrop: 'फ़सल',
    farmAmount: 'राशि ⬍',
    farmNote: 'नोट',
    farmAction: 'Action',

    reportsTitle: '📊 Reports & Insights',
    reportRefresh: 'Refresh',
    reportsSummary: 'समरी',
    reportsHome: 'Home खर्च',
    reportsRent: 'Rent प्राप्ति',
    reportsFarm: 'Farm प्रॉफिट',
    reportsNetBalance: 'Net Balance',
    reportsMonthlyTrend: 'मासिक ट्रेंड',
    reportsRentLabel: 'Rent',
    reportsHomeLabel: 'Home',
    reportsLegend: 'नीला = Rent, हरा = Home',

    backupTitle: '🗄️ Backup / Restore',
    backupExport: 'JSON Export',
    backupImport: 'JSON Import',
    backupTextareaPlaceholder: 'यहाँ JSON दिखेगा…',
    backupWarning: 'Import करने पर मौजूदा डेटा बदल सकता है। पहले Export ले लें।',

    settingsTitle: '⚙️ Settings',
    labelGoalExpense: 'महीने का खर्च लक्ष्य',
    expenseGoalPlaceholder: 'उदा. 15000',
    labelGoalRent: 'किराया लक्ष्य',
    rentGoalPlaceholder: 'उदा. 12000',
    labelLanguage: 'भाषा / Language',
    labelDarkMode: 'डार्क मोड',
    darkModeNote: 'रात में आरामदायक व्यू',
    labelCurrency: 'मुद्रा',
    backupReminderLabel: 'Backup reminder',
    backupReminderNote: 'साप्ताहिक स्थानीय बैकअप अलर्ट',
    notificationsLabel: 'Notifications',
    notificationsNote: 'Rent और expense नोटिफिकेशन',
    exportCsvLabel: 'Export CSV',
    exportCsvNote: 'महीने के CSV एक्सपोर्ट को तैयार रखें',
    resetSettings: 'रीसेट',
    settingsVersionInfo: 'App version 1.0 • Local save only',
    saveSettings: 'सेटिंग सेव करें',
    languageHelper: 'भाषा बदलने के बाद सेव करें।',
    savedMessage: 'सेव हुआ!',
    buttonDelete: 'हटाएँ',
    homeUpdateExpense: '💾 अपडेट करें',
    rentUpdateIncome: '💾 अपडेट करें',
    farmUpdateRecord: '💾 अपडेट करें',
    confirmHomeClear: 'क्या आप सभी Home रिकॉर्ड हटाना चाहते हैं?',
    confirmRentClear: 'क्या आप सभी Rent इनकम रिकॉर्ड हटाना चाहते हैं?',
    confirmBackupImport: 'Backup import करने से मौजूदा डेटा बदल जाएगा। क्या आप जारी रखना चाहते हैं?',
    confirmRentDuplicate: '⚠️ {tenant} का {month} {year} का entry पहले से है।\n\nक्या update करना है? OK = Update | Cancel = नई entry',
    importSuccess: 'इम्पोर्ट सफल!',
    invalidJson: 'Invalid JSON!',
    scanStatusScanning: 'स्कैन कर रहे हैं…',
    scanStatusNoReading: '❌ कोई मीटर रीडिंग नहीं मिली। कृपया फ़ोटो स्पष्ट लें या मैन्युअली दर्ज करें।',
    scanStatusFailed: '❌ स्कैन विफल। कृपया मैन्युअली दर्ज करें।',
    rentTenantRequired: 'कृपया टेनेंट नाम दर्ज करें।',
    rentAmountRequired: 'कृपया सही किराया राशि दर्ज करें।',
    rentInvalidWhatsApp: '10 अंकों का वैध WhatsApp नंबर दर्ज करें।',
    homeNoRecords: 'कोई खर्च रिकॉर्ड नहीं मिला। नया खर्च जोड़ें और इसे तुरंत ट्रैक करें।',
    rentNoRecords: 'कोई रिकॉर्ड नहीं मिला। नया किराया विवरण जोड़ें और मासिक इनकम साफ़ रखें।',
    farmNoRecords: 'कोई खेत रिकॉर्ड नहीं मिला। Expense, Yield या Sale जोड़कर शुरू करें।',
    whatsappSendButton: '📱 भेजें',
    invalidPhone: 'नंबर गलत',
    whatsappGreeting: 'नमस्ते {tenant} 🙏\n\n',
    whatsappMonthLabel: 'महीना: {month} {year}\n',
    whatsappPendingHeader: '⏳ आपका किराया अभी *लंबित* है:\n',
    whatsappPartialHeader: '◐ आपका किराया *आंशिक* प्राप्त हुआ:\n',
    whatsappReceivedHeader: '✓ आपका किराया प्राप्त हो गया:\n',
    whatsappRentAmountLabel: '💰 किराया: {amount}\n',
    whatsappLightBillLabel: '💡 लाइट बिल: {bill}\n',
    whatsappTotalLabel: '📊 कुल: {total}\n',
    whatsappPendingFooter: 'कृपया जल्दी भुगतान करें। धन्यवाद! 🙏',
    whatsappPartialFooter: 'कृपया शेष राशि भेजें। धन्यवाद! 🙏',
    whatsappReceivedFooter: 'आपकी तुरंत भुगतान के लिए धन्यवाद! 🙏',
    footerText: 'Smart Khaata • खर्च, किराया, खेती — सब एक जगह'
  },
  en: {
    appTitle: 'Smart Khaata',
    appSubtitle: 'Home • Rent • Farm',
    tabHome: '🏠 Home',
    tabRent: '🏢 Rent',
    tabFarm: '🌾 Farm',
    tabReports: '📊 Reports',
    tabBackup: '🗄️ Backup',
    tabSettings: '⚙️ Settings',
    bannerText: 'Track home, rent and farm in one place. Your data stays on your phone.',
    pullToRefresh: 'Pull to refresh',

    homeTitle: '🏠 Home Expenses',
    homeDescription: 'Track household spending and categorize it easily.',
    labelDate: 'Date',
    labelCategory: 'Category',
    categoryGrocery: 'Grocery',
    categoryUtility: 'Utility',
    categoryMedical: 'Medical',
    categoryTransport: 'Transport',
    categoryEducation: 'Education',
    categoryOther: 'Other',
    labelAmount: 'Amount',
    labelNote: 'Note',
    homeNotePlaceholder: 'e.g. milk, vegetables, electricity bill...',
    homeAddExpense: '➕ Add Expense',
    homeClear: 'Clear list',
    homeMonthTotalLabel: 'Month total',
    homeDailyAvgLabel: 'Daily average',
    homeTopCategoryLabel: 'Top category',
    homeSearchPlaceholder: 'Search (category/note)',
    allMonths: 'All months',
    homeExport: 'Export CSV',
    homeDate: 'Date',
    homeCategory: 'Category',
    homeDescriptionCol: 'Note',
    homeAmount: 'Amount',

    rentTitle: '🏢 Rent Income',
    rentDescription: 'Track rent payments, due amounts, and tenants.',
    labelTenant: 'Tenant',
    labelMonth: 'Month',
    monthJan: 'Jan',
    monthFeb: 'Feb',
    monthMar: 'Mar',
    monthApr: 'Apr',
    monthMay: 'May',
    monthJun: 'Jun',
    monthJul: 'Jul',
    monthAug: 'Aug',
    monthSep: 'Sep',
    monthOct: 'Oct',
    monthNov: 'Nov',
    monthDec: 'Dec',
    labelWhatsapp: '📱 WhatsApp',
    whatsappPlaceholder: 'e.g. 9876543210',
    whatsappHelper: 'Enter a 10 digit number or leave blank.',
    labelRentAmount: 'Rent',
    labelStatus: 'Status',
    statusReceived: 'Received',
    statusPending: 'Pending',
    statusPartial: 'Partial',
    labelPrevReading: 'Prev reading',
    labelCurrentReading: 'Current reading',
    labelRatePerUnit: 'Rate (/unit)',
    readingExample: 'e.g. 520',
    readingExampleDecimal: 'e.g. 573.51',
    labelUnitsAuto: 'Units (auto)',
    labelLightBillAuto: 'Light bill (auto)',
    labelTotalRentBill: 'Total (rent + bill)',
    zeroValue: '0.00',
    rupeeZero: '₹0',
    labelMeterPhoto: 'Meter photo (optional)',
    notePlaceholder: 'Additional notes...',
    rentAddIncome: '➕ Add Income',
    rentClear: 'Clear list',
    rentMonthTotalLabel: 'Month total collected',
    rentElectricTotalLabel: 'Light bill total',
    rentCombinedTotalLabel: 'Month total (Rent+Light)',
    rentReceivedLabel: '✓ Received',
    rentPendingLabel: '⏳ Pending',
    rentPartialLabel: '◐ Partial',
    rentTenantsLabel: 'Tenants',
    rentSearchPlaceholder: 'Search tenant/note',
    rentExport: 'Export CSV',
    rentDate: 'Date',
    rentTenant: 'Tenant',
    rentMonth: 'Month',
    rentUnits: 'Units',
    rentLightBill: 'Light bill',
    rentTotal: 'Total',
    rentStatus: 'Status',
    rentAmount: 'Amount',

    farmTitle: '🌾 Farm Management',
    farmDescription: 'Expense, yield and sale in one place.',
    farmButtonExpense: '+ Expense',
    farmButtonYield: '+ Yield',
    farmButtonSale: '+ Sale',
    labelType: 'Type',
    farmTypeExpense: 'Expense',
    farmTypeYield: 'Yield',
    farmTypeSale: 'Sale',
    labelCrop: 'Crop',
    cropWheat: 'Wheat',
    cropRice: 'Rice',
    cropSoybean: 'Soybean',
    cropCotton: 'Cotton',
    cropOther: 'Other',
    labelExpenseCategory: 'Expense category',
    selectCategory: '',
    expenseSeed: 'Seed',
    expenseFertilizer: 'Fertilizer',
    expenseLabor: 'Labor',
    expenseDiesel: 'Diesel',
    expenseIrrigation: 'Irrigation',
    labelQuantity: 'Quantity',
    labelUnit: 'Unit',
    labelPrice: 'Price',
    unitKg: 'Kg',
    unitQuintal: 'Quintal',
    unitTon: 'Ton',
    farmAddRecord: '➕ Add Record',
    farmTotalExpense: 'Total expense',
    farmTotalSales: 'Total sales',
    farmProfit: 'Profit',
    farmSearchPlaceholder: 'Search crop/note',
    allTypes: 'All types',
    farmExport: 'Export CSV',
    farmGraphLabel: 'Expense vs Sale',
    farmDate: 'Date ⬍',
    farmType: 'Type',
    farmCrop: 'Crop',
    farmAmount: 'Amount ⬍',
    farmNote: 'Note',
    farmAction: 'Action',

    reportsTitle: '📊 Reports & Insights',
    reportRefresh: 'Refresh',
    reportsSummary: 'Summary',
    reportsHome: 'Home spend',
    reportsRent: 'Rent income',
    reportsFarm: 'Farm profit',
    reportsNetBalance: 'Net Balance',
    reportsMonthlyTrend: 'Monthly trend',
    reportsRentLabel: 'Rent',
    reportsHomeLabel: 'Home',
    reportsLegend: 'Blue = Rent, Green = Home',

    backupTitle: '🗄️ Backup / Restore',
    backupExport: 'JSON Export',
    backupImport: 'JSON Import',
    backupTextareaPlaceholder: 'JSON will appear here…',
    backupWarning: 'Import will replace existing data. Export first.',

    settingsTitle: '⚙️ Settings',
    labelGoalExpense: 'Monthly expense goal',
    expenseGoalPlaceholder: 'e.g. 15000',
    labelGoalRent: 'Rent goal',
    rentGoalPlaceholder: 'e.g. 12000',
    labelLanguage: 'Language',
    labelDarkMode: 'Dark mode',
    darkModeNote: 'Comfortable night view',
    labelCurrency: 'Currency',
    backupReminderLabel: 'Backup reminder',
    backupReminderNote: 'Weekly local backup alert',
    notificationsLabel: 'Notifications',
    notificationsNote: 'Rent and expense alerts',
    exportCsvLabel: 'Export CSV',
    exportCsvNote: 'Keep monthly export ready',
    resetSettings: 'Reset',
    settingsVersionInfo: 'App version 1.0 • Local save only',
    saveSettings: 'Save Settings',
    languageHelper: 'Change language and save to apply.',
    savedMessage: 'Saved!',
    buttonDelete: 'Delete',
    homeUpdateExpense: '💾 Update',
    rentUpdateIncome: '💾 Update',
    farmUpdateRecord: '💾 Update',
    confirmHomeClear: 'Are you sure you want to delete all Home records?',
    confirmRentClear: 'Are you sure you want to delete all Rent income records?',
    confirmBackupImport: 'Backup import will overwrite existing data. Continue?',
    confirmRentDuplicate: '⚠️ {tenant} already has an entry for {month} {year}.\n\nUpdate existing? OK = Update | Cancel = Add new entry',
    importSuccess: 'Import successful!',
    invalidJson: 'Invalid JSON!',
    scanStatusScanning: 'Scanning...',
    scanStatusNoReading: '❌ No meter reading found. Please use a clearer photo or enter manually.',
    scanStatusFailed: '❌ Scan failed. Please enter manually.',
    rentTenantRequired: 'Please enter tenant name.',
    rentAmountRequired: 'Please enter a valid rent amount.',
    rentInvalidWhatsApp: 'Please enter a valid 10-digit WhatsApp number.',
    homeNoRecords: 'No expense records found. Add a new expense to start tracking instantly.',
    rentNoRecords: 'No rent records found. Add a new rent entry to keep monthly income organized.',
    farmNoRecords: 'No farm records found. Start by adding Expense, Yield, or Sale.',
    whatsappSendButton: 'Send',
    invalidPhone: 'Invalid number',
    whatsappGreeting: 'Hello {tenant} 🙏\n\n',
    whatsappMonthLabel: 'Month: {month} {year}\n',
    whatsappPendingHeader: '⏳ Your rent is currently *Pending*:\n',
    whatsappPartialHeader: '◐ Your rent is *Partially* received:\n',
    whatsappReceivedHeader: '✓ Your rent has been received:\n',
    whatsappRentAmountLabel: '💰 Rent: {amount}\n',
    whatsappLightBillLabel: '💡 Light bill: {bill}\n',
    whatsappTotalLabel: '📊 Total: {total}\n',
    whatsappPendingFooter: 'Please pay soon. Thank you! 🙏',
    whatsappPartialFooter: 'Please send the remaining amount. Thank you! 🙏',
    whatsappReceivedFooter: 'Thank you for your prompt payment! 🙏',
    footerText: 'Smart Khaata • Expense, Rent, Farm — all in one place'
  }
};

function applyTranslationValues(lang) {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const text = translations[lang]?.[key];
    if(text === undefined) return;
    if(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if(el.hasAttribute('placeholder')) {
        el.placeholder = text;
      } else {
        el.value = text;
      }
    } else {
      el.textContent = text;
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    const text = translations[lang]?.[key];
    if(text !== undefined) el.placeholder = text;
  });

  // For certain numeric/money placeholders override translation with formatted values
  // so they react to the selected currency (e.g., ₹0 or $0.00)
  try {
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      if(key === 'rupeeZero') {
        el.placeholder = fmt(0);
      }
      if(key === 'zeroValue') {
        // keep numeric zero without currency symbol
        el.placeholder = (0).toFixed(2);
      }
    });
  } catch(e) {
    // silent
  }

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    const text = translations[lang]?.[key];
    if(text !== undefined) el.title = text;
  });
}

function translatePage(lang) {
  document.documentElement.lang = lang;
  applyTranslationValues(lang);
}

function t(key, replacements = {}) {
  const lang = state.settings?.language || 'hi';
  let text = translations[lang]?.[key] ?? translations.hi?.[key] ?? key;
  return String(text).replace(/\{(\w+)\}/g, (_, name) => replacements[name] ?? '');
}

// CSV download helper moved to csv.js

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

  $$("#mobile-menu [data-tab]").forEach(b => b.classList.remove("active"));
  const mobileBtn = $(`#mobile-menu [data-tab="${name}"]`);
  if(mobileBtn) mobileBtn.classList.add("active");

  $$(".bottom-nav button[data-tab]").forEach(b => b.classList.remove("active"));
  const bottomBtn = $(`.bottom-nav button[data-tab="${name}"]`);
  if(bottomBtn) bottomBtn.classList.add("active");

  Object.values(sections).forEach(s => s.classList.add("hidden"));
  if(sections[name]) sections[name].classList.remove("hidden");

  const fab = $("#fab-add");
  if(fab) fab.style.display = name === "settings" ? "none" : "flex";

  const menu = $("#mobile-menu");
  const overlay = $("#menu-overlay");
  if(menu) menu.classList.remove("open");
  if(overlay){ overlay.classList.remove("visible"); overlay.hidden = true; }
  $("#menu-toggle").textContent = "☰";
  updateDrawerSummary();
}

function updateDrawerSummary(){
  const tenants = new Set(state.rent.map(x=>x.tenant)).size;
  const crops = new Set(state.farm.map(x=>x.crop)).size;
  const homeTotal = state.home.reduce((sum,r)=>sum+(r.amount||0),0);
  const rentTotal = state.rent.reduce((sum,r)=>sum+(r.totalAmount ?? r.amount ?? 0),0);
  const farmSales = state.farm.filter(x=>x.type==="Sale").reduce((sum,r)=>sum+((r.quantity||0)*(r.price||0)),0);
  const farmExpense = state.farm.filter(x=>x.type==="Expense").reduce((sum,r)=>sum+(r.amount||0),0);
  const farmProfit = farmSales - farmExpense;
  const netBalance = rentTotal + farmProfit - homeTotal;
  if($("#drawer-tenants")) $("#drawer-tenants").textContent = tenants;
  if($("#drawer-crops")) $("#drawer-crops").textContent = crops;
  if($("#drawer-net")) $("#drawer-net").textContent = fmt(netBalance);
}

// desktop click
desktopTabs.forEach(b =>
  b.addEventListener("click", ()=> openTab(b.dataset.tab))
);

// ---------- Mobile menu ----------
const mobMenu = $("#mobile-menu");
const mobToggle = $("#menu-toggle");
const menuOverlay = $("#menu-overlay");
const drawerClose = $("#drawer-close");

mobToggle.addEventListener("click", ()=>{
  mobMenu.classList.toggle("open");
  if(menuOverlay){ menuOverlay.hidden = false; menuOverlay.classList.toggle("visible", mobMenu.classList.contains("open")); }
  mobToggle.textContent = mobMenu.classList.contains("open") ? "✖" : "☰";
});

drawerClose?.addEventListener("click", ()=>{
  mobMenu.classList.remove("open");
  mobToggle.textContent = "☰";
  if(menuOverlay){ menuOverlay.classList.remove("visible"); menuOverlay.hidden = true; }
});

menuOverlay?.addEventListener("click", ()=>{
  mobMenu.classList.remove("open");
  mobToggle.textContent = "☰";
  if(menuOverlay){ menuOverlay.classList.remove("visible"); menuOverlay.hidden = true; }
});

mobMenu.querySelectorAll("[data-tab]").forEach(btn=>{
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
  fill("#report-month-filter");
}

// =========================================================
// ---------------------- HOME -----------------------------
// =========================================================

$("#form-home").addEventListener("reset", () => {
  homeEditId = null;
  $("#form-home button[type='submit']").textContent = t('homeAddExpense');
  $("#form-home").date.value = todayStr();
});

$("#form-home").date.value = todayStr();

$("#form-home").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;

  if(homeEditId) {
    // Update existing record
    const index = state.home.findIndex(x => x.id === homeEditId);
    if(index !== -1) {
      state.home[index] = {
        ...state.home[index],
        date: f.date.value,
        category: f.category.value,
        amount: Number(f.amount.value||0),
        note: f.note.value.trim()
      };
    }
    homeEditId = null;
    f.querySelector('button[type="submit"]').textContent = t('homeAddExpense');
  } else {
    // Add new record
    state.home.unshift({
      id: crypto.randomUUID(),
      date: f.date.value,
      category: f.category.value,
      amount: Number(f.amount.value||0),
      note: f.note.value.trim()
    });
  }

  store.set("smart-khaata1", state);

  const homeMonthFilter = $("#home-month-filter");
  if(homeMonthFilter){
    homeMonthFilter.value = f.date.value.slice(0,7);
  }

  f.reset(); 
  f.date.value = todayStr();

  renderHome(); 
  seedMonthSelects();
});

function addPullToRefresh() {
  const indicator = $("#pull-indicator");
  let startY = 0;
  let isPulling = false;

  window.addEventListener('touchstart', e => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0) {
      startY = e.touches[0].clientY;
    }
  });

  window.addEventListener('touchmove', e => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    if (scrollTop === 0 && startY > 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 60) {
        isPulling = true;
        indicator.classList.add('show');
      }
    }
  });
  window.addEventListener('touchend', e => {
    if (isPulling) {
      indicator.classList.remove('show');
      renderAll();
      isPulling = false;
    }
    startY = 0;
  });
}

function applyLanguage(lang){
  translatePage(lang);
}

function setupEventListeners() {
  const homeClr = $("#home-clear");
  if(homeClr) homeClr.onclick = ()=>{
    if(confirm(t('confirmHomeClear'))){
      state.home = [];
      store.set("smart-khaata1", state);
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
      "Date,Category,Note,Amount\n" + 
      rows.map(r => `"${r.date}","${r.category}","${r.note}",${r.amount}`).join("\n");

    download(`home-${todayStr()}.csv`, csv);
  };

  const rentClr = $("#rent-clear");
  if(rentClr) rentClr.onclick = ()=>{
    if(confirm(t('confirmRentClear'))){
      state.rent = [];
      store.set("smart-khaata1", state);
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
    const selectedMonth = $("#rent-month-filter").value;
    const monthLabel = selectedMonth ? selectedMonth : "All";
    
    // Header with month info
    let csv = `Rent Income Report - ${monthLabel}\nGenerated: ${new Date().toLocaleString('hi-IN')}\n\n`;
    
    // Main data
    csv +=
      "तारीख,टेनेंट,महीना,किराया (₹),पिछली रीडिंग,वर्तमान रीडिंग,दर (₹/यूनिट),यूनिट,लाइट बिल (₹),कुल (₹),स्टेटस,नोट\n" +
      rows.map(r => {
        const prev = r.prevReading ?? "";
        const curr = r.currentReading ?? "";
        const rate = r.ratePerUnit ?? "";
        const units = r.units ?? "";
        const bill = r.lightBill ?? 0;
        const total = r.totalAmount ?? r.amount ?? 0;
        return `"${r.date}","${r.tenant}","${r.month}",${r.amount},"${prev}","${curr}","${rate}","${units}",${bill},${total},"${r.status}","${r.note}"`;
      }).join("\n");
    
    // Tenant-wise breakdown
    csv += "\n\nटेनेंट-वार सारांश\nTenant,Received,Pending,Partial,Total\n";
    const tenantMap = {};
    rows.forEach(r => {
      if(!tenantMap[r.tenant]) tenantMap[r.tenant] = {received: 0, pending: 0, partial: 0};
      const amount = r.totalAmount ?? r.amount ?? 0;
      if(r.status === "Received") tenantMap[r.tenant].received += amount;
      else if(r.status === "Pending") tenantMap[r.tenant].pending += amount;
      else if(r.status === "Partial") tenantMap[r.tenant].partial += amount;
    });
    
    Object.entries(tenantMap).forEach(([tenant, data]) => {
      const total = data.received + data.pending + data.partial;
      csv += `"${tenant}",${data.received},${data.pending},${data.partial},${total}\n`;
    });

    download(`rent-${monthLabel}-${todayStr()}.csv`, csv);
  };

  const rentForm = $("#form-rent");
  if(rentForm) {
    ["prevReading","currentReading","ratePerUnit","amount"].forEach(name => {
      const input = rentForm.elements[name];
      if(input) input.addEventListener("input", updateRentBillFields);
    });
    if(rentForm.elements.whatsapp){
      rentForm.elements.whatsapp.addEventListener('input', ()=> clearFieldError(rentForm.elements.whatsapp));
    }
    if(rentForm.elements.tenant){
      rentForm.elements.tenant.addEventListener('input', ()=> clearFieldError(rentForm.elements.tenant));
    }
    if(rentForm.elements.amount){
      rentForm.elements.amount.addEventListener('input', ()=> clearFieldError(rentForm.elements.amount));
    }
  }
  const languageSelect = $("#language-select");
  if(languageSelect){
    languageSelect.onchange = () => {
      state.settings.language = languageSelect.value;
      store.set("smart-khaata1", state);
      applyLanguage(languageSelect.value);
    };
  }

  const rentPhoto = $("#rent-meter-photo");
  if(rentPhoto) rentPhoto.onchange = e=>{
    const file = e.target.files[0];
    if(file) scanRentMeterPhoto(file);
  };

  const farmSrc = $("#farm-search");
  if(farmSrc) farmSrc.oninput = renderFarm;
  
  const farmTypeFlt = $("#farm-type-filter");
  if(farmTypeFlt) farmTypeFlt.onchange = renderFarm;

  const reportRefresh = $("#report-refresh");
  if(reportRefresh) reportRefresh.onclick = renderReports;

  const reportMonthFlt = $("#report-month-filter");
  if(reportMonthFlt) reportMonthFlt.onchange = renderReports;

  const fabAdd = $("#fab-add");
  if(fabAdd) fabAdd.onclick = ()=>{
    openTab('home');
    const dateInput = $("#form-home input[name='date']");
    if(dateInput){ dateInput.focus(); }
  };

  const darkModeToggle = $("#dark-mode-toggle");
  if(darkModeToggle) darkModeToggle.onchange = ()=>{
    state.settings.darkMode = darkModeToggle.checked;
    store.set("smart-khaata1", state);
    document.body.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
  };

  addPullToRefresh();
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
  const selectedMonth = $("#home-month-filter").value;
  const currentMonth = monthKey();
  const activeMonth = selectedMonth || currentMonth;
  const rows = filteredHome();
  const tbody = $("#home-table tbody");

  if(rows.length === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5" class="empty-cell">${t('homeNoRecords')}</td></tr>`;
  } else {
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td data-label="${t('homeDate')}">${escapeHtml(r.date)}</td>
        <td data-label="${t('homeCategory')}">${escapeHtml(r.category)}</td>
        <td data-label="${t('homeDescriptionCol')}">${escapeHtml(r.note||"")}</td>
        <td data-label="${t('homeAmount')}"><span class="pill neg">${fmt(r.amount)}</span></td>
        <td>
          <button class="btn secondary small" data-edit="${escapeHtml(r.id)}" style="margin-right:4px">✏️</button>
          <button class="btn secondary small" data-del="${escapeHtml(r.id)}">${t('buttonDelete')}</button>
        </td>
      </tr>
    `).join("");
  }

  tbody.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.onclick = ()=>{
      const row = state.home.find(x => x.id === btn.dataset.edit);
      if(!row) return;

      homeEditId = row.id;
      const f = $("#form-home");
      f.date.value = row.date;
      f.category.value = row.category;
      f.amount.value = row.amount;
      f.note.value = row.note;

      f.querySelector('button[type="submit"]').textContent = t('homeUpdateExpense');
      f.querySelector('input[name="date"]').focus();
      openTab("home");
    };
  });

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.home = state.home.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata1", state);
      renderHome();
    };
  });

  const monthRows = state.home.filter(x => monthKey(x.date) === activeMonth);
  const monthTotal = monthRows.reduce((a,b)=>a+b.amount,0);

  $("#home-month-total").textContent = fmt(monthTotal);

  const goal = Math.max(1, state.settings.goalExpense || 0);
  $("#home-month-bar").style.width = Math.min(100, (monthTotal/goal*100)) + "%";

  const byCat = {};
  monthRows.forEach(x=> byCat[x.category] = (byCat[x.category]||0) + x.amount);

  $("#home-top-cat").textContent =
    Object.entries(byCat).sort((a,b)=>b[1]-a[1])[0]?.[0] || "—";

  const avgDays = selectedMonth && selectedMonth !== currentMonth
    ? new Date(Number(activeMonth.slice(0,4)), Number(activeMonth.slice(5)), 0).getDate()
    : new Date().getDate();

  $("#home-daily-avg").textContent = fmt(monthTotal / Math.max(1, avgDays));

  const previousMonth = `${String(Number(activeMonth.slice(5)) - 1).padStart(2, '0')}`;
  let prevKey = activeMonth;
  if (selectedMonth) {
    const year = Number(activeMonth.slice(0,4));
    const month = Number(activeMonth.slice(5));
    const prevDate = new Date(year, month - 2, 1);
    prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  }
  const lastTotal = state.home.filter(x => monthKey(x.date) === prevKey).reduce((a,b)=>a+b.amount,0);
  const diff = monthTotal - lastTotal;
  const trendText = lastTotal > 0
    ? `${diff >= 0 ? '↑' : '↓'} ${fmt(Math.abs(diff))} vs last month`
    : 'ताज़ा डेटा';
  if($("#home-daily-trend")) $("#home-daily-trend").textContent = trendText;

  renderReports();
}

function sortHome(field) {
  if (homeSortField === field) {
    homeSortDir = -homeSortDir;
  } else {
    homeSortField = field;
    homeSortDir = field === 'date' ? -1 : 1; // date descending, others ascending
  }
  state.home.sort((a, b) => {
    let va, vb;
    if (field === 'date') {
      va = new Date(a.date);
      vb = new Date(b.date);
    } else if (field === 'amount') {
      va = a.amount;
      vb = b.amount;
    } else {
      va = a[field] || '';
      vb = b[field] || '';
    }
    if (va < vb) return -homeSortDir;
    if (va > vb) return homeSortDir;
    return 0;
  });
  renderHome();
}

// =========================================================
// ---------------------- RENT ----------------------------
// =========================================================

$("#form-rent").date.value = todayStr();

function computeRentBill({ prev=0, curr=0, rate=0 } = {}) {
  const units = Math.max(0, Number(curr || 0) - Number(prev || 0));
  const bill = Number((units * Number(rate || 0)).toFixed(2));
  return { units, bill };
}

function updateRentBillFields() {
  const f = $("#form-rent");
  if(!f) return;

  const { units, bill } = computeRentBill({
    prev: f.elements.prevReading.value,
    curr: f.elements.currentReading.value,
    rate: f.elements.ratePerUnit.value
  });

  f.elements.units.value = units ? units.toFixed(2) : "";
  f.elements.lightBill.value = bill ? bill.toFixed(2) : "";
  
  const rentAmount = Number(f.elements.amount.value||0);
  const totalAmount = rentAmount + bill;
  
  const totalField = $("#rent-form-total");
  if(totalField) {
    totalField.value = totalAmount > 0 ? fmt(totalAmount) : "";
  }
}

async function scanRentMeterPhoto(file) {
  const status = $("#rent-meter-status");
  if(!file || !status) return;

  status.textContent = t('scanStatusScanning');
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Enhance image: grayscale + contrast
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for(let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i+1], b = data[i+2];
        const gray = r * 0.3 + g * 0.59 + b * 0.11;
        
        // Increase contrast
        const enhanced = gray > 100 ? 255 : 0;
        data[i] = data[i+1] = data[i+2] = enhanced;
      }
      ctx.putImageData(imageData, 0, 0);
      
      const enhancedBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')));
      });
      const { data: ocrData } = await Tesseract.recognize(enhancedBlob, "eng");
      
      const text = ocrData.text || "";
      console.log("OCR Raw Text:", text);
      
      // Extract all numbers with their positions
      const regex = /\d+(?:\.\d+)?/g;
      let match;
      const allNumbers = [];
      while((match = regex.exec(text)) !== null) {
        allNumbers.push(match[0]);
      }
      
      console.log("All detected numbers:", allNumbers);
      
      // Filter for valid meter readings:
      // - Between 100 and 999999
      // - Not batch/series numbers (length 5+ usually meter readings)
      const validReadings = allNumbers.filter(n => {
        const num = Number(n);
        return num >= 100 && num <= 999999;
      });
      
      // Prefer 5-6 digit numbers (most common meter range)
      const preferred = validReadings.filter(n => n.length >= 5 && n.length <= 6);
      const candidates = preferred.length > 0 ? preferred : validReadings;
      
      if(candidates.length > 0) {
        // Take the first valid candidate (usually leftmost/main reading)
        const reading = candidates[0];
        const form = $("#form-rent");
        form.elements.currentReading.value = reading;
        updateRentBillFields();
        
        let msg = `✓ रीडिंग: ${reading}`;
        if(candidates.length > 1) {
          msg += ` [विकल्प: ${candidates.slice(1, 3).join(", ")}]`;
        }
        msg += ` - गलत हो तो मैन्युअली ठीक करें`;
        status.textContent = msg;
      } else {
        status.textContent = t('scanStatusNoReading');
      }
    };
    
    img.src = URL.createObjectURL(file);
  } catch(err) {
    status.textContent = t('scanStatusFailed');
    console.error("OCR Error:", err);
  }
}

$("#form-rent").addEventListener("submit", e=>{
  e.preventDefault();
  const f = e.target;

  clearFieldError(f.tenant);
  clearFieldError(f.amount);
  clearFieldError(f.whatsapp);

  let hasError = false;
  const tenant = f.tenant.value.trim();
  const rentAmount = Number(f.amount.value || 0);
  const whatsappRaw = f.whatsapp.value.trim();

  if(!tenant){
    setFieldError(f.tenant, t('rentTenantRequired'));
    hasError = true;
  }
  if(rentAmount <= 0){
    setFieldError(f.amount, t('rentAmountRequired'));
    hasError = true;
  }
  if(whatsappRaw && !validatePhoneNumber(whatsappRaw)){
    setFieldError(f.whatsapp, t('rentInvalidWhatsApp'));
    hasError = true;
  }
  if(hasError) return;

  const ym = f.date.value.slice(0,4) + "-" + {
    Jan:"01",Feb:"02",Mar:"03",Apr:"04",May:"05",Jun:"06",
    Jul:"07",Aug:"08",Sep:"09",Oct:"10",Nov:"11",Dec:"12"
  }[f.month.value];

  // Fix #5: Duplicate Prevention - Check if same tenant + month exists
  const existingEntry = state.rent.find(x => x.tenant === tenant && x.yearMonth === ym);
  if(existingEntry) {
    const proceed = confirm(t('confirmRentDuplicate', {
      tenant,
      month: f.month.value,
      year: f.date.value.slice(0,4)
    }));
    if(proceed) {
      state.rent = state.rent.filter(x => x.id !== existingEntry.id);
    }
  }

  const { units, bill } = computeRentBill({
    prev: f.prevReading.value,
    curr: f.currentReading.value,
    rate: f.ratePerUnit.value
  });

  state.rent.unshift({
    id: crypto.randomUUID(),
    date: f.date.value,
    tenant: tenant,
    month: f.month.value,
    yearMonth: ym,
    amount: Number(f.amount.value||0),
    status: f.status.value,
    note: f.note.value.trim(),
    whatsapp: f.whatsapp.value.trim(),
    prevReading: Number(f.prevReading.value||0),
    currentReading: Number(f.currentReading.value||0),
    ratePerUnit: Number(f.ratePerUnit.value||0),
    units,
    lightBill: bill,
    totalAmount: Number(f.amount.value||0) + bill
  });

  store.set("smart-khaata1", state);

  f.reset();
  f.date.value = todayStr();
  f.status.value = "Received";
  f.ratePerUnit.value = 8;
  updateRentBillFields();

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

  if(rows.length === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="10" class="empty-cell">${t('rentNoRecords')}</td></tr>`;
  } else {
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td data-label="${t('rentDate')}">${escapeHtml(r.date)}</td>
        <td data-label="${t('rentTenant')}">${escapeHtml(r.tenant)}</td>
        <td data-label="${t('rentMonth')}">${escapeHtml(r.month)}</td>
        <td data-label="${t('rentAmount')}"><span class="pill pos">${fmt(r.amount)}</span></td>
        <td data-label="${t('rentUnits')}">${typeof r.units !== 'undefined' ? Number(r.units).toFixed(2) : ""}</td>
        <td data-label="${t('rentLightBill')}"><span class="pill neg">${fmt(r.lightBill || 0)}</span></td>
        <td data-label="${t('rentTotal')}"><span class="pill pos">${fmt(r.totalAmount ?? r.amount)}</span></td>
        <td data-label="${t('rentStatus')}"><span class="pill ${r.status === 'Received' ? 'pos' : r.status === 'Pending' ? 'neg' : 'warn'}">${escapeHtml(r.status)}</span></td>
        <td data-label="${t('labelWhatsapp')}">${validatePhoneNumber(r.whatsapp) ? `<button class="btn secondary small" data-send-wa="${escapeHtml(r.id)}">${t('whatsappSendButton')}</button>` : (r.whatsapp ? t('invalidPhone') : '—')}</td>
        <td><button class="btn secondary small" data-del="${escapeHtml(r.id)}">${t('buttonDelete')}</button></td>
      </tr>
    `).join("");
  }

  tbody.querySelectorAll("[data-send-wa]").forEach(btn=>{
    btn.onclick = ()=>{
      const rent = state.rent.find(x => x.id === btn.dataset.sendWa);
      if(rent && rent.whatsapp) sendWhatsAppMessage(rent);
    };
  });

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.rent = state.rent.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata1", state);
      renderRent();
    };
  });

  // Get selected month filter
  const selectedMonth = $("#rent-month-filter").value;

  // Calculate totals for SELECTED MONTH ONLY
  const monthData = selectedMonth 
    ? state.rent.filter(x => x.yearMonth === selectedMonth)
    : state.rent;

  // Fix #1: Correct Pending Calculation (only "Pending" status)
  const total = monthData
    .filter(x => x.status === "Received")
    .reduce((a, b) => a + (b.amount ?? 0), 0);

  const received = monthData
    .filter(x => x.status === "Received")
    .reduce((a, b) => a + (b.totalAmount ?? b.amount ?? 0), 0);

  const pending = monthData
    .filter(x => x.status === "Pending")
    .reduce((a, b) => a + (b.totalAmount ?? b.amount ?? 0), 0);

  const partial = monthData
    .filter(x => x.status === "Partial")
    .reduce((a, b) => a + (b.totalAmount ?? b.amount ?? 0), 0);

  const electricTotal = monthData
    .reduce((a, b) => a + (b.lightBill ?? 0), 0);

  const combinedTotal = monthData
    .reduce((a, b) => a + (b.totalAmount ?? b.amount ?? 0), 0);

  // Count unique tenants in selected month
  const tenantCount = new Set(monthData.map(x => x.tenant)).size;

  // Update KPI boxes
  $("#rent-month-total").textContent = fmt(total);
  $("#rent-electric-total").textContent = fmt(electricTotal);
  $("#rent-combined-total").textContent = fmt(combinedTotal);
  $("#rent-received").textContent = fmt(received);
  $("#rent-pending").textContent = fmt(pending);
  $("#rent-partial").textContent = fmt(partial);
  $("#rent-tenants").textContent = tenantCount;
  
  renderReports();
}

// ========== WhatsApp Integration ==========
function sendWhatsAppMessage(rent) {
  let message = t('whatsappGreeting', { tenant: rent.tenant });
  message += t('whatsappMonthLabel', { month: rent.month, year: rent.yearMonth.split('-')[0] });

  if(rent.status === "Pending") {
    message += t('whatsappPendingHeader');
  } else if(rent.status === "Partial") {
    message += t('whatsappPartialHeader');
  } else {
    message += t('whatsappReceivedHeader');
  }

  message += t('whatsappRentAmountLabel', { amount: fmt(rent.amount) });
  if(rent.lightBill && rent.lightBill > 0) {
    message += t('whatsappLightBillLabel', { bill: fmt(rent.lightBill) });
  }
  message += t('whatsappTotalLabel', { total: fmt(rent.totalAmount || rent.amount) });

  if(rent.status === "Pending") {
    message += `\n${t('whatsappPendingFooter')}`;
  } else if(rent.status === "Partial") {
    message += `\n${t('whatsappPartialFooter')}`;
  } else {
    message += `\n${t('whatsappReceivedFooter')}`;
  }

  // Encode message for URL
  const encodedMsg = encodeURIComponent(message);
  const phone = rent.whatsapp.replace(/[^0-9]/g, '');
  const whatsappUrl = `https://wa.me/91${phone}?text=${encodedMsg}`;
  
  // Open WhatsApp Web
  window.open(whatsappUrl, '_blank');
  
  console.log("📱 WhatsApp link generated for:", rent.tenant, phone);
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
    f.querySelector('button[type="submit"]').textContent = t('farmAddRecord');
  } else {
    state.farm.unshift(farmData);
  }

  store.set("smart-khaata1", state);
  f.reset();
  f.date.value = todayStr();
  toggleFarmFields(f.type.value);
  renderFarm();
  seedMonthSelects();
});


const farmExportBtn = $("#farm-export");
if(farmExportBtn) {
  farmExportBtn.onclick = ()=>{
    const rows = filteredFarm();
    const csv = "Date,Type,Crop,Quantity,Unit,Price,Amount,Note\n" +
      rows.map(r=>{
        if(r.type==="Expense") {
          return `"${r.date}","${r.type}","${r.crop}","","","","${r.amount}","${r.note}"`;
        } else if(r.type==="Yield") {
          return `"${r.date}","${r.type}","${r.crop}","${r.quantity}","${r.unit}","","","${r.note}"`;
        } else if(r.type==="Sale") {
          const amount = r.quantity * r.price;
          return `"${r.date}","${r.type}","${r.crop}","${r.quantity}","${r.unit}","${r.price}","${amount}","${r.note}"`;
        }
      }).filter(Boolean).join("\n");

    download(`farm-${todayStr()}.csv`, csv);
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

  if(rows.length === 0){
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6" class="empty-cell">${t('farmNoRecords')}</td></tr>`;
  } else {
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td data-label="${t('farmDate')}">${escapeHtml(r.date)}</td>
        <td data-label="${t('farmType')}">${escapeHtml(r.type)}</td>
        <td data-label="${t('farmCrop')}">${escapeHtml(r.crop)}</td>
        <td data-label="${t('farmNote')}"><span class="pill ${r.type==='Expense'?'neg':'pos'}">${escapeHtml(getDisplayValue(r))}</span></td>
        <td data-label="${t('farmNote')}">${escapeHtml(r.note||"")}</td>
        <td>
          <button class="btn secondary small" data-edit="${escapeHtml(r.id)}" style="margin-right:4px">✏️</button>
          <button class="btn secondary small" data-del="${escapeHtml(r.id)}">${t('buttonDelete')}</button>
        </td>
      </tr>
    `).join("");
  }

  tbody.querySelectorAll("[data-edit]").forEach(btn=>{
    btn.onclick = ()=>{
      const row = state.farm.find(x=>x.id === btn.dataset.edit);
      if(!row) return;
      
      farmEditId = row.id;
      const f = $("#form-farm");
      f.date.value = row.date;
      f.type.value = row.type;
      toggleFarmFields(row.type);
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
      
      f.querySelector('button[type="submit"]').textContent = t('farmUpdateRecord');
      f.querySelector('input[name="date"]').focus();
      openTab("farm");
    };
  });

  tbody.querySelectorAll("[data-del]").forEach(btn=>{
    btn.onclick = ()=>{
      state.farm = state.farm.filter(x=>x.id !== btn.dataset.del);
      store.set("smart-khaata1", state);
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
  const farmExpenseBar = $("#farm-expense-bar");
  const farmSalesBar = $("#farm-sales-bar");
  if (farmExpenseBar) farmExpenseBar.style.width = (expense/goal*100)+"%";
  if (farmSalesBar) farmSalesBar.style.width   = (sales/goal*100)+"%";
  
  // Update chart
  const maxVal = Math.max(expense, sales, 1);
  const expBar = $("#exp-bar");
  const saleBar = $("#sale-bar");
  if (expBar) expBar.style.height = (expense/maxVal*100)+"%";
  if (saleBar) saleBar.style.height = (sales/maxVal*100)+"%";
  renderReports();
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
  const selectedMonth = $("#report-month-filter")?.value;
  const filteredHome = selectedMonth ? state.home.filter(x=>monthKey(x.date)===selectedMonth) : state.home;
  const filteredRent = selectedMonth ? state.rent.filter(x=>x.yearMonth===selectedMonth) : state.rent;
  const filteredFarm = selectedMonth ? state.farm.filter(x=>monthKey(x.date)===selectedMonth) : state.farm;

  const homeTotal = filteredHome.reduce((a,b)=>a+b.amount,0);
  const rentTotal = filteredRent.reduce((a,b)=>a+(b.totalAmount ?? b.amount ?? 0),0);
  const farmSales = filteredFarm.filter(x=>x.type==="Sale").reduce((a,b)=>a+(b.quantity*b.price||0),0);
  const farmExpense = filteredFarm.filter(x=>x.type==="Expense").reduce((a,b)=>a+(b.amount||0),0);
  const farmProfit = farmSales - farmExpense;
  const netBalance = rentTotal + farmProfit - homeTotal;

  $("#r-home").textContent = fmt(homeTotal);
  $("#r-rent").textContent = fmt(rentTotal);
  $("#r-farm").textContent = fmt(farmProfit);
  $("#r-balance").textContent = fmt(netBalance);

  const lastUpdated = $("#report-last-updated");
  if(lastUpdated){
    lastUpdated.textContent = `Updated: ${new Date().toLocaleString(state.settings.language === 'hi' ? 'hi-IN' : 'en-US',{ dateStyle:'medium', timeStyle:'short' })}`;
  }

  const incomeTotal = Math.max(0, rentTotal + farmProfit);
  const farmPct = incomeTotal ? Math.round((farmProfit / incomeTotal) * 100) : 0;
  const rentPct = incomeTotal ? 100 - farmPct : 0;

  const monthKeys = Array.from({length:6},(_,i)=>{
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const homeByMonth = Object.fromEntries(monthKeys.map(m=>[m,0]));
  const rentByMonth = Object.fromEntries(monthKeys.map(m=>[m,0]));
  const farmByMonth = Object.fromEntries(monthKeys.map(m=>[m,0]));

  filteredHome.forEach(item => {
    const key = monthKey(item.date);
    if(homeByMonth[key] !== undefined){ homeByMonth[key] += item.amount; }
  });
  filteredRent.forEach(item => {
    const key = item.yearMonth;
    if(rentByMonth[key] !== undefined){ rentByMonth[key] += (item.totalAmount ?? item.amount ?? 0); }
  });
  filteredFarm.forEach(item => {
    const key = monthKey(item.date);
    if(farmByMonth[key] !== undefined){
      if(item.type === 'Expense') farmByMonth[key] -= (item.amount || 0);
      else if(item.type === 'Sale') farmByMonth[key] += ((item.quantity || 0) * (item.price || 0));
    }
  });

  const trendChart = $("#report-trend-chart");
  if(trendChart){
    const maxValue = Math.max(1, ...monthKeys.flatMap(k => [Math.abs(homeByMonth[k]||0), Math.abs(rentByMonth[k]||0), Math.abs(farmByMonth[k]||0)]));
    trendChart.innerHTML = monthKeys.map(key => {
      const monthLabel = monthNames[Number(key.slice(5))-1];
      const rentHeight = Math.round(Math.max(0, (rentByMonth[key]||0)) / maxValue * 100);
      const homeHeight = Math.round(Math.max(0, (homeByMonth[key]||0)) / maxValue * 100);
      const farmHeight = Math.round(Math.max(0, (farmByMonth[key]||0)) / maxValue * 100);
      return `
        <div class="month-column">
          <div class="month-bars">
            <span class="month-bar rent" style="height:${rentHeight}%" title="Rent ${fmt(rentByMonth[key]||0)}"></span>
            <span class="month-bar farm" style="height:${farmHeight}%" title="Farm ${fmt(farmByMonth[key]||0)}"></span>
            <span class="month-bar home" style="height:${homeHeight}%" title="Home ${fmt(homeByMonth[key]||0)}"></span>
          </div>
          <div class="month-label">${monthLabel}</div>
        </div>
      `;
    }).join('');
  }

  if($("#report-break-rent")) $("#report-break-rent").textContent = fmt(rentTotal);
  if($("#report-break-farm")) $("#report-break-farm").textContent = fmt(farmProfit);
  if($("#report-break-home")) $("#report-break-home").textContent = fmt(homeTotal);
  if($("#report-break-total")) $("#report-break-total").textContent = fmt(netBalance);

  const pieChart = $("#report-pie-chart");
  if(pieChart) pieChart.style.background = `conic-gradient(#7ef29a 0 ${farmPct}%, #3b82f6 ${farmPct}% 100%)`;
  if($("#report-pie-farm-label")) $("#report-pie-farm-label").textContent = `${farmPct}%`;
  if($("#report-pie-rent-label")) $("#report-pie-rent-label").textContent = `${rentPct}%`;

  if($("#report-tenants")) $("#report-tenants").textContent = new Set(filteredRent.map(x=>x.tenant)).size;
  if($("#report-crops")) $("#report-crops").textContent = new Set(filteredFarm.map(x=>x.crop)).size;
  if($("#report-expenses")) $("#report-expenses").textContent = filteredHome.length;
  if($("#report-transactions")) $("#report-transactions").textContent = filteredHome.length + filteredRent.length + filteredFarm.length;

  const topMonth = monthKeys.map(key => ({
    key,
    total: (rentByMonth[key] || 0) + (farmByMonth[key] || 0)
  })).sort((a,b)=>b.total-a.total)[0];
  const topCrop = Object.entries(filteredFarm.filter(x=>x.type==='Sale').reduce((acc,row)=>{
    acc[row.crop] = (acc[row.crop]||0) + ((row.quantity||0)*(row.price||0));
    return acc;
  }, {})).sort((a,b)=>b[1]-a[1])[0];

  if($("#report-insight-income")) $("#report-insight-income").textContent = `📈 Farm contributes ${farmPct}% of income`;
  if($("#report-insight-rent")) $("#report-insight-rent").textContent = `🏢 Rent contributes ${rentPct}%`;
  if($("#report-insight-month")) $("#report-insight-month").textContent = topMonth && topMonth.total > 0 ? `💰 Highest earning month: ${monthNames[Number(topMonth.key.slice(5))-1]} ${topMonth.key.slice(0,4)}` : '💰 Highest earning month: —';
  if($("#report-insight-crop")) $("#report-insight-crop").textContent = topCrop ? `🌾 ${topCrop[0]} generated ${fmt(topCrop[1])}` : '🌾 No sales yet';
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

  if(!confirm(t('confirmBackupImport'))){
    e.target.value = "";
    return;
  }

  try{
    const d = JSON.parse(await file.text());
    ["home","rent","farm","settings"].forEach(k=> state[k] = d[k] ?? state[k]);

    store.set("smart-khaata1", state);
    renderAll();
    alert(t('importSuccess'));
  }catch(e){
    alert(t('invalidJson'));
  }
};

// Settings moved to settings.js
// See settings.js for load/save/reset helpers

// =========================================================
// ---------------------- INIT -----------------------------
// =========================================================

function renderAll(){
  loadSettings();
  renderHome();
  renderRent();
  renderFarm();
  renderReports();
  seedMonthSelects();
  updateDrawerSummary();
}

setupEventListeners();
renderAll();
openTab("home");


