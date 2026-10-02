'use strict';

/* Glass Dash — web wallpaper for Wallpaper Engine.
   Everything in CONFIG can be overridden from the WE properties panel (see project.json). */

const CONFIG = {
  name: '',
  lang: 'en',
  jpName: '泉 こなた',
  bgPreset: 'meadow-haze',
  blur: 2,
  helper: 'http://127.0.0.1:47831',
  buttons: true,   // dock, terminal, media controls — everything that needs the helper
  corner: 'music', // what sits under the gallery: music | weather | both
  city: '',
};

const PARAMS = new URLSearchParams(location.search);
const DEMO = PARAMS.has('demo');

const DEFAULTS = {
  character: 'assets/character.png',
  gallery: ['assets/gallery/1.jpg', 'assets/gallery/2.jpg', 'assets/gallery/3.jpg'],
};

const I18N = {
  uk: {
    months: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
             'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
    weekdays: ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', 'Пʼятниця', 'Субота'],
    weekShort: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'],
    weekStart: 1,
    date: d => `${I18N.uk.weekdays[d.getDay()]}, ${pad(d.getDate())}.${pad(d.getMonth() + 1)}`,
    greet: ['Доброї ночі,', 'Доброго ранку,', 'Доброго дня,', 'Доброго вечора,'],
    idleTitle: 'Нічого не грає',
    idleSub: 'Увімкни щось у Spotify',
    wxNoCity: 'Впиши місто в налаштуваннях шпалери',
    wxNotFound: 'Не знайшов такого міста',
    wxOffline: 'Погода не відповідає',
    wxWind: 'вітер',
    wxWindUnit: 'м/с',
    helperOff: 'Кнопкам потрібен Glass Dash Helper',
    helperOld: 'Цій кнопці потрібен новіший Glass Dash Helper',
    hcTitle: 'Кнопкам потрібен помічник',
    hcWhy: 'Wallpaper Engine не дозволяє шпалерам запускати програми й керувати музикою. Це робить Glass Dash Helper — менше 30 КБ, без вікон, з відкритим кодом.',
    hcSteps: ['Відкрий цю адресу в браузері', 'Завантаж glass-dash-helper.zip і запусти install.cmd', 'Кнопки запрацюють одразу — перезапускати нічого не треба'],
    hcCopy: 'Скопіювати',
    hcCopied: 'Скопійовано',
    hcPaste: 'Тепер відкрий браузер і натисни Ctrl+V в адресному рядку.',
    hcCopyFailed: 'Не вийшло',
    hcType: 'Набери адресу вручну. У ній нуль, а не літера «О»: Yareli0i.',
    hcNote: 'Кнопки не потрібні? Вимкни «Кнопки» в налаштуваннях шпалери — годинник, погода й музика працюють і без помічника.',
    hcClose: 'Закрити',
    openFailed: 'Не вдалося відкрити — перевір glass-dash-helper.ini',
    documents: 'Документи',
    hide: 'Сховати дашборд',
    show: 'Показати дашборд',
  },
  en: {
    months: ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    weekStart: 0,
    date: d => `${I18N.en.weekdays[d.getDay()]} ${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
    greet: ['Good night,', 'Good morning,', 'Good afternoon,', 'Good evening,'],
    idleTitle: 'Nothing playing',
    idleSub: 'Start something in Spotify',
    wxNoCity: 'Set your city in the wallpaper settings',
    wxNotFound: 'No such city found',
    wxOffline: 'Weather is not answering',
    wxWind: 'wind',
    wxWindUnit: 'm/s',
    helperOff: 'The buttons need Glass Dash Helper',
    helperOld: 'This button needs a newer Glass Dash Helper',
    hcTitle: 'The buttons need a helper',
    hcWhy: 'Wallpaper Engine does not let wallpapers open programs or control music. Glass Dash Helper does that — under 30 KB, no window, open source.',
    hcSteps: ['Open this address in your browser', 'Download glass-dash-helper.zip and run install.cmd', 'The buttons work right away — nothing to restart'],
    hcCopy: 'Copy',
    hcCopied: 'Copied',
    hcPaste: 'Now open your browser and press Ctrl+V in the address bar.',
    hcCopyFailed: 'No luck',
    hcType: 'Type the address by hand. It has a zero, not the letter O: Yareli0i.',
    hcNote: 'No need for buttons? Turn “Buttons” off in the wallpaper settings — the clock, weather and music work without the helper.',
    hcClose: 'Close',
    openFailed: 'Could not open it — check glass-dash-helper.ini',
    documents: 'Documents',
    hide: 'Hide dashboard',
    show: 'Show dashboard',
  },
};

const ICONS = {
  discord: '<path fill="currentColor" d="M19.3 5.4A16.5 16.5 0 0 0 15.2 4l-.5 1.1a15 15 0 0 0-5.4 0L8.8 4a16.5 16.5 0 0 0-4.1 1.4C2.1 9.3 1.4 13.1 1.8 16.9a16.6 16.6 0 0 0 5 2.6l1.1-1.7c-.6-.2-1.2-.5-1.7-.8l.4-.3a11.9 11.9 0 0 0 10.8 0l.4.3c-.5.3-1.1.6-1.7.8l1.1 1.7a16.6 16.6 0 0 0 5-2.6c.5-4.4-.7-8.2-2.9-11.5Z"/><ellipse cx="8.9" cy="12.9" rx="1.7" ry="1.9" fill="#111"/><ellipse cx="15.1" cy="12.9" rx="1.7" ry="1.9" fill="#111"/>',
  vscode: '<path fill="currentColor" d="M17.4 2.3 21.6 4.4v15.2l-4.2 2.1L8 13.2 4.1 16.2 2.4 15.3V8.7l1.7-.9L8 10.8Z"/><path fill="#111" d="M17.4 7.4v9.2L11.6 12ZM4.2 10.2 6.4 12l-2.2 1.8Z"/>',
  telegram: '<path fill="currentColor" d="M20.6 4.1 3.4 10.8c-1 .4-1 1.5.1 1.8l4.3 1.3 1.7 5.2c.2.7 1.1.9 1.6.4l2.4-2.3 4.4 3.2c.7.5 1.6.1 1.8-.7L22.2 5.6c.2-1-.7-1.9-1.6-1.5Z"/><path d="m8 13.9 9-5.7-6.6 6.9-.3 3.4" fill="none" stroke="#111" stroke-width="1.3" stroke-linejoin="round"/>',
  youtube: '<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="currentColor"/><path d="M10 9.2v5.6l4.8-2.8z" fill="#111"/>',
  spotify: '<circle cx="12" cy="12" r="9.5" fill="currentColor"/><path d="M7 9.6c3.4-1 7.3-.7 10.2 1M7.6 12.6c2.8-.8 5.8-.5 8.2.8M8.3 15.4c2.1-.6 4.3-.4 6.1.6" fill="none" stroke="#111" stroke-width="1.7" stroke-linecap="round"/>',
  gamepad: '<path fill="currentColor" d="M7.2 7.5h9.6a4.7 4.7 0 0 1 4.6 5.8l-.9 3.9a2.4 2.4 0 0 1-4.2 1l-1.6-2.2H9.3l-1.6 2.2a2.4 2.4 0 0 1-4.2-1l-.9-3.9a4.7 4.7 0 0 1 4.6-5.8Z"/><path d="M7.5 10.5v3.5M5.75 12.25h3.5" stroke="#111" stroke-width="1.6" stroke-linecap="round"/><circle cx="16" cy="11" r="1.1" fill="#111"/><circle cx="17.8" cy="13.4" r="1.1" fill="#111"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  restore: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  play: 'M8 5.5v13l10.5-6.5z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
};

// Grouped top to bottom: chats, media, play & work. The id is what the helper receives;
// it maps ids to real commands itself (whitelist). `brand` tints the button on hover.
const RAIL = [
  { id: 'discord', label: 'Discord', icon: ICONS.discord, brand: '#5865F2' },
  { id: 'telegram', label: 'Telegram', icon: ICONS.telegram, brand: '#2AABEE' },
  'sep',
  { id: 'spotify', label: 'Spotify', icon: ICONS.spotify, brand: '#1DB954' },
  { id: 'youtube', label: 'YouTube', icon: ICONS.youtube, brand: '#FF0033' },
  'sep',
  { id: 'steam', label: 'Steam', icon: ICONS.gamepad, brand: '#1A9FFF' },
  { id: 'vscode', label: 'VS Code', icon: ICONS.vscode, brand: '#0078D4' },
];

const BACKGROUNDS = {
  meadow: 'assets/bg/meadow.jpg',
  'meadow-haze': 'assets/bg/meadow-haze.jpg',
};

const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2, '0');
const T = () => I18N[CONFIG.lang] || I18N.en;

// English is the standard; anything the page does not know falls back to it. Guessing from
// the system does not work here: inside Wallpaper Engine the browser always reports en-US.
const resolveLang = pref => (I18N[pref] ? pref : 'en');

/* ---------- media integration (must be registered immediately) ---------- */

const media = { title: '', artist: '', thumb: '', color: '', state: 0, pos: 0, dur: 0, stamp: 0 };

// Wallpaper Engine reports the playback state only when it changes, so a wallpaper that loads
// mid-song would think nothing plays. Movement between two timeline reports is the real signal.
let stateKnown = false;
let inferPlaying = false;
let lastReport = -1;

function isPlaying() {
  const mi = window.wallpaperMediaIntegration;
  const playingState = mi ? mi.PLAYBACK_PLAYING : 1;
  if (stateKnown && media.state !== playingState) return false;
  if (!stateKnown && !inferPlaying) return false;
  return performance.now() - media.stamp < 20000;
}

const position = () => media.pos + (isPlaying() ? (performance.now() - media.stamp) / 1000 : 0);

if (typeof window.wallpaperRegisterMediaPropertiesListener === 'function') {
  window.wallpaperRegisterMediaPropertiesListener(e => {
    media.title = e.title || '';
    media.artist = e.artist || e.albumArtist || e.subTitle || '';
    renderPlayer();
  });
  window.wallpaperRegisterMediaThumbnailListener(e => {
    const t = e.thumbnail || '';
    media.thumb = !t || t.startsWith('data:') ? t : 'data:image/png;base64,' + t;
    media.color = e.primaryColor || '';
    renderPlayer();
  });
  window.wallpaperRegisterMediaPlaybackListener(e => {
    media.pos = position();
    media.state = e.state;
    stateKnown = true;
    media.stamp = performance.now();
    renderPlayer();
  });
  window.wallpaperRegisterMediaTimelineListener(e => {
    const newTrack = e.duration !== media.dur;
    const current = position();
    if (lastReport >= 0 && !newTrack) inferPlaying = e.position > lastReport + 0.2;
    lastReport = e.position;
    const drift = e.position - current;
    media.pos = newTrack || Math.abs(drift) > 1.5 ? e.position : current + drift * 0.35;
    media.dur = e.duration;
    media.stamp = performance.now();
  });
}

/* ---------- Wallpaper Engine user properties ---------- */

const weColor = v => 'rgb(' + v.split(' ').map(c => Math.round(parseFloat(c) * 255)).join(',') + ')';
const weFile = v => (v ? 'file:///' + v.replace(/\\/g, '/') : '');

let customBackground = '';
let currentBackground = '';
let customAvatar = '';
let hasCharacter = false;

window.wallpaperPropertyListener = {
  applyUserProperties(p) {
    const root = document.documentElement.style;
    if (p.username) CONFIG.name = p.username.value.trim();
    if (p.avatar) {
      customAvatar = weFile(p.avatar.value);
      applyAvatar();
    }
    if (p.language) CONFIG.lang = resolveLang(p.language.value);
    if (p.jpname) CONFIG.jpName = p.jpname.value;
    if (p.accent) root.setProperty('--accent', weColor(p.accent.value));
    if (p.glassopacity) root.setProperty('--glass-alpha', p.glassopacity.value / 100);
    if (p.glassblur) CONFIG.blur = p.glassblur.value;
    if (p.charsize) root.setProperty('--char-h', p.charsize.value + 'px');
    if (p.charpos) root.setProperty('--char-top', p.charpos.value + 'px');
    if (p.bgpreset) CONFIG.bgPreset = p.bgpreset.value;
    if (p.background) customBackground = weFile(p.background.value);
    if (p.bgpreset || p.background) applyBackground();
    else if (p.glassblur) buildBlur(currentBackground);
    if (p.character) setCharacter(weFile(p.character.value));
    if (p.city) CONFIG.city = p.city.value;
    if (p.corner) CONFIG.corner = p.corner.value;
    if (p.buttons) {
      CONFIG.buttons = p.buttons.value;
      applyButtons();
    }
    if (p.corner || p.city || p.language) applyCorner();
    ['gallery1', 'gallery2', 'gallery3'].forEach((key, i) => {
      if (p[key]) setGallery(i, weFile(p[key].value));
    });
    renderAll();
  },
};

/* ---------- rendering ---------- */

let lastDay = '';
let lastGreet = -1;

function greetIndex(h) {
  if (h < 5 || h >= 23) return 0;
  if (h < 12) return 1;
  if (h < 18) return 2;
  return 3;
}

function tick() {
  const now = new Date();
  renderTime(now);
  setTimeout(tick, 1000 - now.getMilliseconds() + 5);
}

function renderTime(now) {
  $('hh').textContent = pad(now.getHours());
  $('mm').textContent = pad(now.getMinutes());

  const day = now.toDateString();
  if (day !== lastDay) {
    lastDay = day;
    $('date').textContent = T().date(now);
    renderCalendar(now);
  }
  const g = greetIndex(now.getHours());
  if (g !== lastGreet) {
    lastGreet = g;
    renderGreeting();
  }
}

function renderCalendar(now) {
  const t = T();
  const y = now.getFullYear();
  const m = now.getMonth();
  const offset = (new Date(y, m, 1).getDay() - t.weekStart + 7) % 7;
  const days = new Date(y, m + 1, 0).getDate();

  $('cal-month').textContent = t.months[m];
  let html = t.weekShort.map(w => `<div class="wd">${w}</div>`).join('');
  html += '<div></div>'.repeat(offset);
  for (let d = 1; d <= days; d++) {
    const dow = new Date(y, m, d).getDay();
    const cls = ['day'];
    if (d === now.getDate()) cls.push('today');
    if (dow === 0 || dow === 6) cls.push('weekend');
    html += `<div class="${cls.join(' ')}"><span>${d}</span></div>`;
  }
  $('cal-grid').innerHTML = html;
}

function renderGreeting() {
  const el = $('greeting');
  el.replaceChildren();
  const small = document.createElement('small');
  const strong = document.createElement('strong');
  const greet = T().greet[greetIndex(new Date().getHours())];
  if (CONFIG.name) {
    small.textContent = greet;
    strong.textContent = CONFIG.name + '!';
  } else {
    // No name given: the greeting itself takes both lines — "Good" / "afternoon!".
    const words = greet.replace(/,$/, '').split(' ');
    strong.textContent = words.pop() + '!';
    small.textContent = words.join(' ');
  }
  el.append(small, strong);
}

function renderProfile() {
  // The chip opens the Documents folder; without a name it simply says so. With the buttons
  // off it opens nothing, so a chip with no name has nothing left to say and goes away.
  $('profile').hidden = !CONFIG.name && !CONFIG.buttons;
  $('profile-name').textContent = CONFIG.name || T().documents;
  $('profile').setAttribute('aria-label', T().documents);
  if (CONFIG.name) $('avatar').textContent = CONFIG.name.charAt(0).toUpperCase();
  else $('avatar').innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="9" r="3.6"/><path d="M5 19.5c1.2-3.4 4-5 7-5s5.800 1.600 7 5"/></svg>';
  // The vertical caption names the character, so it only shows when there is one.
  const jp = $('jp-name');
  jp.textContent = CONFIG.jpName;
  jp.hidden = !CONFIG.jpName.trim() || !(hasCharacter || DEMO);
}

function renderPlayer() {
  const t = T();
  const has = Boolean(media.title);
  $('player').classList.toggle('idle', !has);
  $('track-title').textContent = has ? media.title : t.idleTitle;
  $('track-artist').textContent = has ? media.artist : t.idleSub;

  const cover = $('cover');
  const img = cover.querySelector('img');
  if (has && media.thumb) {
    if (img) img.src = media.thumb;
    else cover.innerHTML = `<img src="${media.thumb}" alt="">`;
  } else if (img) {
    cover.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.2"/></svg>';
  }

  if (media.color && CSS.supports('color', media.color)) {
    document.documentElement.style.setProperty('--accent', media.color);
  }
  // with nothing playing the button always offers play, whatever state the last event left behind
  $('play-icon').setAttribute('d', has && isPlaying() ? ICONS.pause : ICONS.play);
  renderProgress();
}

const mmss = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

function renderProgress() {
  if (!media.dur) {
    $('track-time').textContent = '';
    return;
  }
  const pos = Math.min(media.dur, position());
  $('progress-fill').style.width = (pos / media.dur) * 100 + '%';
  $('track-time').textContent = `${mmss(pos)} / ${mmss(media.dur)}`;
}

function renderRail() {
  $('rail').innerHTML = RAIL.map(item => item === 'sep'
    ? '<span class="rail-sep"></span>'
    : `<button class="rail-btn" data-action="${item.id}" aria-label="${item.label}" title="${item.label}" style="--brand:${item.brand}">
         <svg viewBox="0 0 24 24">${item.icon}</svg>
       </button>`).join('');
}

function renderAll() {
  lastDay = '';
  lastGreet = -1;
  document.documentElement.lang = CONFIG.lang;
  renderProfile();
  renderPlayer();
  renderWeather();
  renderTime(new Date());
  $('hide-btn').setAttribute('aria-label', document.body.classList.contains('ui-hidden') ? T().show : T().hide);
}

/* ---------- media sources ---------- */

function applyBackground() {
  currentBackground = customBackground || BACKGROUNDS[CONFIG.bgPreset] || BACKGROUNDS.meadow;
  setBackground(currentBackground);
  buildBlur(currentBackground);
}

function setBackground(src) {
  const holder = $('bg');
  if (holder.firstElementChild && holder.firstElementChild.getAttribute('src') === src) return;
  const isVideo = /\.(webm|ogv|ogg)$/i.test(src);
  holder.innerHTML = isVideo
    ? '<video autoplay loop muted playsinline></video>'
    : '<img alt="">';
  holder.firstElementChild.setAttribute('src', src);
}

// Without a character the centre stays clean glass; the dashed silhouette is only for ?demo previews.
function setCharacter(src) {
  const img = $('char-img');
  const placeholder = $('char-placeholder');
  const done = ok => {
    hasCharacter = ok;
    img.hidden = !ok;
    placeholder.style.display = !ok && DEMO ? 'block' : 'none';
    renderProfile();
  };
  img.onload = () => done(true);
  img.onerror = () => done(false);
  img.src = src || DEFAULTS.character;
}

function setGallery(i, src) {
  const img = document.querySelectorAll('#gallery .shot')[i];
  if (img) img.src = src || DEFAULTS.gallery[i];
}

// Avatar: the picked file, else the Windows account picture served by the helper, else the initial.
let avatarRetry = 0;
let avatarTries = 0;

function applyAvatar() {
  clearTimeout(avatarRetry);
  const el = $('avatar');
  // ?demo renders are used for public screenshots, so they never pull the owner's account picture.
  const src = customAvatar || (DEMO ? '' : `${CONFIG.helper}/avatar`);
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url("${src}")`;
    el.classList.add('photo');
    avatarTries = 0;
  };
  img.onerror = () => {
    el.style.backgroundImage = '';
    el.classList.remove('photo');
    // Windows holds startup programs back for about a minute after login, so the helper is
    // usually just late: ask again soon at first, then rarely.
    if (!customAvatar) {
      avatarTries++;
      avatarRetry = setTimeout(applyAvatar, Math.min(60, 4 * avatarTries) * 1000);
    }
  };
  img.src = src;
}

