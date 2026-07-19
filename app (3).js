/* ============ STATE ============ */
const state = {
  page: 'overview',
  combined: false,      // mobile + wifi + tv under one plan
  aaLinked: false,      // financial services linked via Account Aggregator
  fifaAddon: false,
  iplAddon: false,
  autopay: true,
  migrationDismissed: false,
  migrationAccepted: false,
  consents: { usage: true, family: false, financial: false },
  scanning: false,
  scanComplete: false,
  bellOpened: false,
  segment: 'highvalue',  // 'highvalue' | 'massmarket': which messaging track is showing
};

const NAV = [
  { id: 'overview',      label: 'Overview',        icon: '🏠' },
  { id: 'combine',       label: 'Combine & Save',   icon: '🔗' },
  { id: 'entertainment', label: 'Entertainment',    icon: '🎬' },
  { id: 'perks',         label: 'Perks',            icon: '✨' },
  { id: 'household',     label: 'Household',        icon: '⚙️' },
];

const PAGE_META = {
  overview:      { title: 'Overview',        sub: 'Your household, at a glance' },
  combine:       { title: 'Combine & Save',  sub: 'Same price. One bill. Zero hassle.' },
  entertainment: { title: 'Entertainment',   sub: 'Everything you already have, in one place' },
  perks:         { title: 'Perks',           sub: 'Automatic. Nothing to unlock manually' },
  household:     { title: 'Household',       sub: 'Billing, privacy, and your lines' },
};

const OTT_PLATFORMS = [
  { name: 'ReelHub',      cat: 'Movies & Shows', have: true,  unused: true  },
  { name: 'PlayNest',     cat: 'Kids',            have: true,  unused: true  },
  { name: 'StageOne',     cat: 'Live Sport',      have: true,  unused: false },
  { name: 'Rhythm+',      cat: 'Music',           have: true,  unused: false },
  { name: 'DocuWave',     cat: 'Documentaries',   have: true,  unused: true  },
  { name: 'NewsPoint',    cat: 'News',            have: true,  unused: false },
  { name: 'Vernac Vault', cat: 'Regional cinema', have: true,  unused: true  },
  { name: 'ArenaLive',    cat: 'Sports',          have: false, unused: false },
  { name: 'ComicLoop',    cat: 'Animation',       have: true,  unused: true  },
  { name: 'ShortFrame',   cat: 'Short films',     have: true,  unused: false },
  { name: 'GlobalReel',   cat: 'International',   have: false, unused: false },
  { name: 'CampusTV',     cat: 'Learning',        have: true,  unused: true  },
];

/* ============ HELPERS ============ */
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2800);
}

function connectedCount(){
  return (state.combined ? 3 : 0) + (state.aaLinked ? 1 : 0);
}

function updateRing(){
  const count = connectedCount();
  const circumference = 169.6;
  const fill = document.getElementById('ring-fill');
  fill.style.strokeDashoffset = circumference * (1 - count / 4);
  document.getElementById('ring-label').textContent = `${count}/4`;
  const titleEl = document.getElementById('progress-title');
  titleEl.textContent =
    count === 0 ? 'Not yet connected' :
    count === 4 ? 'Fully connected household' :
    'Partially connected';
}

function updateNavBadges(){
  document.querySelectorAll('.nav-badge').forEach(b => b.remove());
  if (!state.combined){
    addBadge('combine', '1');
  }
  if (state.combined){
    addBadge('perks', 'New');
  }
}
function addBadge(navId, text){
  const btn = document.querySelector(`.nav-btn[data-id="${navId}"]`);
  if (!btn) return;
  const b = document.createElement('span');
  b.className = 'nav-badge';
  b.textContent = text;
  btn.appendChild(b);
}

