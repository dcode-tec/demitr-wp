<?php
/**
 * Main plugin class.
 *
 * @package    DemitrWP
 * @author     dcode technologies <dev@d-code.lu>
 * @copyright  2026 dcode technologies S.à r.l.
 * @license    GPL-2.0-or-later
 * @since      1.0.0
 */

namespace DemitrWP;

defined( 'ABSPATH' ) || exit;

/**
 * Wires admin and frontend hooks.
 *
 * @since 1.0.0
 */
class Plugin {

	/**
	 * Register all hooks.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init(): void {
		if ( is_admin() ) {
			$admin = new Admin();
			$admin->init();
		}

		add_action( 'wp_footer', [ $this, 'inject_widget' ] );
	}

	/**
	 * Output the widget script tag in the footer.
	 *
	 * If an API key is set, outputs data-key only (paid/managed mode).
	 * Otherwise outputs all Business Card data-* attributes (free mode).
	 * Note: no defer attribute — the widget IIFE must execute synchronously
	 * so the consent gate and UI are available immediately on DOMContentLoaded.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function inject_widget(): void {
		if ( ! $this->is_active() ) {
			return;
		}

		if ( is_admin() ) {
			return;
		}

		$api_key    = sanitize_text_field( (string) get_option( 'demitr_api_key', '' ) );
		$script_url = esc_url( DEMITR_PLUGIN_URL . 'public/demitr.js' );

		if ( '' !== $api_key ) {
			// Paid / managed mode — widget config served from demitr.ai/api/config/:key.
			printf(
				'<script src="%s" data-key="%s"></script>' . PHP_EOL,
				$script_url,
				esc_attr( $api_key )
			);
		} else {
			// Free mode — Business Card attributes passed directly.
			$api_url       = esc_url( (string) get_option( 'demitr_api_url', '' ) );
			$brand         = esc_attr( sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) ) );
			$business_name = esc_attr( sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) ) );
			$business_type = esc_attr( sanitize_text_field( (string) get_option( 'demitr_business_type', '' ) ) );
			$business_info = esc_attr( sanitize_textarea_field( (string) get_option( 'demitr_business_info', '' ) ) );
			$business_url  = esc_url( (string) get_option( 'demitr_business_url', get_home_url() ) );
			$lang          = esc_attr( $this->get_lang() );
			$color         = esc_attr( $this->sanitize_hex_color( (string) get_option( 'demitr_color', '#7c3aed' ) ) );
			$position      = esc_attr( $this->sanitize_position( (string) get_option( 'demitr_position', 'bottom-right' ) ) );

			printf(
				'<script src="%s" data-api="%s" data-brand="%s" data-business-name="%s" data-business-type="%s" data-business-info="%s" data-business-url="%s" data-lang="%s" data-color="%s" data-position="%s"></script>' . PHP_EOL,
				$script_url,
				$api_url,
				$brand,
				$business_name,
				$business_type,
				$business_info,
				$business_url,
				$lang,
				$color,
				$position
			);
		}
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Check if the widget is enabled and configured.
	 *
	 * Active when enabled AND either:
	 * - An API key is set (paid/managed mode), OR
	 * - An API URL is set (free/self-hosted mode).
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	private function is_active(): bool {
		if ( ! (bool) get_option( 'demitr_enabled', false ) ) {
			return false;
		}
		$api_key = sanitize_text_field( (string) get_option( 'demitr_api_key', '' ) );
		if ( '' !== $api_key ) {
			return true;
		}
		return '' !== trim( (string) get_option( 'demitr_api_url', '' ) );
	}

	/**
	 * Resolve the widget language from settings, falling back to WP locale.
	 *
	 * @since 1.0.0
	 *
	 * @return string 'en' or 'fr'
	 */
	private function get_lang(): string {
		$saved = (string) get_option( 'demitr_lang', 'auto' );

		if ( 'auto' === $saved ) {
			return str_starts_with( get_locale(), 'fr' ) ? 'fr' : 'en';
		}

		return in_array( $saved, [ 'en', 'fr' ], true ) ? $saved : 'en';
	}

	/**
	 * Validate a hex color string.
	 *
	 * @since 1.0.0
	 *
	 * @param string $color Raw color value.
	 *
	 * @return string
	 */
	private function sanitize_hex_color( string $color ): string {
		return preg_match( '/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/', $color ) ? $color : '#7c3aed';
	}

	/**
	 * Validate widget position string.
	 *
	 * @since 1.0.0
	 *
	 * @param string $position Raw position value.
	 *
	 * @return string
	 */
	private function sanitize_position( string $position ): string {
		return in_array( $position, [ 'bottom-right', 'bottom-left' ], true ) ? $position : 'bottom-right';
	}
}
