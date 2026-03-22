<?php
/**
 * Demitr — GDPR-Compliant AI Chat Widget
 *
 * @package    DemitrWP
 * @author     dcode technologies <dev@d-code.lu>
 * @copyright  2026 dcode technologies S.à r.l.
 * @license    GPL-2.0-or-later
 *
 * @wordpress-plugin
 * Plugin Name:       Demitr — AI Chat Widget
 * Plugin URI:        https://demitr.ai
 * Description:       GDPR-compliant AI chat widget powered by Mistral (EU-sovereign). One-click setup, consent gate included, no personal data retained.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      7.4
 * Author:            dcode technologies
 * Author URI:        https://d-code.lu
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       demitr
 * Domain Path:       /languages
 */

defined( 'ABSPATH' ) || exit;

define( 'DEMITR_VERSION', '1.0.0' );
define( 'DEMITR_PLUGIN_FILE', __FILE__ );
define( 'DEMITR_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'DEMITR_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'DEMITR_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );

require_once DEMITR_PLUGIN_DIR . 'admin/class-admin.php';
require_once DEMITR_PLUGIN_DIR . 'includes/class-plugin.php';

// ── Activation ────────────────────────────────────────────────────────────────

register_activation_hook(
	__FILE__,
	static function (): void {
		add_option( 'demitr_api_url', '' );
		add_option( 'demitr_brand', get_bloginfo( 'name' ) );
		add_option( 'demitr_lang', 'auto' );
		add_option( 'demitr_color', '#7c3aed' );
		add_option( 'demitr_position', 'bottom-right' );
		add_option( 'demitr_enabled', false );
		set_transient( 'demitr_activation_redirect', true, 30 );
	}
);

// ── Boot ──────────────────────────────────────────────────────────────────────

add_action(
	'plugins_loaded',
	static function (): void {
		load_plugin_textdomain( 'demitr', false, DEMITR_PLUGIN_DIR . 'languages' );
		( new DemitrWP\Plugin() )->init();
	}
);