/* ---------- weather (Open-Meteo: no key, no account) ----------
   The city is geocoded once, then the forecast is refreshed every quarter of an hour. */

const WX_TEXT = {
  0: ['Ясно', 'Clear'], 1: ['Переважно ясно', 'Mostly clear'], 2: ['Мінлива хмарність', 'Partly cloudy'], 3: ['Хмарно', 'Overcast'],
  45: ['Туман', 'Fog'], 48: ['Паморозь', 'Rime fog'],
  51: ['Мряка', 'Light drizzle'], 53: ['Мряка', 'Drizzle'], 55: ['Сильна мряка', 'Heavy drizzle'],
  56: ['Крижана мряка', 'Freezing drizzle'], 57: ['Крижана мряка', 'Freezing drizzle'],
  61: ['Невеликий дощ', 'Light rain'], 63: ['Дощ', 'Rain'], 65: ['Сильний дощ', 'Heavy rain'],
  66: ['Крижаний дощ', 'Freezing rain'], 67: ['Крижаний дощ', 'Freezing rain'],
  71: ['Невеликий сніг', 'Light snow'], 73: ['Сніг', 'Snow'], 75: ['Сильний сніг', 'Heavy snow'], 77: ['Сніжні зерна', 'Snow grains'],
  80: ['Злива', 'Showers'], 81: ['Злива', 'Showers'], 82: ['Сильна злива', 'Heavy showers'],
  85: ['Снігова злива', 'Snow showers'], 86: ['Снігова злива', 'Snow showers'],
  95: ['Гроза', 'Thunderstorm'], 96: ['Гроза з градом', 'Thunderstorm with hail'], 99: ['Гроза з градом', 'Thunderstorm with hail'],
};

