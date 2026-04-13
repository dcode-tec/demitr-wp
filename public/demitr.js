/**
 * Demitr.ai — Embeddable AI Chat Widget
 *
 * Free mode (data-* attributes, no account):
 *   <script src="https://demitr.ai/widget.js"
 *     data-api="https://demitr.ai"
 *     data-brand="d-code"
 *     data-lang="en"
 *     data-color="#7c3aed"
 *     data-position="bottom-right"
 *     data-business-name="Chez Marcel"
 *     data-business-type="French restaurant in Luxembourg City"
 *     data-business-info="Farm-to-table. Open Tue-Sat. Lunch €18."
 *     data-business-url="https://chezmarcel.lu"
 *     data-business-lang="fr"
 *   ></script>
 *
 * Paid mode (dashboard-managed config via API key):
 *   <script src="https://demitr.ai/widget.js" data-key="dm_live_abc123xyz"></script>
 *
 * GDPR: consent gate shown before first message. sessionId stored in sessionStorage only.
 * EU AI Act Art. 50: widget discloses AI nature upfront.
 */
// Capture script ref synchronously BEFORE async — currentScript is null inside async IIFE
const _demitrScript = document.currentScript ||
  document.querySelector('script[data-api][src*="demitr"], script[data-key][src*="demitr"]');