/* ============ NAV RENDER ============ */
function renderNav(){
  const nav = document.getElementById('nav');
  nav.innerHTML = NAV.map(item => `
    <button class="nav-btn ${state.page === item.id ? 'active' : ''}" data-id="${item.id}">
      <span class="ic">${item.icon}</span>${item.label}
    </button>
  `).join('');
  nav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => goTo(btn.dataset.id));
  });
  updateNavBadges();
}

function goTo(pageId){
  state.page = pageId;
  document.getElementById('page-title').textContent = PAGE_META[pageId].title;
  document.getElementById('page-sub').textContent = PAGE_META[pageId].sub;
  renderNav();
  renderPage();
}

/* ============ PAGE: OVERVIEW ============ */
function renderOverview(){
  return `
    <div class="chip-row">
      <div class="chip"><div class="n">3</div><div class="l">Connections at this address</div></div>
      <div class="chip ${state.combined ? 'accent' : ''}"><div class="n">${state.combined ? '1 bill' : '3 bills'}</div><div class="l">${state.combined ? 'Combined billing' : 'Billed separately'}</div></div>
      <div class="chip"><div class="n">₹470</div><div class="l">Monthly, this household, same either way</div></div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <div class="card-label">Daily Household Card</div>
        <div class="usage-block">
          <div class="usage-row"><span class="name">Home Wi-Fi</span><span class="val">82% of 200GB</span></div>
          <div class="bar-track"><div class="bar-fill wifi" id="bar-wifi"></div></div>
        </div>
        <div class="usage-block">
          <div class="usage-row"><span class="name">Family mobile data pool</span><span class="val">47% used</span></div>
          <div class="bar-track"><div class="bar-fill mobile" id="bar-mobile"></div></div>
        </div>
        <div class="warn">⚠️ <span><b>Heads up:</b> Wi-Fi is at 82% with 9 days left in this cycle. Nothing changes automatically, top up anytime.</span></div>
        <div class="disclosure-line"><span class="di">ⓘ</span><span>Family data pool counts genuine multi-line usage only, never mobile-hotspot-shared data, per your plan's terms.</span></div>
      </div>

      <div class="card">
        <div class="card-label">Your connections</div>
        ${connRow('mobile','📶','Mobile','2 active lines','₹199')}
        ${connRow('wifi','📡','Home Wi-Fi','200GB / month','₹199')}
        ${connRow('tv','📺','TV & Entertainment','25+ platforms included','₹72')}
        ${connRow('fs','💳','Financial Services', state.aaLinked ? 'Linked via Account Aggregator' : 'Not linked yet','-', true)}
      </div>
    </div>

    <div class="section-title">Tonight</div>
    ${eventCard('overview')}

    <div class="info-line" style="margin-top:16px;">
      ✓&nbsp; Autopay is ${state.autopay ? 'on' : 'off'} for all connected services.
      <a href="#" data-goto="household" style="color:inherit; font-weight:600; margin-left:4px;">Manage in Household →</a>
    </div>
  `;
}

function connRow(key, icon, title, desc, price, isFs){
  const active = isFs ? state.aaLinked : state.combined;
  const tagClass = isFs ? (active ? 'linked' : 'notlinked') : (active ? 'combined' : 'separate');
  const tagText = isFs ? (active ? 'Linked' : 'Not linked') : (active ? 'Combined' : 'Separate');
  return `
    <div class="conn-row">
      <div class="conn-icon ${key}">${icon}</div>
      <div class="conn-text"><div class="t">${title}</div><div class="d">${desc}</div></div>
      <div class="conn-price">${price}</div>
      <span class="status-tag ${tagClass}">${tagText}</span>
    </div>
  `;
}

function eventCard(context){
  return `
    <div class="card event-card" id="event-card-${context}">
      <div class="event-icon">⚽</div>
      <div class="event-text">
        <div class="t">FIFA World Cup Final: today</div>
        <div class="p">Add Unite8 Sports for ₹24/mo. One tap, no separate subscription.</div>
        <div class="disclosure-line" style="margin-top:6px;"><span class="di">ⓘ</span><span>₹24/mo recurring until cancelled. Cancel anytime, no lock-in.</span></div>
      </div>
      <div class="toggle ${state.fifaAddon ? 'on' : ''}" data-toggle="fifa" data-context="${context}"><div class="knob"></div></div>
    </div>
  `;
}