const SUN = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#f5a01c"/>`
  + '<g stroke="#f5a01c" stroke-width="3" stroke-linecap="round">'
  + `<path d="M${cx} ${cy - r - 7.5}v4.5M${cx} ${cy + r + 3}v4.5M${cx - r - 7.5} ${cy}h4.5M${cx + r + 3} ${cy}h4.5`
  + `M${cx - r - 5.5} ${cy - r - 5.5}l3.2 3.2M${cx + r + 2.3} ${cy + r + 2.3}l3.2 3.2`
  + `M${cx + r + 5.5} ${cy - r - 5.5}l-3.2 3.2M${cx - r - 2.3} ${cy + r + 2.3}l-3.2 3.2"/></g>`;
const MOON = '<path fill="#ecdfb2" d="M34.8 30.6A13.4 13.4 0 0 1 20 13.8a13.9 13.9 0 1 0 14.8 16.8Z"/>';
const CLOUD = (y = 0) => `<path fill="#7d8fa7" transform="translate(0 ${y})" d="M16 37.5h19a8 8 0 0 0 1.2-15.9A12.5 12.5 0 0 0 12.8 20.5 8 8 0 0 0 16 37.5Z"/>`;
const DROPS = n => '<g stroke="#4f8fd6" stroke-width="3.2" stroke-linecap="round">'
  + [18, 25.5, 33].slice(0, n).map(x => `<path d="M${x} 40.5l-1.6 4.5"/>`).join('') + '</g>';