(async function () {
  'use strict';

  const currentScript = _demitrScript;

  // ── Paid mode detection ───────────────────────────────────────────────────
  const apiKey = currentScript?.dataset?.key || '';
  const isPaidMode = !!apiKey;

  // ── Base config from data attributes (may be overridden by paid config) ──
  const apiBase = currentScript?.dataset?.api || 'https://demitr.ai';
  let brand        = currentScript?.dataset?.brand        || 'd-code';
  let lang         = currentScript?.dataset?.lang         || 'en';
  let color        = currentScript?.dataset?.color        || '#7c3aed';
  let position     = currentScript?.dataset?.position     || 'bottom-right';
  let businessName = currentScript?.dataset?.businessName || '';
  let businessType = currentScript?.dataset?.businessType || '';
  let businessInfo = currentScript?.dataset?.businessInfo || '';
  let businessUrl  = currentScript?.dataset?.businessUrl  || '';
  let businessLang = currentScript?.dataset?.businessLang || lang;
  let customPrompt = null;
  // "Powered by demitr.ai" badge — opt-in via data-show-powered-by="1" (defaults to OFF)
  // for free-tier embeds. This satisfies wordpress.org Guideline 10 (no external credits
  // on public sites without explicit user permission).
  const showPoweredBy = currentScript?.dataset?.showPoweredBy === '1';

  // ── Paid mode: fetch config from server and override data-* attributes ───
  let serverConfig = null;
  let whiteLabel = false;
  if (isPaidMode) {
    try {
      const resp = await fetch(`${apiBase}/api/config/${apiKey}`);
      if (resp.ok) serverConfig = await resp.json();
    } catch { /* graceful fallback to data-* attributes */ }
    if (serverConfig) {
      brand        = serverConfig.brand        || brand;
      color        = serverConfig.color        || color;
      lang         = serverConfig.lang         || lang;
      position     = serverConfig.position     || position;
      businessName = serverConfig.businessName || businessName;
      businessType = serverConfig.businessType || businessType;
      businessInfo = serverConfig.businessInfo || businessInfo;
      businessUrl  = serverConfig.businessUrl  || businessUrl;
      businessLang = serverConfig.businessLang || businessLang;
      customPrompt = serverConfig.systemPrompt || null;
      whiteLabel   = serverConfig.features?.white_label === true;
    }
  }

  // ── Position helpers ──────────────────────────────────────────────────────
  const isLeft = position === 'bottom-left';
  const hSide  = isLeft ? 'left' : 'right';

  // ── i18n ─────────────────────────────────────────────────────────────────
  const T = {
    en: {
      trigger: 'Chat with us',
      title: 'AI Assistant',
      subtitle: `${brand} · AI-powered`,
      placeholder: 'Ask a question…',
      send: 'Send',
      consent_title: 'AI Assistant',
      consent_body: `This assistant is powered by artificial intelligence. To continue, you agree that your messages will be processed by our AI to answer your questions. No personal data is stored after your session ends.`,
      consent_cta: 'I understand — start chat',
      consent_decline: 'No thanks',
      ai_disclosure: '🤖 You are chatting with an AI, not a human.',
      thinking: 'Thinking…',
      error: 'Something went wrong. Please try again.',
    },
    fr: {
      trigger: 'Discuter',
      title: 'Assistant IA',
      subtitle: `${brand} · IA`,
      placeholder: 'Posez votre question…',
      send: 'Envoyer',
      consent_title: 'Assistant IA',
      consent_body: `Cet assistant est alimenté par l'intelligence artificielle. En continuant, vous acceptez que vos messages soient traités par notre IA pour répondre à vos questions. Aucune donnée personnelle n'est conservée après la fin de votre session.`,
      consent_cta: 'J\'accepte — démarrer',
      consent_decline: 'Non merci',
      ai_disclosure: '🤖 Vous discutez avec une IA, pas un humain.',
      thinking: 'Réflexion…',
      error: 'Une erreur s\'est produite. Veuillez réessayer.',
    },
  };

  const i18n = T[lang] ?? T.en;

  // ── UUID helper (Safari < 15.4 fallback) ─────────────────────────────────
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Manual v4 UUID fallback
    const bytes = new Uint8Array(16);
    (crypto || window.crypto || window.msCrypto).getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }

  // ── State ────────────────────────────────────────────────────────────────
  let open = false;
  let consentGiven = sessionStorage.getItem('demitr_consent') === '1';
  let sessionId = sessionStorage.getItem('demitr_sid') ?? generateUUID();
  let lastUserText = '';
  sessionStorage.setItem('demitr_sid', sessionId);

  // ── DOM helpers ──────────────────────────────────────────────────────────
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'style' && typeof v === 'object') Object.assign(node.style, v);
      else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  // ── Styles ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #demitr-root * { box-sizing: border-box; font-family: system-ui, sans-serif; }
    #demitr-trigger {
      position: fixed; bottom: 24px; ${hSide}: 24px; z-index: 9998;
      background: ${color}; color: #fff; border: none; border-radius: 50px;
      padding: 12px 20px; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      display: flex; align-items: center; gap: 8px;
      transition: transform .2s, box-shadow .2s;
    }
    #demitr-trigger:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,.3); }
    #demitr-window {
      position: fixed; bottom: 90px; ${hSide}: 24px; z-index: 9999;
      width: 380px; max-height: 620px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity .2s, transform .2s;
    }
    #demitr-window.demitr-hidden { opacity: 0; transform: translateY(12px); pointer-events: none; }
    #demitr-header {
      background: ${color}; color: #fff;
      padding: 14px 16px; display: flex; justify-content: space-between; align-items: center;
    }
    #demitr-header h3 { margin: 0; font-size: 15px; font-weight: 700; }
    #demitr-header p { margin: 2px 0 0; font-size: 11px; opacity: .8; }
    #demitr-close {
      background: none; border: none; color: #fff; font-size: 20px;
      cursor: pointer; line-height: 1; padding: 0 4px;
    }
    #demitr-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .demitr-msg {
      max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; line-height: 1.5;
    }
    .demitr-msg.user {
      align-self: flex-end; background: ${color}; color: #fff; border-bottom-right-radius: 4px;
    }
    .demitr-msg.assistant {
      align-self: flex-start; background: #f3f4f6; color: #111; border-bottom-left-radius: 4px;
    }
    .demitr-msg.system { align-self: center; font-size: 11px; color: #888; font-style: italic; }
    .demitr-thinking { align-self: flex-start; font-size: 12px; color: #888; font-style: italic; }
    #demitr-input-row {
      padding: 12px; border-top: 1px solid #e5e7eb;
      display: flex; gap: 8px;
    }
    #demitr-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 8px 12px; font-size: 13.5px; outline: none; resize: none;
      max-height: 80px; min-height: 36px;
    }
    #demitr-input:focus { border-color: ${color}; }
    #demitr-send {
      background: ${color}; color: #fff; border: none; border-radius: 8px;
      padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    #demitr-send:disabled { opacity: .5; cursor: not-allowed; }
    /* Consent overlay */
    #demitr-consent {
      position: absolute; inset: 0; background: #fff; z-index: 10;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: 32px 24px; text-align: center; gap: 16px; overflow-y: auto;
    }
    #demitr-consent h4 { margin: 0; font-size: 18px; font-weight: 700; color: #111; }
    #demitr-consent p { margin: 0; font-size: 13.5px; color: #555; line-height: 1.6; }
    #demitr-consent-accept {
      background: ${color}; color: #fff; border: none; border-radius: 10px;
      padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%;
      flex-shrink: 0; margin-top: 8px;
    }
    #demitr-consent-accept:hover { filter: brightness(1.1); }
    #demitr-consent-decline {
      background: none; border: none; color: #888; font-size: 13px; cursor: pointer; text-decoration: underline;
      flex-shrink: 0; padding: 4px;
    }
    #demitr-powered {
      text-align: center; padding: 6px 12px; font-size: 10px; color: #94a3b8;
      border-top: 1px solid #f1f5f9; background: #fafafa;
      border-radius: 0 0 16px 16px;
    }
    #demitr-powered a {
      color: #7c3aed; text-decoration: none; font-weight: 600;
    }
    #demitr-powered a:hover { text-decoration: underline; }
    @media (max-width: 400px) {
      #demitr-window { width: calc(100vw - 32px); ${hSide}: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── Build UI ─────────────────────────────────────────────────────────────
  const root = el('div', { id: 'demitr-root' });

  // Trigger button
  const trigger = el('button', { id: 'demitr-trigger', 'aria-label': i18n.trigger },
    '💬 ', i18n.trigger
  );

  // Chat window
  const chatWindow = el('div', { id: 'demitr-window', 'aria-label': i18n.title, role: 'dialog', class: 'demitr-hidden' });

  // Header
  const header = el('div', { id: 'demitr-header' });
  const headerText = el('div', {});
  headerText.appendChild(el('h3', {}, i18n.title));
  headerText.appendChild(el('p', {}, i18n.subtitle));
  const closeBtn = el('button', { id: 'demitr-close', 'aria-label': 'Close' }, '×');
  header.appendChild(headerText);
  header.appendChild(closeBtn);

  // Messages
  const messages = el('div', { id: 'demitr-messages', 'aria-live': 'polite' });

  // Input row
  const inputRow = el('div', { id: 'demitr-input-row' });
  const input = el('textarea', { id: 'demitr-input', placeholder: i18n.placeholder, rows: '1', 'aria-label': i18n.placeholder });
  const sendBtn = el('button', { id: 'demitr-send' }, i18n.send);
  inputRow.appendChild(input);
  inputRow.appendChild(sendBtn);

  // Consent overlay
  const consent = el('div', { id: 'demitr-consent' });
  const consentIcon = el('div', {}, '🔒');
  consentIcon.style.fontSize = '32px';
  const consentTitle = el('h4', {}, i18n.consent_title);
  const consentBody = el('p', {}, i18n.consent_body);
  const consentAccept = el('button', { id: 'demitr-consent-accept' }, i18n.consent_cta);
  const consentDecline = el('button', { id: 'demitr-consent-decline' }, i18n.consent_decline);
  consent.appendChild(consentIcon);
  consent.appendChild(consentTitle);
  consent.appendChild(consentBody);
  consent.appendChild(consentAccept);
  consent.appendChild(consentDecline);

  chatWindow.appendChild(header);
  chatWindow.appendChild(messages);
  chatWindow.appendChild(inputRow);

  // "Powered by demitr.ai" badge — opt-in only.
  // Paid tier: hidden when whiteLabel feature is on.
  // Free tier: shown only when site owner explicitly sets data-show-powered-by="1"
  // (default OFF — required for wordpress.org Guideline 10 compliance).
  const shouldShowBadge = isPaidMode ? !whiteLabel : showPoweredBy;
  if (shouldShowBadge) {
    const powered = el('div', { id: 'demitr-powered' });
    const link = el('a', { href: 'https://demitr.ai', target: '_blank', rel: 'noopener' }, 'demitr.ai');
    powered.appendChild(document.createTextNode('Powered by '));
    powered.appendChild(link);
    chatWindow.appendChild(powered);
  }

  if (!consentGiven) chatWindow.appendChild(consent);

  root.appendChild(trigger);
  root.appendChild(chatWindow);
  document.body.appendChild(root);

  // ── Markdown renderer (XSS-safe) ─────────────────────────────────────────
  function renderMarkdown(text) {
    // Escape HTML first to prevent XSS
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    // Apply markdown transforms
    return escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\n/g, '<br>');
  }

  // ── Show AI disclosure on first open ─────────────────────────────────────
  function addSystemMsg(text) {
    const msg = el('div', { class: 'demitr-msg system' }, text);
    messages.appendChild(msg);
  }

  // ── Logic ─────────────────────────────────────────────────────────────────
  function toggleWindow() {
    open = !open;
    chatWindow.classList.toggle('demitr-hidden', !open);
    if (open && messages.children.length === 0 && consentGiven) {
      addSystemMsg(i18n.ai_disclosure);
    }
    if (open) input.focus();
  }

  trigger.addEventListener('click', toggleWindow);
  closeBtn.addEventListener('click', toggleWindow);

  // ── Escape key to close ─────────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) toggleWindow();
  });

  consentAccept.addEventListener('click', () => {
    consentGiven = true;
    sessionStorage.setItem('demitr_consent', '1');
    consent.remove();
    addSystemMsg(i18n.ai_disclosure);
    input.focus();
  });

  consentDecline.addEventListener('click', toggleWindow);

  async function sendMessage(retryText) {
    const text = retryText || input.value.trim();
    if (!text || !consentGiven) return;

    lastUserText = text;

    // Append user bubble (skip on retry — already shown)
    if (!retryText) {
      const userMsg = el('div', { class: 'demitr-msg user' }, text);
      messages.appendChild(userMsg);
      input.value = '';
    }

    sendBtn.disabled = true;
    messages.setAttribute('aria-busy', 'true');
    messages.scrollTop = messages.scrollHeight;

    // Thinking indicator
    const thinking = el('div', { class: 'demitr-thinking' }, i18n.thinking);
    messages.appendChild(thinking);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(`${apiBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: text,
          consentGiven: true,
          ...(isPaidMode ? { apiKey } : {
            businessName: serverConfig?.businessName || businessName,
            businessType: serverConfig?.businessType || businessType,
            businessInfo: serverConfig?.businessInfo || businessInfo,
            businessUrl:  serverConfig?.businessUrl  || businessUrl,
            businessLang: serverConfig?.businessLang || businessLang,
          }),
        }),
      });

      const data = await res.json();
      thinking.remove();

      if (data.error) throw new Error(data.error);

      // Render markdown in assistant reply (HTML-escaped first to prevent XSS)
      const reply = el('div', { class: 'demitr-msg assistant' });
      reply.textContent = ''; // safe baseline
      const safeHTML = renderMarkdown(data.reply);
      reply.insertAdjacentHTML('beforeend', safeHTML);
      messages.appendChild(reply);
    } catch {
      thinking.remove();
      const errWrap = el('div', { class: 'demitr-msg system' });
      errWrap.appendChild(document.createTextNode(i18n.error + ' '));
      const retryBtn = el('button', {
        style: {
          background: 'none', border: 'none', color: color, cursor: 'pointer',
          textDecoration: 'underline', fontSize: '11px', padding: '0',
        },
        onClick: () => { errWrap.remove(); sendMessage(lastUserText); },
      }, lang === 'fr' ? 'Réessayer' : 'Try again');
      errWrap.appendChild(retryBtn);
      messages.appendChild(errWrap);
    } finally {
      sendBtn.disabled = false;
      messages.removeAttribute('aria-busy');
      messages.scrollTop = messages.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', () => sendMessage());

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