/* ============ PAGE: COMBINE ============ */
function renderCombine(){
  if (state.combined){
    return `
      <div class="card info-line" style="display:flex; padding:20px;">
        ✅&nbsp; Your household is combined. Mobile, Home Wi-Fi and TV now run on one Altura Everyday plan, same ₹470 total, one bill.
      </div>
      <div class="section-title">Financial services</div>
      ${fsCard()}
    `;
  }

  const seg = state.segment === 'massmarket'
    ? {
        tag: 'SAVE MONEY',
        h3: "You could be saving effort on 3 separate Altura bills.",
        p: 'Mobile, Home Wi-Fi and TV are billed apart today, that\u2019s 3 due dates to track. Combine them under one Altura Everyday plan: same total, one bill, nothing extra to pay.'
      }
    : {
        tag: 'WE NOTICED',
        h3: "You're running 3 separate Altura connections at this address.",
        p: 'Mobile, Home Wi-Fi and TV are billed apart today. Combine them under one Altura Everyday plan: same total, one bill, one app. Never a discount trick, always the same price.'
      };
  return `
    <div class="card nudge-card">
      <span class="nudge-tag">${seg.tag}</span>
      <h3>${seg.h3}</h3>
      <p>${seg.p}</p>
      <div class="disclosure-line"><span class="di">\u24d8</span><span>No hidden terms: combining changes nothing about your price, data limits, or what counts as shared usage \u2014 see Household \u2192 Privacy for exactly what's tracked.</span></div>

      <div class="scan-box" id="scan-box">
        ${!state.scanComplete ? `
          <button class="btn btn-primary" id="scan-btn">🔍 Scan my household</button>
        ` : `
          <div class="scan-line show done"><span class="chk">✓</span> KYC match confirmed</div>
          <div class="scan-line show done"><span class="chk">✓</span> Address match confirmed</div>
          <div class="scan-line show done"><span class="chk">✓</span> 3 active connections found</div>
        `}
      </div>

      ${state.scanComplete ? `
        <div class="price-compare">
          <div class="price-box now"><div class="lbl">Today: 3 separate bills</div><div class="amt">₹470 total</div></div>
          <div class="price-box after"><div class="lbl">Combined: 1 bill</div><div class="amt">₹470 total</div></div>
        </div>
        <button class="btn btn-primary" id="confirm-combine-btn">Combine: same price, exactly</button>
      ` : ''}
    </div>

    <div class="section-title">Why combine</div>
    <div class="card">
      <div class="perk-row"><div class="perk-icon">📉</div><div class="perk-text"><div class="t">Fewer surprises</div><div class="d">One bill, one due date, one app</div></div></div>
      <div class="perk-row"><div class="perk-icon">🔒</div><div class="perk-text"><div class="t">Nothing changes in price</div><div class="d">Same total, always. This plan never bundles as a discount trick</div></div></div>
      <div class="perk-row"><div class="perk-icon">🎁</div><div class="perk-text"><div class="t">Unlocks Retain perks</div><div class="d">Lounge access, priority network, concierge. Automatic, no spend target</div></div></div>
    </div>

    <div class="section-title">Financial services</div>
    ${fsCard()}
  `;
}

function fsCard(){
  return `
    <div class="card">
      <div class="card-label">Expand: via Account Aggregator</div>
      <div class="event-card" style="margin-bottom:0;">
        <div class="event-icon" style="background:var(--green-dim);">💳</div>
        <div class="event-text">
          <div class="t">${state.aaLinked ? 'Financial services linked' : 'Link your financial accounts'}</div>
          <div class="p">${state.aaLinked ? 'Backed by Airtel Money\u2019s RBI-approved NBFC status.' : 'Onboarding via India\u2019s regulated Account Aggregator system. You choose what\u2019s shared.'}</div>
        </div>
        ${state.aaLinked
          ? `<span class="status-tag linked">Linked</span>`
          : `<button class="btn btn-primary btn-sm" id="link-fs-btn">Link accounts</button>`
        }
      </div>
    </div>
  `;
}