const FLAKES = '<g fill="#9cc6ee"><circle cx="18" cy="43.5" r="2.3"/><circle cx="25.5" cy="43.5" r="2.3"/><circle cx="33" cy="43.5" r="2.3"/></g>';
const BOLT = '<path fill="#f4b63a" d="M26.5 37.5l-8.5 10.8h5.6l-1.8 7.2 9.2-12h-5.6z"/>';

function wxIcon(code, isDay) {
  const c = Number(code);
  let inner;
  if (c <= 1) inner = isDay ? SUN(24, 24, 9.5) : MOON;
  else if (c === 2) inner = (isDay ? SUN(17, 16, 7) : MOON) + CLOUD(2);
  else if (c === 3) inner = CLOUD(1);
  else if (c === 45 || c === 48) inner = CLOUD(-2) + '<g stroke="#9aa8bb" stroke-width="3.2" stroke-linecap="round"><path d="M12 41h24M17 47h14"/></g>';
  else if (c <= 57) inner = CLOUD(-2) + DROPS(2);
  else if (c <= 67 || (c >= 80 && c <= 82)) inner = CLOUD(-2) + DROPS(3);
  else if (c <= 77 || c === 85 || c === 86) inner = CLOUD(-2) + FLAKES;
  else inner = CLOUD(-4) + BOLT;
  return `<svg viewBox="0 0 48 56" aria-hidden="true">${inner}</svg>`;
}

