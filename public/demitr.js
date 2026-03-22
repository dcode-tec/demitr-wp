/**
 * Demitr.ai — Embeddable AI Chat Widget
 *
 * Usage (add before </body>):
 *   <script src="https://demitr.ai/widget.js"
 *     data-api="https://your-hetzner-vps/api/chat"
 *     data-brand="d-code"
 *     data-lang="en"
 *     data-color="#7c3aed"
 *   ></script>
 *
 * GDPR: consent gate shown before first message. sessionId stored in sessionStorage only.
 * EU AI Act Art. 50: widget discloses AI nature upfront.
 */
(function () {
  'use strict';

  // ── Config from data attributes ──────────────────────────────────────────
  const script = document.currentScript;
  const API_URL = script.dataset.api ?? 'http://localhost:3100/api/chat';
  const BRAND = script.dataset.brand ?? 'd-code';
  const LANG = script.dataset.lang ?? 'en';
  const COLOR = script.dataset.color ?? '#7c3aed';

  const T = {
    en: {
      trigger: 'Chat with us',
      title: 'AI Assistant',
      subtitle: `${BRAND} · AI-powered`,
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
      subtitle: `${BRAND} · IA`,
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

  const i18n = T[LANG] ?? T.en;

  // ── State ────────────────────────────────────────────────────────────────
  let open = false;
  let consentGiven = sessionStorage.getItem('demitr_consent') === '1';
  let sessionId = sessionStorage.getItem('demitr_sid') ?? crypto.randomUUID();
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
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      background: ${COLOR}; color: #fff; border: none; border-radius: 50px;
      padding: 12px 20px; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      display: flex; align-items: center; gap: 8px;
      transition: transform .2s, box-shadow .2s;
    }
    #demitr-trigger:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,.3); }
    #demitr-window {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 360px; max-height: 560px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity .2s, transform .2s;
    }
    #demitr-window.demitr-hidden { opacity: 0; transform: translateY(12px); pointer-events: none; }
    #demitr-header {
      background: ${COLOR}; color: #fff;
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
      align-self: flex-end; background: ${COLOR}; color: #fff; border-bottom-right-radius: 4px;
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
    #demitr-input:focus { border-color: ${COLOR}; }
    #demitr-send {
      background: ${COLOR}; color: #fff; border: none; border-radius: 8px;
      padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    #demitr-send:disabled { opacity: .5; cursor: not-allowed; }
    /* Consent overlay */
    #demitr-consent {
      position: absolute; inset: 0; background: #fff; z-index: 10;
      display: flex; flex-direction: column; justify-content: center; align-items: center;
      padding: 28px; text-align: center; gap: 16px;
    }
    #demitr-consent h4 { margin: 0; font-size: 17px; font-weight: 700; color: #111; }
    #demitr-consent p { margin: 0; font-size: 13px; color: #555; line-height: 1.6; }
    #demitr-consent-accept {
      background: ${COLOR}; color: #fff; border: none; border-radius: 8px;
      padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; width: 100%;
    }
    #demitr-consent-decline {
      background: none; border: none; color: #888; font-size: 12px; cursor: pointer; text-decoration: underline;
    }
    @media (max-width: 400px) {
      #demitr-window { width: calc(100vw - 32px); right: 16px; }
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
  if (!consentGiven) chatWindow.appendChild(consent);

  root.appendChild(trigger);
  root.appendChild(chatWindow);
  document.body.appendChild(root);

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

  consentAccept.addEventListener('click', () => {
    consentGiven = true;
    sessionStorage.setItem('demitr_consent', '1');
    consent.remove();
    addSystemMsg(i18n.ai_disclosure);
    input.focus();
  });

  consentDecline.addEventListener('click', toggleWindow);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || !consentGiven) return;

    // Append user bubble
    const userMsg = el('div', { class: 'demitr-msg user' }, text);
    messages.appendChild(userMsg);
    input.value = '';
    sendBtn.disabled = true;
    messages.scrollTop = messages.scrollHeight;

    // Thinking indicator
    const thinking = el('div', { class: 'demitr-thinking' }, i18n.thinking);
    messages.appendChild(thinking);
    messages.scrollTop = messages.scrollHeight;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, consentGiven: true }),
      });

      const data = await res.json();
      thinking.remove();

      if (data.error) throw new Error(data.error);

      const reply = el('div', { class: 'demitr-msg assistant' }, data.reply);
      messages.appendChild(reply);
    } catch {
      thinking.remove();
      const errMsg = el('div', { class: 'demitr-msg system' }, i18n.error);
      messages.appendChild(errMsg);
    } finally {
      sendBtn.disabled = false;
      messages.scrollTop = messages.scrollHeight;
    }
  }

  sendBtn.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();