/* ============ PAGE: ENTERTAINMENT ============ */
let ottFilter = 'all';
let ottQuery = '';

function renderEntertainment(){
  return `
    <div class="grid grid-2" style="margin-bottom:26px;">
      ${eventCard('entertainment')}
      <div class="card event-card">
        <div class="event-icon" style="background:var(--gold-dim);">🏏</div>
        <div class="event-text">
          <div class="t">IPL season pass</div>
          <div class="p">One-tap add-on for the next season. Cancel anytime.</div>
        </div>
        <div class="toggle ${state.iplAddon ? 'on' : ''}" data-toggle="ipl"><div class="knob"></div></div>
      </div>
    </div>

    <div class="section-title">Everything you already have</div>
    <div class="ott-toolbar">
      <input class="ott-search" id="ott-search" placeholder="Search 25+ platforms…" value="${ottQuery}">
      <button class="filter-btn ${ottFilter==='all'?'active':''}" data-filter="all">All</button>
      <button class="filter-btn ${ottFilter==='unused'?'active':''}" data-filter="unused">Not opened in 30 days</button>
    </div>
    <div class="ott-grid" id="ott-grid">
      ${renderOttTiles()}
    </div>
  `;
}

function renderOttTiles(){
  let list = OTT_PLATFORMS.filter(p => p.name.toLowerCase().includes(ottQuery.toLowerCase()));
  if (ottFilter === 'unused') list = list.filter(p => p.unused);
  if (list.length === 0) return `<div style="grid-column:1/-1; color:var(--grey); font-size:13px; padding:20px 0;">No platforms match that search.</div>`;
  return list.map(p => `
    <div class="ott-tile ${p.unused ? 'unused' : ''}">
      <div class="logo" style="background:${p.have ? 'rgba(228,0,0,0.14)' : 'rgba(20,20,35,0.06)'}; color:${p.have ? 'var(--red)' : 'var(--grey)'};">${p.name.slice(0,2).toUpperCase()}</div>
      <div class="name">${p.name}</div>
      <div class="meta">${p.cat}</div>
      ${p.have
        ? `<span class="ott-tag ${p.unused ? 'unused' : 'have'}">${p.unused ? 'Included \u2014 unopened 30d' : 'Included'}</span>`
        : `<span class="ott-tag" style="background:rgba(20,20,35,0.06); color:var(--grey);">Not included</span>`
      }
    </div>
  `).join('');
}

/* ============ PAGE: PERKS ============ */
function renderPerks(){
  if (!state.combined){
    return `
      <div class="card" style="text-align:center; padding:48px 24px;">
        <div style="font-size:32px; margin-bottom:12px;">🔒</div>
        <div style="font-family:'Space Grotesk',sans-serif; font-size:16px; font-weight:600; margin-bottom:8px;">Perks unlock once your household is combined</div>
        <div style="font-size:13px; color:var(--grey); max-width:380px; margin:0 auto 20px; line-height:1.6;">No spend target, no tiers to climb. Just combine your 3 connections and every perk below activates automatically.</div>
        <button class="btn btn-primary" data-goto="combine">Go to Combine & Save</button>
      </div>
    `;
  }
  return `
    <div class="card">
      <div class="card-label">Automatic, no spend needed</div>
      <div class="perk-row"><div class="perk-icon">🛋️</div><div class="perk-text"><div class="t">Airport lounge access</div><div class="d">2 visits / quarter, all household members</div></div><span class="perk-badge">Active</span></div>
      <div class="perk-row"><div class="perk-icon">⚡</div><div class="perk-text"><div class="t">Priority network access</div><div class="d">Faster speeds at peak hours</div></div><span class="perk-badge">Active</span></div>
      <div class="perk-row"><div class="perk-icon">🎧</div><div class="perk-text"><div class="t">Concierge support line</div><div class="d">Skip the queue, every time</div></div><span class="perk-badge">Active</span></div>
    </div>

    <div class="section-title">Upcoming cultural moments</div>
    <div class="card event-card" style="margin-bottom:12px;">
      <div class="event-icon">🪔</div>
      <div class="event-text"><div class="t">Diwali entertainment pack</div><div class="p">Curated regional content, free for combined households</div></div>
      <span class="perk-badge">Scheduled</span>
    </div>
    <div class="card event-card">
      <div class="event-icon">🏏</div>
      <div class="event-text"><div class="t">IPL season</div><div class="p">Priority booking for stadium-partner offers</div></div>
      <span class="perk-badge">Scheduled</span>
    </div>
  `;
}