const WEATHER = { key: '', lat: 0, lon: 0, place: '', temp: null, code: 0, day: 1, wind: 0, hours: [], error: '' };
let wxTimer = 0;
let wxFails = 0;

const cornerMode = () => (['music', 'weather', 'both'].includes(CONFIG.corner) ? CONFIG.corner : 'music');

function applyCorner() {
  const mode = cornerMode();
  document.body.classList.toggle('corner-both', mode === 'both');
  $('player').hidden = mode === 'weather';
  $('weather').hidden = mode === 'music';
  if (mode === 'music') clearTimeout(wxTimer);
  else loadWeather();
}

async function getJSON(url) {
  const stop = new AbortController();
  const timer = setTimeout(() => stop.abort(), 9000);
  try {
    const res = await fetch(url, { signal: stop.signal, cache: 'no-store' });
    if (!res.ok) throw new Error('http ' + res.status);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadWeather() {
  clearTimeout(wxTimer);
  if (cornerMode() === 'music' || (DEMO && !CONFIG.city.trim())) return;
  const city = CONFIG.city.trim();
  if (!city) {
    WEATHER.error = 'nocity';
    renderWeather();
    return;
  }
  try {
    const key = city + '|' + CONFIG.lang;
    if (WEATHER.key !== key) {
      const geo = await getJSON('https://geocoding-api.open-meteo.com/v1/search?count=1&format=json'
        + `&language=${CONFIG.lang}&name=${encodeURIComponent(city)}`);
      const hit = geo.results && geo.results[0];
      if (!hit) throw new Error('notfound');
      Object.assign(WEATHER, { key, lat: hit.latitude, lon: hit.longitude, place: hit.name });
    }
    const f = await getJSON(`https://api.open-meteo.com/v1/forecast?latitude=${WEATHER.lat}&longitude=${WEATHER.lon}`
      + '&current=temperature_2m,weather_code,wind_speed_10m,is_day&hourly=temperature_2m,weather_code,is_day'
      + '&wind_speed_unit=ms&forecast_days=2&timezone=auto');
    const now = f.current || {};
    WEATHER.temp = Math.round(now.temperature_2m);
    WEATHER.code = now.weather_code;
    WEATHER.day = now.is_day;
    WEATHER.wind = Math.round(now.wind_speed_10m);
    WEATHER.hours = nextHours(f.hourly, now.time);
    WEATHER.error = '';
    wxFails = 0;
    wxTimer = setTimeout(loadWeather, 15 * 60 * 1000);
  } catch (e) {
    WEATHER.error = e && e.message === 'notfound' ? 'notfound' : 'offline';
    wxFails++;
    // a dropped connection or a PC waking up: come back soon at first, then back off
    wxTimer = setTimeout(loadWeather, Math.min(15, 2 * wxFails) * 60 * 1000);
  }
  renderWeather();
}

function nextHours(hourly, currentTime) {
  if (!hourly || !hourly.time) return [];
  const start = hourly.time.findIndex(t => t > currentTime);
  if (start < 0) return [];
  const out = [];
  for (let i = start; i < hourly.time.length && out.length < 4; i += 2) {
    out.push({
      hour: hourly.time[i].slice(11, 13),
      temp: Math.round(hourly.temperature_2m[i]),
      code: hourly.weather_code[i],
      day: hourly.is_day ? hourly.is_day[i] : 1,
    });
  }
  return out;
}

function renderWeather() {
  if (cornerMode() === 'music') return;
  const t = T();
  const problem = WEATHER.error && WEATHER.temp === null;
  $('weather').classList.toggle('plain', Boolean(problem));
  if (problem) {
    $('wx-icon').innerHTML = wxIcon(3, 1);
    $('wx-place').textContent = t[{ nocity: 'wxNoCity', notfound: 'wxNotFound', offline: 'wxOffline' }[WEATHER.error]];
    $('wx-desc').textContent = '';
    $('wx-hours').innerHTML = '';
    return;
  }
  const text = code => (WX_TEXT[code] || WX_TEXT[3])[CONFIG.lang === 'en' ? 1 : 0];
  $('wx-icon').innerHTML = wxIcon(WEATHER.code, WEATHER.day);
  $('wx-temp').textContent = (WEATHER.temp > 0 ? '+' : '') + WEATHER.temp + '°';
  $('wx-place').textContent = WEATHER.place;
  $('wx-desc').textContent = `${text(WEATHER.code)}, ${t.wxWind} ${WEATHER.wind} ${t.wxWindUnit}`;
  $('wx-hours').innerHTML = WEATHER.hours.map(h =>
    `<div class="wx-h"><span>${h.hour}:00</span>${wxIcon(h.code, h.day)}<b>${h.temp > 0 ? '+' : ''}${h.temp}°</b></div>`).join('');
}

/* ---------- frosted glass ----------
   Wallpaper Engine's browser ignores backdrop-filter, so the frost is faked: the background is
   blurred once into a canvas, and that canvas is shown only inside the glass shapes via a mask. */

let blurJob = 0;

async function buildBlur(src) {
  const job = ++blurJob;
  const layer = $('glass-blur');
  const isVideo = /\.(webm|ogv|ogg)$/i.test(src);
  document.body.classList.toggle('no-blur', isVideo);
  if (isVideo) {
    layer.replaceChildren();
    return;
  }
  const img = await new Promise(resolve => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
  if (!img || job !== blurJob) return;

  const scale = 0.5; // a blurred picture loses nothing at half resolution
  const W = Math.round(innerWidth * scale);
  const H = Math.round(innerHeight * scale);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const w = img.naturalWidth * s;
  const h = img.naturalHeight * s;
  const x = (W - w) / 2;
  const y = (H - h) / 2;
  const r = CONFIG.blur * scale;
  if ('filter' in ctx) ctx.filter = `blur(${r}px) saturate(160%)`;
  else canvas.style.filter = `blur(${CONFIG.blur}px)`;
  // Slightly oversized underlay so the blur does not pull transparent edges into the picture.
  ctx.drawImage(img, x - r * 3, y - r * 3, w + r * 6, h + r * 6);
  ctx.drawImage(img, x, y, w, h);

  layer.replaceChildren(canvas);
  placeBlur();
}

// The canvas covers the viewport exactly like #bg does; express that in stage coordinates.
function placeBlur() {
  const canvas = $('glass-blur').firstElementChild;
  if (!canvas) return;
  const vw = innerWidth / stageScale;
  const vh = innerHeight / stageScale;
  Object.assign(canvas.style, {
    left: (1920 - vw) / 2 + 'px',
    top: (1080 - vh) / 2 + 'px',
    width: vw + 'px',
    height: vh + 'px',
  });
}

function roundRect(x, y, w, h, r) {
  return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}`
    + `h${2 * r - w}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - h}a${r} ${r} 0 0 1 ${r} ${-r}z`;
}

// The frosted canvas is visible only inside the panel and the rail.
function updateGlassMask() {
  const panel = $('panel');
  const rail = $('rail');
  const radius = el => parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;

  let d = roundRect(panel.offsetLeft, panel.offsetTop, panel.offsetWidth, panel.offsetHeight, radius(panel));
  // The rail is centred with translateY(-50%), which offsetTop does not include.
  // With the buttons switched off there is no rail, so no frosted patch behind it either.
  if (CONFIG.buttons) {
    d += roundRect(rail.offsetLeft, rail.offsetTop - rail.offsetHeight / 2, rail.offsetWidth, rail.offsetHeight,
      Math.min(radius(rail), rail.offsetWidth / 2));
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><path d="${d}"/></svg>`;
  const url = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
  const layer = $('glass-blur');
  layer.style.maskImage = url;
  layer.style.webkitMaskImage = url;
}

function applyButtons() {
  document.body.classList.toggle('no-buttons', !CONFIG.buttons);
  if (!CONFIG.buttons) hideHelperCard();
  renderProfile();
  updateGlassMask();
}

/* ---------- helper (glass-dash-helper.exe: launches apps & sends media keys) ---------- */

async function run(action) {
  let res;
  try {
    res = await fetch(`${CONFIG.helper}/do/${action}`, { method: 'POST' });
  } catch {
    helperMissing();
    return;
  }
  hideHelperCard();
  // 429 means the helper is just throttling a burst of clicks — nothing to report.
  // 404: the helper is there but has never heard of this button — it is an older one.
  if (res.status === 404) toast(T().helperOld);
  else if (!res.ok && res.status !== 429) toast(T().openFailed);
}

/* ---------- "the buttons need a helper" ----------
   A wallpaper cannot open a link, so the most it can do is say where to go and put the
   address on the clipboard when asked. Someone who closes the card twice has made up their
   mind; after that a press only gets the short toast. */
const HELPER_URL = 'https://github.com/Yareli0i/glass-dash/releases/latest';
let cardClosed = 0;
let cardTimer = 0;

function helperMissing() {
  if (cardClosed >= 2) {
    toast(T().helperOff);
    return;
  }
  const t = T();
  $('hc-title').textContent = t.hcTitle;
  $('hc-why').textContent = t.hcWhy;
  $('hc-steps').innerHTML = t.hcSteps.map(step => `<li><span>${step}</span></li>`).join('');
  $('hc-url').textContent = HELPER_URL.replace('https://', '');
  $('hc-note').textContent = t.hcNote;
  $('hc-close').setAttribute('aria-label', t.hcClose);
  const copy = $('hc-copy');
  copy.textContent = t.hcCopy;
  copy.className = '';
  $('helper-card').hidden = false;
  clearTimeout(cardTimer);
  cardTimer = setTimeout(hideHelperCard, 45000);
}

function hideHelperCard() {
  clearTimeout(cardTimer);
  $('helper-card').hidden = true;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch { /* not allowed here; try the old way */ }
  try {
    const box = document.createElement('textarea');
    box.value = text;
    box.style.cssText = 'position:fixed;opacity:0';
    document.body.append(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  } catch {
    return false;
  }
}

let toastTimer = 0;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// Inside Wallpaper Engine one physical click can arrive twice (and people double-click on the
// desktop out of habit). A second play/pause would undo the first, so repeats of the same
// button within a short window are dropped.
const lastRun = {};

document.addEventListener('click', e => {
  const btn = e.target.closest('[data-action]');
  if (!btn || e.detail > 1) return;
  const action = btn.dataset.action;
  const now = performance.now();
  if (now - (lastRun[action] || 0) < 450) return;
  lastRun[action] = now;
  // Wallpaper Engine reports the new playback state up to a second later; flip the icon now so
  // the click feels answered (the real state overwrites it when it arrives).
  if (action === 'media-play' && media.title) {
    const mi = window.wallpaperMediaIntegration || { PLAYBACK_PLAYING: 1, PLAYBACK_PAUSED: 2 };
    media.pos = position();
    media.state = isPlaying() ? mi.PLAYBACK_PAUSED : mi.PLAYBACK_PLAYING;
    stateKnown = true;
    media.stamp = now;
    renderPlayer();
  }
  run(action);
});

/* ---------- lit buttons ----------
   Wallpaper Engine forwards mouse movement to the page, but the browser's :hover state does
   not reliably follow it. The pointer position does arrive, so the lit button is worked out
   from that instead. */
const LIT = '.rail-btn, .icon-btn, #play-btn, #profile, #hc-copy, #hc-close';
let hot = null;
let hotTimer = 0;

function setHot(btn) {
  if (btn === hot) return;
  if (hot) hot.classList.remove('hot');
  hot = btn;
  if (hot) hot.classList.add('hot');
}

document.addEventListener('mousemove', e => {
  setHot(e.target instanceof Element ? e.target.closest(LIT) : null);
  // Nothing says "the mouse left" when the pointer slides onto a window, and a button would
  // stay lit for good. Let it go once the pointer has been silent for a while.
  clearTimeout(hotTimer);
  hotTimer = setTimeout(() => setHot(null), 6000);
});
document.addEventListener('mouseleave', () => setHot(null));

$('hc-copy').addEventListener('click', async () => {
  const ok = await copyText(HELPER_URL);
  const copy = $('hc-copy');
  copy.textContent = ok ? T().hcCopied : T().hcCopyFailed;
  copy.className = ok ? 'done' : 'failed';
  $('hc-note').textContent = ok ? T().hcPaste : T().hcType;
});
$('hc-close').addEventListener('click', () => {
  cardClosed++;
  hideHelperCard();
});

$('hide-btn').addEventListener('click', () => {
  const hidden = document.body.classList.toggle('ui-hidden');
  $('hide-btn').querySelector('svg').innerHTML = hidden ? ICONS.restore : ICONS.close;
  $('hide-btn').setAttribute('aria-label', hidden ? T().show : T().hide);
});

/* ---------- layout ---------- */

let stageScale = 1;
let resizeTimer = 0;

function fit() {
  stageScale = Math.min(innerWidth / 1920, innerHeight / 1080);
  document.documentElement.style.setProperty('--fit', stageScale);
  placeBlur();
}

addEventListener('resize', () => {
  fit();
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => buildBlur(currentBackground), 250);
});

/* ---------- demo mode for previewing outside Wallpaper Engine: index.html?demo ---------- */

function demo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7a8c4"/><stop offset=".55" stop-color="#f3d36b"/><stop offset="1" stop-color="#5a8de0"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="5" opacity=".85"/></svg>`;
  Object.assign(media, {
    title: 'Seishun Complex',
    artist: 'Kessoku Band',
    thumb: 'data:image/svg+xml;base64,' + btoa(svg),
    color: '#f08fb0',
    state: 1,
    pos: 71,
    dur: 203,
    stamp: performance.now(),
  });
  // a still forecast, so preview renders never depend on the network
  if (!CONFIG.city.trim()) {
    Object.assign(WEATHER, {
      place: CONFIG.lang === 'en' ? 'Kyiv' : 'Київ', temp: 20, code: 3, day: 1, wind: 3, error: '',
      hours: [{ hour: '21', temp: 18, code: 3 }, { hour: '23', temp: 16, code: 61 }, { hour: '01', temp: 15, code: 80 }, { hour: '03', temp: 14, code: 3 }],
    });
  }
}

/* ---------- boot ---------- */

fit();
renderRail();
updateGlassMask();
if (PARAMS.has('bg')) CONFIG.bgPreset = PARAMS.get('bg');
if (PARAMS.has('corner')) CONFIG.corner = PARAMS.get('corner');
if (PARAMS.has('city')) CONFIG.city = PARAMS.get('city');
if (PARAMS.has('lang')) CONFIG.lang = resolveLang(PARAMS.get('lang'));
if (PARAMS.has('name')) CONFIG.name = PARAMS.get('name');
if (PARAMS.has('buttons')) CONFIG.buttons = PARAMS.get('buttons') !== '0';
applyBackground();
applyAvatar();
setCharacter('');
if (DEMO) demo();
applyCorner();
renderAll();
applyButtons();
if (PARAMS.has('card')) helperMissing();   // preview of the helper card
tick();
setInterval(renderProgress, 1000);
