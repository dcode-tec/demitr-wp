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
	 * Only fires when the widget is enabled and an API URL is configured.
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

		$api_url    = esc_url( (string) get_option( 'demitr_api_url', '' ) );
		$brand      = esc_attr( sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) ) );
		$lang       = esc_attr( $this->get_lang() );
		$color      = esc_attr( $this->sanitize_hex_color( (string) get_option( 'demitr_color', '#7c3aed' ) ) );
		$position   = esc_attr( $this->sanitize_position( (string) get_option( 'demitr_position', 'bottom-right' ) ) );
		$widget_url = esc_url( DEMITR_PLUGIN_URL . 'public/demitr.js' );

		printf(
			'<script src="%s" data-api="%s" data-brand="%s" data-lang="%s" data-color="%s" data-position="%s" defer></script>' . PHP_EOL,
			$widget_url,
			$api_url,
			$brand,
			$lang,
			$color,
			$position
		);
	}

	// ── Private helpers ───────────────────────────────────────────────────────

	/**
	 * Check if the widget is enabled and configured.
	 *
	 * @since 1.0.0
	 *
	 * @return bool
	 */
	private function is_active(): bool {
		if ( ! (bool) get_option( 'demitr_enabled', false ) ) {
			return false;
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