/* ============ PAGE: HOUSEHOLD ============ */
function renderHousehold(){
  return `
    <div class="grid grid-2">
      <div class="card">
        <div class="card-label">Billing</div>
        <div class="perk-row">
          <div class="perk-icon" style="background:var(--red-dim);">🔁</div>
          <div class="perk-text"><div class="t">Autopay</div><div class="d">${state.autopay ? 'On: your bill is paid automatically each cycle' : 'Off: you\u2019ll get a reminder 3 days before your bill'}</div></div>
          <div class="toggle ${state.autopay ? 'on' : ''}" id="autopay-toggle" style="margin-left:auto;"><div class="knob"></div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-label">Household lines</div>
        <div class="perk-row"><div class="perk-icon" style="background:var(--red-dim);">📱</div><div class="perk-text"><div class="t">Aswin K (Primary)</div><div class="d">Mobile · Postpaid-eligible</div></div></div>
        <div class="perk-row"><div class="perk-icon" style="background:var(--gold-dim);">📡</div><div class="perk-text"><div class="t">Home Wi-Fi</div><div class="d">Router · 200GB plan</div></div></div>
      </div>
    </div>

    ${(!state.migrationDismissed && !state.migrationAccepted) ? `
      <div class="section-title">For you</div>
      <div class="card offer-card">
        <span class="offer-tag">AI-FLAGGED &middot; JUST FOR YOU</span>
        <h3 style="font-family:'Space Grotesk',sans-serif; font-size:16.5px; font-weight:600; margin-bottom:8px;">Your recharge pattern qualifies you for Postpaid.</h3>
        <p style="font-size:13px; color:var(--grey); line-height:1.6; margin-bottom:16px; max-width:480px;">Same price, more included. No convenience upsell, just a better fit for how you already use your plan.</p>
        <button class="btn btn-primary btn-sm" id="migration-accept">Switch to Postpaid</button>
        <button class="btn btn-ghost btn-sm" id="migration-dismiss" style="margin-left:8px;">Not now</button>
      </div>
    ` : state.migrationAccepted ? `
      <div class="section-title">For you</div>
      <div class="info-line">✓&nbsp; You're on Postpaid now. Same price, more included.</div>
    ` : ''}

    <div class="section-title">Privacy & data controls</div>
    <div class="card">
      ${consentRow('usage', 'Usage & billing personalization', 'Lets Altura Everyday tailor the Daily Household Card and alerts to your actual usage.')}
      ${consentRow('family', 'Family broadband visibility', 'Shows combined household Wi-Fi usage across genuine multi-line connections \u2014 never mobile-hotspot-shared data.')}
      ${consentRow('financial', 'Financial data via Account Aggregator', 'Powers Financial Services. Declining this doesn\u2019t affect the other two permissions.')}
    </div>
  `;
}

