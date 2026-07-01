(function () {
  const NS = "bcw"; // brand-chat-widget short namespace to keep DOM clean
  const PRIMARY = "#2563eb"; // Brand 500
  const PRIMARY_DARK = "#1d4ed8"; // Brand 600

  // ─── 1. STYLES ────────────────────────────────────────────────────────────
  const css = `
    #${NS}-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: inherit;
    }

    /* ── Toggle Button ── */
    #${NS}-btn {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${PRIMARY};
      color: #fff;
      box-shadow: 0 4px 12px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.12);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      bottom: 0;
      right: 0;
      transition: transform .25s cubic-bezier(.175,.885,.32,1.275), box-shadow .25s;
    }
    #${NS}-btn:hover { transform: scale(1.06); box-shadow: 0 6px 18px rgba(0,0,0,.22); }
    #${NS}-btn svg { width: 28px; height: 28px; fill: currentColor; }
    #${NS}-btn .ico-open,
    #${NS}-btn .ico-close {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      transition: transform .3s cubic-bezier(.4,0,.2,1), opacity .3s;
    }
    #${NS}-btn .ico-open  { opacity:1; transform: rotate(0deg) scale(1); }
    #${NS}-btn .ico-close { opacity:0; transform: rotate(-90deg) scale(0); }
    #${NS}-btn.open .ico-open  { opacity:0; transform: rotate(90deg) scale(0); }
    #${NS}-btn.open .ico-close { opacity:1; transform: rotate(0deg) scale(1); }

    /* ── Widget Window ── */
    #${NS}-win {
      position: absolute;
      bottom: 80px; right: 0;
      width: 420px; height: 640px;
      max-height: calc(100vh - 120px);
      background: #020817; /* Dark theme bg */
      border: 1px solid #1e293b;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(0,0,0,.3), 0 20px 48px rgba(0,0,0,.3);
      display: flex; flex-direction: column;
      overflow: hidden;
      opacity: 0; pointer-events: none;
      transform: translateY(20px) scale(.96);
      transform-origin: bottom right;
      transition: opacity .3s cubic-bezier(.19,1,.22,1), transform .3s cubic-bezier(.19,1,.22,1);
      color: #f8fafc;
    }
    #${NS}-win.open { opacity:1; pointer-events:auto; transform: translateY(0) scale(1); }

    /* ── View Panels ── */
    .${NS}-view {
      position: absolute; top: 0; left: 0;
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      background: #020817;
      transition: transform .32s cubic-bezier(.19,1,.22,1), opacity .32s cubic-bezier(.19,1,.22,1);
    }
    .${NS}-view.slide-left  { transform: translateX(-100%); opacity: 0; pointer-events: none; }
    .${NS}-view.slide-right { transform: translateX(100%);  opacity: 0; pointer-events: none; }

    /* ── Shared Header ── */
    .${NS}-hdr {
      background: #0f172a;
      border-bottom: 1px solid #1e293b;
      color: #fff;
      padding: 18px 20px;
      display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
      box-shadow: 0 2px 6px rgba(0,0,0,.2);
      position: relative;
      z-index: 2;
    }
    .${NS}-hdr-icon {
      width: 36px; height: 36px;
      background: rgba(255,255,255,.1);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .${NS}-hdr-icon svg { width: 18px; height: 18px; fill: #fff; }
    .${NS}-hdr-body { flex: 1; min-width: 0; }
    .${NS}-hdr-title {
      font-weight: 800; font-size: 14px; margin: 0;
      text-transform: uppercase; letter-spacing: .5px; line-height: 1.2;
    }
    .${NS}-hdr-sub {
      font-size: 12px; opacity: .88; margin-top: 3px;
      display: flex; align-items: center; gap: 6px;
    }
    .${NS}-online-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: #4ade80; display: inline-block; flex-shrink: 0;
    }
    .${NS}-icon-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: transparent; color: #fff;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; padding: 0; transition: background .2s; flex-shrink: 0;
    }
    .${NS}-icon-btn:hover { background: rgba(255,255,255,.15); }
    .${NS}-icon-btn svg { width: 20px; height: 20px; fill: currentColor; }

    /* ── Home View ── */
    #${NS}-home-body {
      flex: 1; overflow-y: auto;
      padding: 20px; display: flex; flex-direction: column; gap: 20px;
    }
    .${NS}-card {
      background: #0f172a; border-radius: 12px;
      padding: 20px; border: 1px solid #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .${NS}-card h3 {
      margin: 0 0 6px; font-size: 13px; font-weight: 800;
      color: #f8fafc; text-transform: uppercase; letter-spacing: .4px;
    }
    .${NS}-card p { margin: 0 0 16px; font-size: 14px; color: #cbd5e1; line-height: 1.5; }
    #${NS}-start-btn {
      width: 100%; padding: 13px 16px;
      background: ${PRIMARY}; color: #fff;
      border: none; border-radius: 8px;
      font-size: 15px; font-weight: 600;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: background .2s;
    }
    #${NS}-start-btn:hover { background: ${PRIMARY_DARK}; }
    #${NS}-start-btn svg { width: 18px; height: 18px; fill: currentColor; }

    /* ── Sessions ── */
    .${NS}-sec-label {
      font-size: 11px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: .6px;
      margin-bottom: 10px;
    }
    #${NS}-sessions { display: flex; flex-direction: column; gap: 8px; }
    .${NS}-sess-row {
      background: #0f172a; border: 1px solid #1e293b; border-radius: 8px;
      padding: 14px 16px;
      display: flex; align-items: center; gap: 12px;
      cursor: pointer;
      transition: border-color .2s, box-shadow .2s;
    }
    .${NS}-sess-row:hover { border-color: #334155; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
    .${NS}-sess-ico {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(37,99,235,0.2); color: ${PRIMARY};
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .${NS}-sess-ico svg { width: 18px; height: 18px; fill: currentColor; }
    .${NS}-sess-info { flex: 1; min-width: 0; }
    .${NS}-sess-preview {
      font-size: 13px; font-weight: 500; color: #f8fafc;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      margin-bottom: 3px;
    }
    .${NS}-sess-date { font-size: 11px; color: #64748b; }

    /* ── Chat View ── */
    #${NS}-msgs {
      flex: 1; overflow-y: auto; overflow-x: hidden;
      padding: 20px; display: flex; flex-direction: column; gap: 14px;
      background: #020817; scroll-behavior: smooth;
    }
    .${NS}-bubble {
      max-width: 85%; padding: 13px 17px;
      border-radius: 16px; font-size: 14px; line-height: 1.55;
      word-wrap: break-word;
      animation: ${NS}-pop .28s ease forwards;
    }
    .${NS}-bubble-user {
      align-self: flex-end; background: ${PRIMARY}; color: #fff;
      border-bottom-right-radius: 4px;
    }
    .${NS}-bubble-ai {
      align-self: flex-start; background: #0f172a; color: #f8fafc;
      border-bottom-left-radius: 4px;
      border: 1px solid #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .${NS}-bubble-error {
      align-self: flex-start; background: #0f172a; color: #ef4444;
      border: 1px solid #7f1d1d; border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(220,38,38,.1);
    }
    @keyframes ${NS}-pop {
      from { opacity: 0; transform: translateY(10px) scale(.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    /* ── Product Card Layout ── */
    .${NS}-prod-container {
      display: grid;
      gap: 8px;
      margin-top: 4px;
      width: 100%;
    }
    .${NS}-prod-container.grid-2 {
      grid-template-columns: repeat(2, 1fr);
    }
    .${NS}-prod-container.grid-1 {
      grid-template-columns: 1fr;
      max-width: 280px;
    }
    .${NS}-prod {
      display: flex; flex-direction: column; gap: 12px;
      padding: 12px; background: #0f172a;
      border: 1px solid #1e293b; border-radius: 12px;
      color: #f8fafc; text-decoration: none;
      box-sizing: border-box; transition: box-shadow .2s;
    }
    .${NS}-prod:hover { box-shadow: 0 4px 12px rgba(0,0,0,.3); border-color: #334155; }
    .${NS}-prod-row { display: flex; gap: 12px; align-items: center; }
    .${NS}-prod img {
      width: 56px; height: 56px; object-fit: cover;
      border-radius: 8px; border: 1px solid #1e293b; flex-shrink: 0;
    }
    .${NS}-prod-info { flex: 1; min-width: 0; }
    .${NS}-prod-title { font-size: 14px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .${NS}-prod-price { font-size: 12px; color: #60a5fa; margin-top: 4px; font-weight: 500; }
    .${NS}-prod-buy {
      width: 100%; padding: 8px; text-align: center;
      background: ${PRIMARY}; color: #fff; border-radius: 6px;
      font-size: 12px; font-weight: 600; transition: background .2s;
      text-decoration: none; border: none; cursor: pointer;
    }
    .${NS}-prod-buy:hover { background: ${PRIMARY_DARK}; }

    /* ── Suggested Chats ── */
    #${NS}-suggest {
      display: none; flex-wrap: wrap; gap: 8px;
      margin-bottom: 10px; align-self: flex-start;
      width: 100%;
    }
    .${NS}-chip {
      background: transparent; color: #60a5fa;
      border: 1px solid #1e293b; border-radius: 16px;
      padding: 8px 12px; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: background .2s, border-color .2s;
    }
    .${NS}-chip:hover {
      background: rgba(37,99,235,0.1); border-color: #3b82f6;
    }

    /* ── Typing Dots ── */
    #${NS}-typing {
      display: none; align-self: flex-start;
      background: #0f172a; padding: 16px 20px;
      border-radius: 16px; border-bottom-left-radius: 4px;
      border: 1px solid #1e293b;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
      margin: 0 20px 6px;
    }
    .${NS}-dot {
      display: inline-block; width: 6px; height: 6px;
      background: #64748b; border-radius: 50%; margin: 0 2px;
      animation: ${NS}-bounce 1.4s infinite ease-in-out both;
    }
    .${NS}-dot:nth-child(1) { animation-delay: -.32s; }
    .${NS}-dot:nth-child(2) { animation-delay: -.16s; }
    @keyframes ${NS}-bounce {
      0%,80%,100% { transform: scale(0); opacity: .5; }
      40%          { transform: scale(1); opacity: 1; }
    }

    /* ── Input Area ── */
    #${NS}-input-area {
      padding: 14px 16px;
      background: #0f172a; border-top: 1px solid #1e293b;
      display: flex; gap: 10px; align-items: center;
      flex-shrink: 0; z-index: 2;
    }
    #${NS}-input {
      flex: 1; border: 1px solid #1e293b; background: #020817;
      border-radius: 24px; padding: 12px 18px;
      font-size: 14px; outline: none; font-family: inherit; color: #f8fafc;
      transition: border-color .2s;
    }
    #${NS}-input::placeholder { color: #64748b; }
    #${NS}-input:focus { border-color: #3b82f6; }
    #${NS}-send {
      width: 44px; height: 44px; border-radius: 50%;
      background: ${PRIMARY}; color: #fff;
      border: none; cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: background .2s, transform .1s;
    }
    #${NS}-send:hover { background: ${PRIMARY_DARK}; transform: scale(1.05); }
    #${NS}-send:active { transform: scale(.95); }
    #${NS}-send:disabled { background: #334155; color: #64748b; cursor: not-allowed; transform: none; }
    #${NS}-send svg { width: 18px; height: 18px; fill: currentColor; margin-left: 2px; }

    /* ── Footer ── */
    .${NS}-footer {
      padding: 10px 16px; text-align: center;
      font-size: 11px; color: #64748b;
      background: #0f172a; border-top: 1px solid #1e293b;
      flex-shrink: 0; z-index: 1;
    }
    .${NS}-footer strong { color: #94a3b8; font-weight: 600; }

    /* ── Greeting Bubble ── */
    #${NS}-greet {
      position: absolute; bottom: 80px; right: 0;
      width: 280px; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,.3);
      padding: 16px; opacity: 0; pointer-events: none;
      transform: translateY(10px) scale(.95);
      transform-origin: bottom right;
      transition: opacity .3s cubic-bezier(.19,1,.22,1), transform .3s cubic-bezier(.19,1,.22,1);
      z-index: 10;
      color: #f8fafc;
    }
    #${NS}-greet.visible { opacity:1; pointer-events:auto; transform: translateY(0) scale(1); }
    #${NS}-greet-x {
      position: absolute; top: 8px; right: 8px;
      width: 22px; height: 22px;
      background: transparent; border: none; color: #64748b;
      font-size: 18px; cursor: pointer;
      display: flex; align-items: center; justify-content: center; padding: 0;
      transition: color .2s;
    }
    #${NS}-greet-x:hover { color: #cbd5e1; }
    .${NS}-greet-hdr {
      display: flex; align-items: center; gap: 10px;
      margin-bottom: 8px; padding-right: 22px;
    }
    .${NS}-greet-ico {
      width: 28px; height: 28px; border-radius: 50%;
      background: ${PRIMARY}; color: #fff;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .${NS}-greet-ico svg { width: 14px; height: 14px; fill: currentColor; }
    .${NS}-greet-name { font-weight: 600; font-size: 14px; }
    .${NS}-greet-body {
      font-size: 13px; color: #cbd5e1; line-height: 1.5;
      transition: opacity .35s ease;
    }
    .${NS}-greet-body.fade-out { opacity: 0; }
    .${NS}-greet-body.fade-in  { opacity: 1; }

    /* ── Mobile ── */
    @media (max-width: 480px) {
      #${NS}-win {
        bottom: 0; right: 0; width: 100%;
        height: 100vh; max-height: 100%; border-radius: 0;
      }
      #${NS}-container { bottom: 0; right: 0; }
      #${NS}-btn { bottom: 24px; right: 24px; }
      .${NS}-mob-close { display: flex !important; }
      .${NS}-prod-container.grid-2 { grid-template-columns: 1fr; }
    }
    @media (min-width: 481px) {
      .${NS}-mob-close { display: none !important; }
    }
  `;

  const styleEl = document.createElement("style");
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ─── 2. ICONS ─────────────────────────────────────────────────────────────
  const IC = {
    chat: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>',
    wave: '<svg viewBox="0 0 24 24"><path d="M6 10v4c0 .55.45 1 1 1s1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1zm5-4v12c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1s-1 .45-1 1zm5 4v4c0 .55.45 1 1 1s1-.45 1-1v-4c0-.55-.45-1-1-1s-1 .45-1 1z"/></svg>',
    hist: '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" opacity=".3"/><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>',
  };

  // ─── 3. HELPERS ───────────────────────────────────────────────────────────
  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const SESS_KEY = "bcw_sessions";
  function getSessions() {
    try { return JSON.parse(localStorage.getItem(SESS_KEY) || "[]"); } 
    catch { return []; }
  }
  function saveSessions(arr) {
    localStorage.setItem(SESS_KEY, JSON.stringify(arr));
  }

  function upsertSession(id, preview) {
    let arr = getSessions();
    const idx = arr.findIndex((s) => s.id === id);
    if (idx < 0) {
      arr.unshift({ id, date: new Date().toISOString(), preview });
    } else {
      if (preview) arr[idx].preview = preview;
      arr[idx].date = new Date().toISOString();
      const row = arr.splice(idx, 1)[0];
      arr.unshift(row);
    }
    saveSessions(arr);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  // ─── 4. STATE ─────────────────────────────────────────────────────────────
  const scriptTag = document.currentScript || document.querySelector("script[data-client-id]");
  const clientId = scriptTag ? scriptTag.getAttribute("data-client-id") || "" : "";
  const wsUrlOverride = scriptTag ? scriptTag.getAttribute("data-ws-url") : null;
  const wsBaseUrl = wsUrlOverride || "ws://localhost:8000/api/v1";
  const httpBaseUrl = wsBaseUrl.replace(/^ws/, 'http');

  let activeId = null; 
  let view = "home"; 
  let isOpen = false;
  let isTyping = false;
  const seenIds = new Set();
  let wsConn = null;

  let greetDismissed = sessionStorage.getItem("bcw_greet_dismissed") === "1";

  // ─── 5. DOM CONSTRUCTION ──────────────────────────────────────────────────
  const root = document.createElement("div");
  root.id = `${NS}-container`;

  root.innerHTML = `
    <div id="${NS}-win">
      <!-- ▸ HOME VIEW -->
      <div id="${NS}-home" class="${NS}-view">
        <div class="${NS}-hdr">
          <div class="${NS}-hdr-icon">${IC.chat}</div>
          <div class="${NS}-hdr-body">
            <div class="${NS}-hdr-title">Customer Service</div>
            <div class="${NS}-hdr-sub">
              <span class="${NS}-online-dot"></span> Online — here to help
            </div>
          </div>
          <button class="${NS}-icon-btn ${NS}-mob-close" aria-label="Close">${IC.close}</button>
        </div>

        <div id="${NS}-home-body">
          <div class="${NS}-card">
            <h3>Chat with our AI Assistant</h3>
            <p>Welcome! 👋 Ask anything — we typically reply in seconds.</p>
            <button id="${NS}-start-btn">${IC.wave} Start conversation</button>
          </div>

          <div id="${NS}-sessions-wrap" style="display:none">
            <div class="${NS}-sec-label">Previous conversations</div>
            <div id="${NS}-sessions"></div>
          </div>
        </div>

        <div class="${NS}-footer">Powered by <strong>Noxis CSAI</strong></div>
      </div>

      <!-- ▸ CHAT VIEW -->
      <div id="${NS}-chat" class="${NS}-view slide-right">
        <div class="${NS}-hdr">
          <button id="${NS}-back-btn" class="${NS}-icon-btn" aria-label="Back">${IC.back}</button>
          <div class="${NS}-hdr-icon">${IC.chat}</div>
          <div class="${NS}-hdr-body">
            <div class="${NS}-hdr-title">Customer Service</div>
            <div class="${NS}-hdr-sub">
              <span class="${NS}-online-dot"></span> Online
            </div>
          </div>
          <button class="${NS}-icon-btn ${NS}-mob-close" aria-label="Close">${IC.close}</button>
        </div>

        <div id="${NS}-msgs"></div>
        <div id="${NS}-suggest">
          <button class="${NS}-chip">Status pesanan saya</button>
          <button class="${NS}-chip">Rekomendasi produk terbaik</button>
          <button class="${NS}-chip">Promo hari ini</button>
        </div>
        <div id="${NS}-typing">
          <div class="${NS}-dot"></div>
          <div class="${NS}-dot"></div>
          <div class="${NS}-dot"></div>
        </div>
        <div id="${NS}-input-area">
          <input id="${NS}-input" type="text" placeholder="Type your message…" autocomplete="off" />
          <button id="${NS}-send" aria-label="Send">${IC.send}</button>
        </div>
        <div class="${NS}-footer">Powered by <strong>Noxis CSAI</strong></div>
      </div>

    </div>

    <!-- Greeting Bubble -->
    <div id="${NS}-greet">
      <button id="${NS}-greet-x" aria-label="Dismiss">&times;</button>
      <div class="${NS}-greet-hdr">
        <div class="${NS}-greet-ico">${IC.chat}</div>
        <span class="${NS}-greet-name">Customer Service</span>
      </div>
      <div id="${NS}-greet-body" class="${NS}-greet-body"></div>
    </div>

    <!-- FAB Button -->
    <div id="${NS}-btn" aria-label="Open chat">
      <div class="ico-open">${IC.chat}</div>
      <div class="ico-close">${IC.close}</div>
    </div>
  `;

  document.body.appendChild(root);

  // ─── 6. ELEMENT REFS ──────────────────────────────────────────────────────
  const winEl = document.getElementById(`${NS}-win`);
  const fabEl = document.getElementById(`${NS}-btn`);
  const homeEl = document.getElementById(`${NS}-home`);
  const chatEl = document.getElementById(`${NS}-chat`);
  const sessWrapEl = document.getElementById(`${NS}-sessions-wrap`);
  const sessListEl = document.getElementById(`${NS}-sessions`);
  const startBtnEl = document.getElementById(`${NS}-start-btn`);
  const backBtnEl = document.getElementById(`${NS}-back-btn`);
  const msgsEl = document.getElementById(`${NS}-msgs`);
  const suggestEl = document.getElementById(`${NS}-suggest`);
  const inputEl = document.getElementById(`${NS}-input`);
  const sendEl = document.getElementById(`${NS}-send`);
  const typingEl = document.getElementById(`${NS}-typing`);
  const greetEl = document.getElementById(`${NS}-greet`);
  const greetXEl = document.getElementById(`${NS}-greet-x`);
  const greetBodyEl = document.getElementById(`${NS}-greet-body`);
  const mobCloseEls = document.querySelectorAll(`.${NS}-mob-close`);

  // ─── 7. VIEW SWITCHER ─────────────────────────────────────────────────────
  function showHome() {
    view = "home";
    homeEl.classList.remove("slide-left");
    chatEl.classList.add("slide-right");
    chatEl.classList.remove("slide-left");
    renderSessions();
    if (wsConn) { wsConn.close(); wsConn = null; }
  }

  function showChat() {
    view = "chat";
    homeEl.classList.add("slide-left");
    chatEl.classList.remove("slide-right");
    chatEl.classList.remove("slide-left");
    if (window.innerWidth > 480) setTimeout(() => inputEl.focus(), 320);
  }

  // ─── 8. SESSION LIST ──────────────────────────────────────────────────────
  function renderSessions() {
    const arr = getSessions();
    if (!arr.length) {
      sessWrapEl.style.display = "none";
      return;
    }
    sessWrapEl.style.display = "block";
    sessListEl.innerHTML = "";
    arr.forEach((s) => {
      const row = document.createElement("div");
      row.className = `${NS}-sess-row`;
      row.innerHTML = `
        <div class="${NS}-sess-ico">${IC.hist}</div>
        <div class="${NS}-sess-info">
          <div class="${NS}-sess-preview">${escText(s.preview || "Conversation")}</div>
          <div class="${NS}-sess-date">${fmtDate(s.date)}</div>
        </div>`;
      row.addEventListener("click", () => resumeSession(s.id));
      sessListEl.appendChild(row);
    });
  }

  // ─── 9. WEBSOCKET LOGIC ───────────────────────────────────────────────────
  function connectWs(id) {
    if (wsConn) wsConn.close();
    wsConn = new WebSocket(`${wsBaseUrl}/chat/ws/${id}`);

    wsConn.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'typing') {
          setTyping(data.status);
        } else if (data.type === 'message' || data.type === 'escalation' || data.type === 'new_message') {
          if (data.sender !== 'customer' && data.sender !== 'user') {
            bubble(data.text || data.message || data.messages || "", "ai", data.has_product, data.products);
            setTyping(false);
            hideSuggests(); // Hide suggestions on first response
          }
        }
      } catch (e) {
        console.error('WS parse error', e);
      }
    };
    
    wsConn.onclose = () => {
      // Reconnect logic or update UI status if disconnected
    };
  }

  // ─── 10. CHAT ACTIONS ─────────────────────────────────────────────────────
  function startNew() {
    activeId = uuid();
    upsertSession(activeId, "New conversation");
    msgsEl.innerHTML = "";
    seenIds.clear();
    bubble("Hello! 👋 How can I help you today?", "ai", false, [], true);
    showSuggests();
    showChat();
    connectWs(activeId);
  }

  async function resumeSession(id) {
    activeId = id;
    msgsEl.innerHTML = "";
    seenIds.clear();
    showChat();
    setTyping(true);
    let messageCount = 0;
    try {
      const res = await fetch(`${httpBaseUrl}/chat/sessions/${id}/messages`);
      if (res.ok) {
        const body = await res.json();
        const msgs = Array.isArray(body.data) ? body.data : body.data?.messages || [];
        msgs.forEach((m) => {
          if (m.id) seenIds.add(m.id);
          bubble(m.message || m.content || "", m.role === "user" ? "user" : "ai", m.has_product, m.products, true);
          messageCount++;
        });
      }
    } catch (_) {}
    
    if (messageCount <= 1) showSuggests(); // Show if only greeting or empty
    else hideSuggests();

    setTyping(false);
    connectWs(activeId);
  }

  // ─── 11. MESSAGES & UI ────────────────────────────────────────────────────
  function escText(str) {
    const d = document.createElement("div");
    d.textContent = str;
    return d.innerHTML;
  }

  function showSuggests() { suggestEl.style.display = "flex"; }
  function hideSuggests() { suggestEl.style.display = "none"; }

  function bubble(rawText, sender, hasProduct = false, products = [], skipSave = false) {
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;flex-direction:column;gap:8px;width:100%";

    const b = document.createElement("div");
    b.className = `${NS}-bubble ${NS}-bubble-${sender}`;

    let text = rawText;
    if (typeof text === "string") {
      try { const p = JSON.parse(text); if (p && typeof p === "object") text = p.message || p.text || text; } catch (_) {}
    }
    if (typeof text === "object" && text !== null) text = text.message || text.text || JSON.stringify(text, null, 2);
    let safe = typeof text === "string" ? text : String(text);

    if (!skipSave && safe && activeId) {
      upsertSession(activeId, safe);
      renderSessions();
    }

    const e = document.createElement("div"); e.textContent = safe; safe = e.innerHTML;
    safe = safe.replace(/(https?:\/\/[^\s<"']+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" style="text-decoration:underline;color:inherit;word-break:break-word">$1</a>');
    safe = safe.replace(/\n/g, "<br>");
    b.innerHTML = safe;
    wrap.appendChild(b);

    if (hasProduct && products && products.length > 0) {
      const pw = document.createElement("div");
      pw.className = `${NS}-prod-container ${products.length > 1 ? 'grid-2' : 'grid-1'}`;
      pw.style.cssText = `align-self:${sender === "ai" ? "flex-start" : "flex-end"}; width: 100%;`;
      
      products.forEach((p) => {
        const a = document.createElement("div");
        a.className = `${NS}-prod`;
        const buyHref = p.url || p.link || "#";
        const priceStr = p.price && p.price !== "N/A" && p.price !== "0" ? `Rp ${p.price}` : "Cek Harga";
        a.innerHTML = `
          <div class="${NS}-prod-row">
            ${p.image_url ? `<img src="${p.image_url}" alt="${escText(p.title || p.product_title || "Product")}">` : `<div style="width:56px;height:56px;border-radius:8px;background:#1e293b;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" width="24" height="24" fill="#64748b"><path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9zM12 4.15L6.04 7.5 12 10.85l5.96-3.35L12 4.15z"/></svg></div>`}
            <div class="${NS}-prod-info">
              <div class="${NS}-prod-title">${escText(p.title || p.product_title || "Product")}</div>
              <div class="${NS}-prod-price">${escText(priceStr)}</div>
            </div>
          </div>
          <a href="${buyHref}" target="_blank" rel="noopener noreferrer" class="${NS}-prod-buy">Lihat Produk</a>`;
        pw.appendChild(a);
      });
      wrap.appendChild(pw);
    }

    msgsEl.appendChild(wrap);
    msgsEl.appendChild(typingEl);
    scrollBot();
  }

  function scrollBot() { msgsEl.scrollTop = msgsEl.scrollHeight; }

  function setTyping(on) {
    isTyping = on;
    typingEl.style.display = on ? "flex" : "none";
    sendEl.disabled = on;
    inputEl.disabled = on;
    if (on) scrollBot();
    else if (isOpen && window.innerWidth > 480 && view === "chat") inputEl.focus();
  }

  // ─── 12. SEND MESSAGE ─────────────────────────────────────────────────────
  function send(textOverride) {
    const text = typeof textOverride === 'string' ? textOverride : inputEl.value.trim();
    if (!text || isTyping || !activeId) return;
    inputEl.value = "";
    bubble(text, "user");
    hideSuggests();

    if (wsConn && wsConn.readyState === WebSocket.OPEN) {
      wsConn.send(JSON.stringify({
        type: 'message',
        text: text,
        sender: 'customer'
      }));
      setTyping(true);
    } else {
      bubble("Connection lost. Reconnecting...", "error");
      connectWs(activeId);
      setTimeout(() => send(text), 1000);
    }
  }

  // ─── 13. TOGGLE ───────────────────────────────────────────────────────────
  function toggleWidget() {
    isOpen = !isOpen;
    if (isOpen) {
      winEl.classList.add("open");
      fabEl.classList.add("open");
      stopGreetLoop();
      sessionStorage.setItem("bcw_greet_dismissed", "1");
      greetDismissed = true;
      if (view === "home") renderSessions();
      else {
        scrollBot();
        if (activeId && (!wsConn || wsConn.readyState !== WebSocket.OPEN)) {
          connectWs(activeId);
        }
      }
    } else {
      winEl.classList.remove("open");
      fabEl.classList.remove("open");
    }
  }

  // ─── 14. GREETING BUBBLE CAROUSEL ─────────────────────────────────────────
  const GREET_MESSAGES = [
    "Welcome! 👋 Have questions about our products? Ask our AI assistant!",
    "🔍 Looking for something specific? Our AI can help you find it fast.",
    "💬 Need help with your order or delivery? We're here 24/7 — just ask!",
  ];
  let greetIdx = 0; let greetLoop = null; let greetActive = false;

  function setGreetMessage(msg) {
    greetBodyEl.classList.add("fade-out");
    setTimeout(() => {
      greetBodyEl.textContent = msg;
      greetBodyEl.classList.remove("fade-out");
    }, 350);
  }

  function startGreetLoop() {
    if (greetDismissed || isOpen || greetActive) return;
    greetActive = true; greetIdx = 0;
    greetBodyEl.textContent = GREET_MESSAGES[0];
    greetEl.classList.add("visible");
    greetLoop = setInterval(() => {
      if (greetDismissed || isOpen) { stopGreetLoop(); return; }
      greetIdx = (greetIdx + 1) % GREET_MESSAGES.length;
      setGreetMessage(GREET_MESSAGES[greetIdx]);
    }, 3000);
  }

  function stopGreetLoop() {
    clearInterval(greetLoop); greetLoop = null; greetActive = false;
    greetEl.classList.remove("visible");
  }

  if (!greetDismissed) setTimeout(startGreetLoop, 2000);

  // ─── 15. EVENT LISTENERS ──────────────────────────────────────────────────
  fabEl.addEventListener("click", toggleWidget);
  mobCloseEls.forEach((el) => el.addEventListener("click", () => { if (isOpen) toggleWidget(); }));
  greetXEl.addEventListener("click", (e) => {
    e.stopPropagation(); stopGreetLoop();
    sessionStorage.setItem("bcw_greet_dismissed", "1"); greetDismissed = true;
  });
  greetEl.addEventListener("click", () => { if (!isOpen) toggleWidget(); });

  startBtnEl.addEventListener("click", startNew);
  backBtnEl.addEventListener("click", showHome);
  sendEl.addEventListener("click", () => send());
  inputEl.addEventListener("keypress", (e) => { if (e.key === "Enter") send(); });

  // Attach click listeners to suggest chips
  document.querySelectorAll(`.${NS}-chip`).forEach(chip => {
    chip.addEventListener("click", () => {
      send(chip.textContent);
    });
  });

  // ─── 16. INIT ─────────────────────────────────────────────────────────────
  renderSessions();
})();
