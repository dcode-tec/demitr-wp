=== Demitr ===
Contributors: dcodetechnologies
Tags: chatbot, ai, gdpr, chat widget, live chat
Requires at least: 6.4
Tested up to: 6.9
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add a GDPR-compliant AI chat widget to your site. Answers visitor questions about your business 24/7.

== Description ==

Demitr adds an AI chat widget to your WordPress site. The AI answers visitor questions about your business — hours, services, prices, location — because you tell it what to say.

= Why Demitr? =

* **Knows your business** — Enter your details once, the AI handles the rest
* **GDPR by design** — Consent gate, no cookies, no persistent storage, PII anonymization
* **EU-sovereign AI** — Powered by Mistral (Paris). Hosted on Hetzner (Germany). Data stays in the EU
* **30-second setup** — Install, enter your info, enable. Done
* **Bilingual** — English and French. AI responds in the visitor's language
* **Customizable** — Brand name, accent color, position, language

= Two Modes =

**Free mode:** Configure business details in WordPress admin. The AI uses them to answer questions.

**Paid mode:** Enter your API key from [demitr.ai](https://demitr.ai). Widget config is managed from the dashboard.

= External Service =

This plugin sends chat messages to the Demitr API for AI processing. You configure the endpoint in Settings > Demitr Chat.

* **Default endpoint:** [demitr.ai](https://demitr.ai)
* **Provider:** dcode technologies S.a r.l., Luxembourg
* **Terms of Service:** [demitr.ai/terms](https://demitr.ai/terms)
* **Privacy Policy:** [demitr.ai/privacy](https://demitr.ai/privacy)

**Data sent:** visitor message (PII tokenized), session ID (random UUID), business context, consent flag.
**Data NOT sent:** IP address, cookies, personal identifiers, browsing history.

You can self-host the API for full data control. See [GitHub](https://github.com/dcode-tec/demitr.ai).

== Installation ==

1. Upload the plugin to `/wp-content/plugins/demitr/` or install via Plugins > Add New
1. Activate the plugin
1. Go to Settings > Demitr Chat
1. Enter your API endpoint URL (or use the default demitr.ai)
1. Fill in your business name, type, hours, and services
1. Check "Enable Widget" and save

== Frequently Asked Questions ==

= Is it GDPR compliant? =

Yes. Explicit consent gate before any processing. No cookies. No persistent storage. PII anonymized. EU-only infrastructure.

= Does it use cookies? =

No. SessionStorage only — cleared when the tab closes.

= What AI model is used? =

Mistral Small by Mistral AI (Paris, France). EU-sovereign — no international data transfers.

= Can I self-host the API? =

Yes. The API is open source on GitHub. Run it on your own server for full control.

= Does it work with caching plugins? =

Yes. The widget runs client-side. Compatible with all caching plugins.

== Screenshots ==

1. Settings page with business card configuration
2. Chat widget on a live website
3. GDPR consent gate before first message
4. Compliance checklist in admin

== Changelog ==

= 1.0.0 =
* Initial release
* AI chat widget powered by Mistral (EU-sovereign)
* GDPR consent gate (Art. 6) and AI disclosure (EU AI Act Art. 50)
* PII anonymization (email and phone tokenization)
* Business Card mode with 5 context fields
* Paid mode with API key from demitr.ai dashboard
* WordPress color picker for accent color
* Bilingual (English and French)
* Widget position setting
* Clean uninstall

== Upgrade Notice ==

= 1.0.0 =
First release. Install, add your business info, enable the widget.
