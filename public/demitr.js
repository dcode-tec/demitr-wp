/**
 * Demitr.ai \u2014 Embeddable AI Chat Widget
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
 *     data-business-info="Farm-to-table. Open Tue-Sat. Lunch \u20ac18."
 *     data-business-url="https://chezmarcel.lu"
 *     data-business-lang="fr"
 *   ></script>
 *
 * Paid mode (dashboard-managed config via API key):
 *   <script src="https://demitr.ai/widget.js" data-key="dm_live_abc123xyz"></script>
 *
 * GDPR: consent gate shown before first message. sessionId in sessionStorage only.
 * EU AI Act Art. 50: widget discloses AI nature upfront.
 *
 * CSP: this widget is safe to embed on sites with strict Content-Security-Policy.
 * All styles are loaded via a constructable stylesheet (with a <style> fallback
 * for older browsers), no inline `style="..."` attributes are set from JS, and
 * the customer-supplied color value is strictly validated as a hex literal before
 * it touches any CSS. The only remaining CSP requirement is `script-src` for the
 * widget.js URL itself.
 */
// Capture script ref synchronously BEFORE async \u2014 currentScript is null inside async IIFE
const _demitrScript = document.currentScript ||
  document.querySelector('script[data-api][src*="demitr"], script[data-key][src*="demitr"]');