function consentRow(key, title, desc){
  return `
    <div class="consent-row">
      <div class="consent-text" style="flex:1;"><div class="t">${title}</div><div class="d">${desc}</div></div>
      <div class="toggle ${state.consents[key] ? 'on' : ''}" data-consent="${key}"><div class="knob"></div></div>
    </div>
  `;
}

/* ============ PAGE ROUTER ============ */
const RENDERERS = {
  overview: renderOverview,
  combine: renderCombine,
  entertainment: renderEntertainment,
  perks: renderPerks,
  household: renderHousehold,
};

function renderPage(){
  const page = document.getElementById('page');
  page.innerHTML = `<div class="view active">${RENDERERS[state.page]()}</div>`;
  bindPageEvents();
  updateRing();
  updateNavBadges();

  // animate usage bars on overview
  if (state.page === 'overview'){
    requestAnimationFrame(() => {
      const w = document.getElementById('bar-wifi');
      const m = document.getElementById('bar-mobile');
      if (w) w.style.width = '82%';
      if (m) m.style.width = '47%';
    });
  }
}

/* ============ EVENT BINDING ============ */
function bindPageEvents(){
  // generic data-goto links/buttons anywhere within the current page
  document.querySelectorAll('#page [data-goto]').forEach(el => {
    el.addEventListener('click', (e) => { e.preventDefault(); goTo(el.dataset.goto); });
  });

  // FIFA / IPL toggles
  document.querySelectorAll('[data-toggle="fifa"]').forEach(el => {
    el.addEventListener('click', () => {
      state.fifaAddon = !state.fifaAddon;
      toast(state.fifaAddon ? 'Unite8 Sports added: ₹24 this cycle' : 'Removed from this cycle\u2019s bill');
      renderPage();
    });
  });
  document.querySelectorAll('[data-toggle="ipl"]').forEach(el => {
    el.addEventListener('click', () => {
      state.iplAddon = !state.iplAddon;
      toast(state.iplAddon ? 'IPL season pass added' : 'IPL season pass removed');
      renderPage();
    });
  });

  // Combine page: scan mechanic
  const scanBtn = document.getElementById('scan-btn');
  if (scanBtn){
    scanBtn.addEventListener('click', runScan);
  }
  const confirmBtn = document.getElementById('confirm-combine-btn');
  if (confirmBtn){
    confirmBtn.addEventListener('click', () => {
      state.combined = true;
      toast('Combined. One bill from next cycle, perks unlocked.');
      renderPage();
    });
  }
  const linkFsBtn = document.getElementById('link-fs-btn');
  if (linkFsBtn){
    linkFsBtn.addEventListener('click', () => {
      state.aaLinked = true;
      state.consents.financial = true;
      toast('Financial services linked via Account Aggregator');
      renderPage();
    });
  }

  // Entertainment: search & filter
  const ottSearch = document.getElementById('ott-search');
  if (ottSearch){
    ottSearch.addEventListener('input', (e) => {
      ottQuery = e.target.value;
      document.getElementById('ott-grid').innerHTML = renderOttTiles();
    });
  }
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ottFilter = btn.dataset.filter;
      renderPage();
    });
  });

  // Household: autopay, migration, consents
  const autopayToggle = document.getElementById('autopay-toggle');
  if (autopayToggle){
    autopayToggle.addEventListener('click', () => {
      state.autopay = !state.autopay;
      toast(state.autopay ? 'Autopay turned on' : 'Autopay off \u2014 we\u2019ll remind you 3 days before your bill');
      renderPage();
    });
  }
  const migAccept = document.getElementById('migration-accept');
  if (migAccept){
    migAccept.addEventListener('click', () => {
      state.migrationAccepted = true;
      toast('Switched to Postpaid \u2014 same price, more included');
      renderPage();
    });
  }
  const migDismiss = document.getElementById('migration-dismiss');
  if (migDismiss){
    migDismiss.addEventListener('click', () => {
      state.migrationDismissed = true;
      toast('No problem \u2014 find this later under Household');
      renderPage();
    });
  }
  document.querySelectorAll('[data-consent]').forEach(el => {
    el.addEventListener('click', () => {
      const key = el.dataset.consent;
      state.consents[key] = !state.consents[key];
      if (key === 'financial') state.aaLinked = state.consents.financial;
      toast(`Updated \u2014 this doesn\u2019t affect your other permissions.`);
      renderPage();
    });
  });
}

