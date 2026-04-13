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

		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_widget' ] );
		add_filter( 'script_loader_tag', [ $this, 'add_widget_data_attributes' ], 10, 2 );
	}

	/**
	 * Enqueue the widget script in the footer.
	 *
	 * Uses wp_enqueue_script() per WordPress coding standards.
	 * Data attributes are added via the script_loader_tag filter.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function enqueue_widget(): void {
		if ( ! $this->is_active() || is_admin() ) {
			return;
		}

		wp_enqueue_script(
			'demitr-widget',
			DEMITR_PLUGIN_URL . 'public/demitr.js',
			[],
			DEMITR_VERSION,
			true
		);
	}

	/**
	 * Add data-* attributes to the enqueued widget script tag.
	 *
	 * WordPress does not natively support data attributes on enqueued scripts,
	 * so we use the script_loader_tag filter to inject them.
	 *
	 * @since 1.0.0
	 *
	 * @param string $tag    The full script tag HTML.
	 * @param string $handle The script handle.
	 *
	 * @return string Modified script tag.
	 */
	public function add_widget_data_attributes( string $tag, string $handle ): string {
		if ( 'demitr-widget' !== $handle ) {
			return $tag;
		}

		$api_key           = sanitize_text_field( (string) get_option( 'demitr_api_key', '' ) );
		$show_attribution  = (bool) get_option( 'demitr_show_attribution', false );
		$attribution_attr  = $show_attribution ? ' data-show-powered-by="1"' : '';

		if ( '' !== $api_key ) {
			// Paid mode — only data-key needed.
			$attrs = sprintf( ' data-key="%s"', esc_attr( $api_key ) ) . $attribution_attr;
		} else {
			// Free mode — Business Card attributes.
			$attrs = sprintf(
				' data-api="%s" data-brand="%s" data-business-name="%s" data-business-type="%s" data-business-info="%s" data-business-url="%s" data-lang="%s" data-color="%s" data-position="%s"',
				esc_url( (string) get_option( 'demitr_api_url', '' ) ),
				esc_attr( sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) ) ),
				esc_attr( sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) ) ),
				esc_attr( sanitize_text_field( (string) get_option( 'demitr_business_type', '' ) ) ),
				esc_attr( sanitize_textarea_field( (string) get_option( 'demitr_business_info', '' ) ) ),
				esc_url( (string) get_option( 'demitr_business_url', get_home_url() ) ),
				esc_attr( $this->get_lang() ),
				esc_attr( $this->sanitize_hex_color( (string) get_option( 'demitr_color', '#7c3aed' ) ) ),
				esc_attr( $this->sanitize_position( (string) get_option( 'demitr_position', 'bottom-right' ) ) )
			) . $attribution_attr;
		}

		return str_replace( ' src=', $attrs . ' src=', $tag );
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