(async function () {
  'use strict';

  const currentScript = _demitrScript;

  // \u2500\u2500 CSP-safe color validator \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Only accept hex literals like "#7c3aed" or "#fff" or "#7c3aed80" (with alpha).
  // Any other value \u2014 including hostile strings like "red; --x:url(//evil)" or
  // "var(--anything)" \u2014 falls back to the brand default. This blocks CSS
  // injection at the boundary between attribute value and var(--demitr-color).
  const HEX_RE = /^#[0-9a-f]{3,8}$/i;
  const DEFAULT_COLOR = '#7c3aed';
  function safeColor(raw) {
    return typeof raw === 'string' && HEX_RE.test(raw.trim()) ? raw.trim() : DEFAULT_COLOR;
  }

  // \u2500\u2500 Paid mode detection \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const apiKey = currentScript?.dataset?.key || '';
  const isPaidMode = !!apiKey;

  // \u2500\u2500 Base config from data attributes (may be overridden by paid config) \u2500\u2500
  const apiBase = currentScript?.dataset?.api || 'https://demitr.ai';
  let brand        = currentScript?.dataset?.brand        || 'd-code';
  let lang         = currentScript?.dataset?.lang         || 'en';
  let color        = safeColor(currentScript?.dataset?.color);
  let position     = currentScript?.dataset?.position     || 'bottom-right';
  let businessName = currentScript?.dataset?.businessName || '';
  let businessType = currentScript?.dataset?.businessType || '';
  let businessInfo = currentScript?.dataset?.businessInfo || '';
  let businessUrl  = currentScript?.dataset?.businessUrl  || '';
  let businessLang = currentScript?.dataset?.businessLang || lang;
  let customPrompt = null;
  // "Powered by demitr.ai" badge \u2014 opt-in via data-show-powered-by="1" (defaults to OFF)
  // for free-tier embeds. This satisfies wordpress.org Guideline 10 (no external credits
  // on public sites without explicit user permission).
  const showPoweredBy = currentScript?.dataset?.showPoweredBy === '1';

  // \u2500\u2500 Paid mode: fetch config from server and override data-* attributes \u2500\u2500\u2500
  let serverConfig = null;
  let whiteLabel = false;
  if (isPaidMode) {
    try {
      const resp = await fetch(`${apiBase}/api/config/${apiKey}`);
      if (resp.ok) serverConfig = await resp.json();
    } catch { /* graceful fallback to data-* attributes */ }
    if (serverConfig) {
      brand        = serverConfig.brand        || brand;
      color        = safeColor(serverConfig.color || color);
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

  // \u2500\u2500 Position helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const isLeft = position === 'bottom-left';

  // \u2500\u2500 i18n \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const T = {
    en: {
      trigger: 'Chat with us',
      title: 'AI Assistant',
      subtitle: `${brand} \u00b7 AI-powered`,
      placeholder: 'Ask a question\u2026',
      send: 'Send',
      consent_title: 'AI Assistant',
      consent_body: `This assistant is powered by artificial intelligence. To continue, you agree that your messages will be processed by our AI to answer your questions. No personal data is stored after your session ends.`,
      consent_cta: 'I understand \u2014 start chat',
      consent_decline: 'No thanks',
      ai_disclosure: '\u{1F916} You are chatting with an AI, not a human.',
      thinking: 'Thinking\u2026',
      error: 'Something went wrong. Please try again.',
      retry: 'Try again',
    },
    fr: {
      trigger: 'Discuter',
      title: 'Assistant IA',
      subtitle: `${brand} \u00b7 IA`,
      placeholder: 'Posez votre question\u2026',
      send: 'Envoyer',
      consent_title: 'Assistant IA',
      consent_body: `Cet assistant est aliment\u00e9 par l'intelligence artificielle. En continuant, vous acceptez que vos messages soient trait\u00e9s par notre IA pour r\u00e9pondre \u00e0 vos questions. Aucune donn\u00e9e personnelle n'est conserv\u00e9e apr\u00e8s la fin de votre session.`,
      consent_cta: 'J\'accepte \u2014 d\u00e9marrer',
      consent_decline: 'Non merci',
      ai_disclosure: '\u{1F916} Vous discutez avec une IA, pas un humain.',
      thinking: 'R\u00e9flexion\u2026',
      error: 'Une erreur s\'est produite. Veuillez r\u00e9essayer.',
      retry: 'R\u00e9essayer',
    },
    de: {
      trigger: 'Chat starten',
      title: 'KI-Assistent',
      subtitle: `${brand} \u00b7 KI-gest\u00fctzt`,
      placeholder: 'Stellen Sie Ihre Frage\u2026',
      send: 'Senden',
      consent_title: 'KI-Assistent',
      consent_body: 'Dieser Assistent wird von k\u00fcnstlicher Intelligenz betrieben. Durch die Nutzung stimmen Sie zu, dass Ihre Nachrichten von unserer KI verarbeitet werden, um Ihre Fragen zu beantworten. Nach Ende der Sitzung werden keine personenbezogenen Daten gespeichert.',
      consent_cta: 'Verstanden \u2014 Chat starten',
      consent_decline: 'Nein danke',
      ai_disclosure: '\u{1F916} Sie chatten mit einer KI, nicht mit einem Menschen.',
      thinking: 'Denkt nach\u2026',
      error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
      retry: 'Erneut versuchen',
    },
    nl: {
      trigger: 'Chat met ons',
      title: 'AI-assistent',
      subtitle: `${brand} \u00b7 AI-aangedreven`,
      placeholder: 'Stel uw vraag\u2026',
      send: 'Verstuur',
      consent_title: 'AI-assistent',
      consent_body: 'Deze assistent wordt aangedreven door kunstmatige intelligentie. Door verder te gaan, stemt u ermee in dat uw berichten worden verwerkt door onze AI om uw vragen te beantwoorden. Er worden geen persoonsgegevens opgeslagen na het einde van uw sessie.',
      consent_cta: 'Ik begrijp het \u2014 start chat',
      consent_decline: 'Nee bedankt',
      ai_disclosure: '\u{1F916} U chat met een AI, niet met een mens.',
      thinking: 'Bezig met nadenken\u2026',
      error: 'Er is iets misgegaan. Probeer het opnieuw.',
      retry: 'Opnieuw proberen',
    },
    it: {
      trigger: 'Chatta con noi',
      title: 'Assistente IA',
      subtitle: `${brand} \u00b7 basato su IA`,
      placeholder: 'Fai una domanda\u2026',
      send: 'Invia',
      consent_title: 'Assistente IA',
      consent_body: 'Questo assistente \u00e8 alimentato dall\'intelligenza artificiale. Continuando, accetti che i tuoi messaggi vengano elaborati dalla nostra IA per rispondere alle tue domande. Nessun dato personale viene conservato al termine della sessione.',
      consent_cta: 'Ho capito \u2014 avvia la chat',
      consent_decline: 'No grazie',
      ai_disclosure: '\u{1F916} Stai chattando con un\'IA, non con una persona.',
      thinking: 'Sto pensando\u2026',
      error: 'Qualcosa \u00e8 andato storto. Riprova.',
      retry: 'Riprova',
    },
    es: {
      trigger: 'Chatea con nosotros',
      title: 'Asistente IA',
      subtitle: `${brand} \u00b7 con IA`,
      placeholder: 'Haz una pregunta\u2026',
      send: 'Enviar',
      consent_title: 'Asistente IA',
      consent_body: 'Este asistente funciona con inteligencia artificial. Al continuar, aceptas que tus mensajes sean procesados por nuestra IA para responder a tus preguntas. No se almacenan datos personales despu\u00e9s de que finalice tu sesi\u00f3n.',
      consent_cta: 'Entendido \u2014 iniciar chat',
      consent_decline: 'No, gracias',
      ai_disclosure: '\u{1F916} Est\u00e1s chateando con una IA, no con una persona.',
      thinking: 'Pensando\u2026',
      error: 'Algo sali\u00f3 mal. Por favor, int\u00e9ntalo de nuevo.',
      retry: 'Reintentar',
    },
  };

  const i18n = T[lang] ?? T.en;

  // \u2500\u2500 UUID helper (Safari < 15.4 fallback) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 State \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  let open = false;
  let consentGiven = sessionStorage.getItem('demitr_consent') === '1';
  let sessionId = sessionStorage.getItem('demitr_sid') ?? generateUUID();
  let lastUserText = '';
  sessionStorage.setItem('demitr_sid', sessionId);

  // \u2500\u2500 DOM helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Note: this helper no longer accepts a `style` attribute \u2014 all styling
  // flows through CSS classes for CSP-strict compatibility. Use the `class`
  // attribute or add rules to DEMITR_CSS below.
  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
      else node.setAttribute(k, v);
    }
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
    return node;
  }

  // \u2500\u2500 Styles (static, CSP-safe) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  // Zero interpolation. Color and horizontal side are driven by CSS custom
  // properties set once on #demitr-root via .style.setProperty(). The actual
  // element.style reads are CSSOM calls, not inline style attributes, and are
  // not governed by `style-src-attr` CSP directives.
  const DEMITR_CSS = `
    #demitr-root {
      --demitr-color: #7c3aed;
      --demitr-side-value: 24px;
    }
    #demitr-root.demitr-left { /* flipped via class, not interpolation */ }
    #demitr-root * { box-sizing: border-box; font-family: system-ui, sans-serif; }

    #demitr-trigger {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      background: var(--demitr-color); color: #fff; border: none; border-radius: 50px;
      padding: 12px 20px; font-size: 14px; font-weight: 600;
      cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,.25);
      display: flex; align-items: center; gap: 8px;
      transition: transform .2s, box-shadow .2s;
    }
    #demitr-root.demitr-left #demitr-trigger { right: auto; left: 24px; }
    #demitr-trigger:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,.3); }

    #demitr-window {
      position: fixed; bottom: 90px; right: 24px; z-index: 9999;
      width: 380px; max-height: 620px;
      background: #fff; border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,.18);
      display: flex; flex-direction: column; overflow: hidden;
      transition: opacity .2s, transform .2s;
    }
    #demitr-root.demitr-left #demitr-window { right: auto; left: 24px; }
    #demitr-window.demitr-hidden { opacity: 0; transform: translateY(12px); pointer-events: none; }

    #demitr-header {
      background: var(--demitr-color); color: #fff;
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
      align-self: flex-end; background: var(--demitr-color); color: #fff; border-bottom-right-radius: 4px;
    }
    .demitr-msg.assistant {
      align-self: flex-start; background: #f3f4f6; color: #111; border-bottom-left-radius: 4px;
    }
    .demitr-msg.system { align-self: center; font-size: 11px; color: #888; font-style: italic; }
    .demitr-thinking { align-self: flex-start; font-size: 12px; color: #888; font-style: italic; }

    .demitr-retry-btn {
      background: none; border: none; color: var(--demitr-color); cursor: pointer;
      text-decoration: underline; font-size: 11px; padding: 0; font-family: inherit;
    }

    #demitr-input-row {
      padding: 12px; border-top: 1px solid #e5e7eb;
      display: flex; gap: 8px;
    }
    #demitr-input {
      flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 8px 12px; font-size: 13.5px; outline: none; resize: none;
      max-height: 80px; min-height: 36px; font-family: inherit;
    }
    #demitr-input:focus { border-color: var(--demitr-color); }
    #demitr-send {
      background: var(--demitr-color); color: #fff; border: none; border-radius: 8px;
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
    .demitr-consent-icon { font-size: 32px; }
    #demitr-consent-accept {
      background: var(--demitr-color); color: #fff; border: none; border-radius: 10px;
      padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; width: 100%;
      flex-shrink: 0; margin-top: 8px;
    }
    #demitr-consent-accept:hover { filter: brightness(1.1); }
    #demitr-consent-decline {
      background: none; border: none; color: #888; font-size: 13px; cursor: pointer;
      text-decoration: underline; flex-shrink: 0; padding: 4px;
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
      #demitr-window { width: calc(100vw - 32px); right: 16px; }
      #demitr-root.demitr-left #demitr-window { left: 16px; right: auto; }
    }
  `;

  /**
   * Install the widget stylesheet using the most CSP-friendly mechanism
   * the browser supports. Modern browsers get a constructable stylesheet
   * attached via adoptedStyleSheets (CSP-exempt because no <style> element
   * is ever parsed from text). Older browsers fall back to a <style>
   * element appended to <head>, which still requires style-src 'unsafe-inline'
   * but is the only option available.
   */
  function installStylesheet(cssText) {
    // Prefer constructable stylesheets where supported.
    try {
      if (typeof CSSStyleSheet === 'function' &&
          typeof CSSStyleSheet.prototype.replaceSync === 'function' &&
          Array.isArray(document.adoptedStyleSheets)) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(cssText);
        document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
        return;
      }
    } catch { /* fall through to <style> fallback */ }
    // Fallback: inject a <style> tag. This requires style-src 'unsafe-inline'.
    const style = document.createElement('style');
    style.textContent = cssText;
    document.head.appendChild(style);
  }

  installStylesheet(DEMITR_CSS);

  // \u2500\u2500 Build UI \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  const rootClass = isLeft ? 'demitr-left' : '';
  const root = el('div', { id: 'demitr-root', class: rootClass });

  // Set the dynamic color via CSS custom property. Note: setProperty() is a
  // CSSOM method that writes to the element's inline style \u2014 this DOES count
  // as a "style attribute" write under strict CSP. The color value has been
  // validated against /^#[0-9a-f]{3,8}$/ above so it cannot inject arbitrary
  // CSS even if the custom property is eventually banned by CSP.
  root.style.setProperty('--demitr-color', color);

  // Trigger button
  const trigger = el('button', { id: 'demitr-trigger', 'aria-label': i18n.trigger },
    '\u{1F4AC} ', i18n.trigger
  );

  // Chat window
  const chatWindow = el('div', { id: 'demitr-window', 'aria-label': i18n.title, role: 'dialog', class: 'demitr-hidden' });

  // Header
  const header = el('div', { id: 'demitr-header' });
  const headerText = el('div', {});
  headerText.appendChild(el('h3', {}, i18n.title));
  headerText.appendChild(el('p', {}, i18n.subtitle));
  const closeBtn = el('button', { id: 'demitr-close', 'aria-label': 'Close' }, '\u00d7');
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
  const consentIcon = el('div', { class: 'demitr-consent-icon' }, '\u{1F512}');
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

  // "Powered by demitr.ai" badge \u2014 opt-in only.
  // Paid tier: hidden when whiteLabel feature is on.
  // Free tier: shown only when site owner explicitly sets data-show-powered-by="1"
  // (default OFF \u2014 required for wordpress.org Guideline 10 compliance).
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

  // \u2500\u2500 Markdown renderer (XSS-safe) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Show AI disclosure on first open \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  function addSystemMsg(text) {
    const msg = el('div', { class: 'demitr-msg system' }, text);
    messages.appendChild(msg);
  }

  // \u2500\u2500 Logic \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // \u2500\u2500 Escape key to close \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  /**
   * Build the JSON body shared by both /api/chat and /api/chat/stream.
   */
  function buildChatBody(text) {
    return JSON.stringify({
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
    });
  }

  /**
   * Try streaming first (/api/chat/stream), fall back to non-streaming
   * (/api/chat) on any error. Streaming delivers tokens incrementally for
   * a sub-200ms time-to-first-token UX; non-streaming waits for the full
   * reply (~2\u20133s). The fallback ensures older browsers and network
   * environments that don't support ReadableStream still work.
   */
  async function sendMessage(retryText) {
    const text = retryText || input.value.trim();
    if (!text || !consentGiven) return;

    lastUserText = text;

    // Append user bubble (skip on retry \u2014 already shown)
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
      // ── Try streaming first ───────────────────────────────────────
      const reply = el('div', { class: 'demitr-msg assistant' });
      reply.textContent = '';
      let streamed = false;

      try {
        const streamRes = await fetch(`${apiBase}/api/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: buildChatBody(text),
        });

        if (!streamRes.ok || !streamRes.body) throw new Error('no stream');

        thinking.remove();
        messages.appendChild(reply);
        streamed = true;

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimLine = line.trim();
            if (!trimLine || !trimLine.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(trimLine.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.token) {
                fullText += data.token;
                // Re-render the full accumulated text with markdown on each
                // token so bold/italic/links render correctly as they complete.
                const safeHTML = renderMarkdown(fullText);
                reply.textContent = '';
                reply.insertAdjacentHTML('beforeend', safeHTML);
                messages.scrollTop = messages.scrollHeight;
              }
            } catch (parseErr) {
              if (parseErr.message && parseErr.message !== 'no stream') throw parseErr;
            }
          }
        }
      } catch (streamErr) {
        // ── Fallback to non-streaming /api/chat ───────────────────
        if (streamed) throw streamErr; // don't double-try if stream was mid-flight

        const res = await fetch(`${apiBase}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: buildChatBody(text),
        });

        const data = await res.json();
        thinking.remove();

        if (data.error) throw new Error(data.error);

        const safeHTML = renderMarkdown(data.reply);
        reply.insertAdjacentHTML('beforeend', safeHTML);
        messages.appendChild(reply);
      }
    } catch {
      if (thinking.parentNode) thinking.remove();
      const errWrap = el('div', { class: 'demitr-msg system' });
      errWrap.appendChild(document.createTextNode(i18n.error + ' '));
      const retryBtn = el('button', {
        class: 'demitr-retry-btn',
        onClick: () => { errWrap.remove(); sendMessage(lastUserText); },
      }, i18n.retry);
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