function runScan(){
  const box = document.getElementById('scan-box');
  box.innerHTML = `
    <div class="scan-line" id="scan-1"><span class="chk"></span> Checking KYC match…</div>
    <div class="scan-line" id="scan-2"><span class="chk"></span> Checking address match…</div>
    <div class="scan-line" id="scan-3"><span class="chk"></span> Cross-referencing active connections…</div>
    <div class="scan-progress-track"><div class="scan-progress-fill" id="scan-fill"></div></div>
  `;
  requestAnimationFrame(() => {
    document.getElementById('scan-fill').style.width = '100%';
  });
  const steps = ['scan-1','scan-2','scan-3'];
  steps.forEach((id, i) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el){ el.classList.add('show'); }
      setTimeout(() => { if (el) el.classList.add('done'); if(el) el.querySelector('.chk').textContent = '✓'; }, 380);
    }, i * 480);
  });
  setTimeout(() => {
    state.scanComplete = true;
    renderPage();
  }, steps.length * 480 + 500);
}

/* ============ TOPBAR: bell + impact panel ============ */
function initTopbar(){
  const bellBtn = document.getElementById('bell-btn');
  const bellPanel = document.getElementById('bell-panel');
  const bellDot = document.getElementById('bell-dot');
  bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    bellPanel.classList.toggle('open');
    state.bellOpened = true;
    bellDot.classList.add('hidden');
  });
  document.addEventListener('click', (e) => {
    if (!bellPanel.contains(e.target) && e.target !== bellBtn){
      bellPanel.classList.remove('open');
    }
  });
  bellPanel.querySelectorAll('.bell-item').forEach(item => {
    item.addEventListener('click', () => {
      bellPanel.classList.remove('open');
      goTo(item.dataset.goto);
    });
  });

  const segmentBtn = document.getElementById('segment-btn');
  const segmentLabel = document.getElementById('segment-label');
  segmentBtn.addEventListener('click', () => {
    state.segment = state.segment === 'highvalue' ? 'massmarket' : 'highvalue';
    segmentLabel.textContent = state.segment === 'highvalue' ? 'Viewing as: High-value' : 'Viewing as: Mass-market';
    segmentBtn.classList.toggle('seg-massmarket', state.segment === 'massmarket');
    toast(state.segment === 'highvalue'
      ? 'Switched to high-value framing: "we noticed" (~74% preference)'
      : 'Switched to mass-market framing: "save money" (~54-73% preference)');
    renderPage();
  });

  const impactBtn = document.getElementById('impact-btn');
  const overlay = document.getElementById('impact-overlay');
  const slideover = document.getElementById('impact-slideover');
  const closeBtn = document.getElementById('impact-close');
  let counted = false;

  function openImpact(){
    overlay.classList.add('open');
    slideover.classList.add('open');
    if (!counted){ animateCounters(); counted = true; }
  }
  function closeImpact(){
    overlay.classList.remove('open');
    slideover.classList.remove('open');
  }
  impactBtn.addEventListener('click', openImpact);
  closeBtn.addEventListener('click', closeImpact);
  overlay.addEventListener('click', closeImpact);
}

function animateCounters(){
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0');
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const divisor = decimals ? Math.pow(10, decimals) : 1;
    const displayTarget = decimals ? target / divisor : target;
    let start = 0;
    const duration = 900;
    const startTime = performance.now();
    function tick(now){
      const p = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = displayTarget * eased;
      el.textContent = prefix + val.toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

/* ============ INIT ============ */
renderNav();
renderPage();
initTopbar();
