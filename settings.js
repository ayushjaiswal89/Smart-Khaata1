// Settings module: sync between DOM and `state.settings`
// Depends on global `state`, `settingsControls`, `defaultSettings`, `translatePage`, `t`, `store`, `$`, and `renderReports`.

function syncSettingsFromDom() {
  settingsControls.forEach(({ key, selector, type }) => {
    const el = $(selector);
    if(!el) return;
    if(type === 'number') {
      state.settings[key] = Number(el.value || 0);
    } else if(type === 'checked') {
      state.settings[key] = el.checked;
    } else {
      state.settings[key] = el.value || defaultSettings[key] || '';
    }
  });
  document.body.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
}

function syncSettingsToDom() {
  settingsControls.forEach(({ key, selector, type }) => {
    const el = $(selector);
    if(!el) return;
    const value = state.settings[key];
    if(type === 'number') {
      el.value = value || 0;
    } else if(type === 'checked') {
      el.checked = Boolean(value);
    } else {
      el.value = value ?? defaultSettings[key] ?? '';
    }
  });
  document.body.setAttribute('data-theme', state.settings.darkMode ? 'dark' : 'light');
  translatePage(state.settings.language || 'hi');
}

function loadSettings(){
  syncSettingsToDom();
}

$("#save-settings").onclick = ()=>{
  syncSettingsFromDom();
  store.set("smart-khaata1", state);
  translatePage(state.settings.language);

  $("#save-msg").textContent = t('savedMessage');
  setTimeout(()=> $("#save-msg").textContent="",1500);

  renderReports();
};

$("#reset-settings").onclick = ()=>{
  state.settings = { ...defaultSettings };
  store.set("smart-khaata1", state);
  syncSettingsToDom();
  $("#save-msg").textContent = state.settings.language === 'en' ? 'Reset' : 'रीसेट हुआ';
  setTimeout(()=> $("#save-msg").textContent="",1500);
};
