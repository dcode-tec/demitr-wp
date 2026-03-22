<?php
/**
 * Admin — settings page, menus, and activation redirect.
 *
 * @package    DemitrWP
 * @subpackage DemitrWP/Admin
 * @author     dcode technologies <dev@d-code.lu>
 * @copyright  2026 dcode technologies S.à r.l.
 * @license    GPL-2.0-or-later
 * @since      1.0.0
 */

namespace DemitrWP;

defined( 'ABSPATH' ) || exit;

/**
 * Manages WordPress admin integration — menus, settings, and activation redirect.
 *
 * @since 1.0.0
 */
class Admin {

	/**
	 * Register all admin hooks.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function init(): void {
		add_action( 'admin_menu', [ $this, 'register_menus' ] );
		add_action( 'admin_init', [ $this, 'register_settings' ] );
		add_action( 'admin_init', [ $this, 'maybe_redirect_after_activation' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_filter( 'plugin_action_links_' . DEMITR_PLUGIN_BASENAME, [ $this, 'add_action_links' ] );
	}

	// ── Menus ─────────────────────────────────────────────────────────────────

	/**
	 * Register the Settings submenu under the Settings menu.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_menus(): void {
		add_options_page(
			__( 'Demitr AI Chat', 'demitr' ),
			__( 'Demitr Chat', 'demitr' ),
			'manage_options',
			'demitr',
			[ $this, 'render_settings_page' ]
		);
	}

	// ── Assets ────────────────────────────────────────────────────────────────

	/**
	 * Enqueue admin styles on the Demitr settings page only.
	 *
	 * @since 1.0.0
	 *
	 * @param string $hook_suffix Current admin page.
	 *
	 * @return void
	 */
	public function enqueue_assets( string $hook_suffix ): void {
		if ( 'settings_page_demitr' !== $hook_suffix ) {
			return;
		}

		wp_enqueue_style(
			'demitr-admin',
			DEMITR_PLUGIN_URL . 'admin/css/demitr-admin.css',
			[],
			DEMITR_VERSION
		);

		// Native WP color picker.
		wp_enqueue_style( 'wp-color-picker' );
		wp_enqueue_script( 'wp-color-picker' );

		// Activate color picker on our field.
		wp_add_inline_script(
			'wp-color-picker',
			'document.addEventListener("DOMContentLoaded", function() {
				if (typeof jQuery !== "undefined" && jQuery.fn.wpColorPicker) {
					jQuery("#demitr_color").wpColorPicker();
				}
			});'
		);
	}

	// ── Settings API ──────────────────────────────────────────────────────────

	/**
	 * Register all settings, sections, and fields.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_settings(): void {
		// ----- Options -----
		register_setting( 'demitr_settings', 'demitr_enabled', [
			'type'              => 'boolean',
			'sanitize_callback' => 'rest_sanitize_boolean',
			'default'           => false,
		] );

		register_setting( 'demitr_settings', 'demitr_api_url', [
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		] );

		register_setting( 'demitr_settings', 'demitr_brand', [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		] );

		register_setting( 'demitr_settings', 'demitr_lang', [
			'type'              => 'string',
			'sanitize_callback' => [ $this, 'sanitize_lang' ],
			'default'           => 'auto',
		] );

		register_setting( 'demitr_settings', 'demitr_color', [
			'type'              => 'string',
			'sanitize_callback' => [ $this, 'sanitize_hex_color' ],
			'default'           => '#7c3aed',
		] );

		register_setting( 'demitr_settings', 'demitr_position', [
			'type'              => 'string',
			'sanitize_callback' => [ $this, 'sanitize_position' ],
			'default'           => 'bottom-right',
		] );

		// ----- Sections -----
		add_settings_section(
			'demitr_main',
			__( 'Widget Settings', 'demitr' ),
			'__return_false',
			'demitr'
		);

		add_settings_section(
			'demitr_appearance',
			__( 'Appearance', 'demitr' ),
			'__return_false',
			'demitr'
		);

		// ----- Fields — Main -----
		add_settings_field( 'demitr_enabled',
			__( 'Enable Widget', 'demitr' ),
			[ $this, 'render_field_enabled' ],
			'demitr', 'demitr_main'
		);

		add_settings_field( 'demitr_api_url',
			__( 'API Endpoint', 'demitr' ),
			[ $this, 'render_field_api_url' ],
			'demitr', 'demitr_main'
		);

		add_settings_field( 'demitr_lang',
			__( 'Language', 'demitr' ),
			[ $this, 'render_field_lang' ],
			'demitr', 'demitr_main'
		);

		// ----- Fields — Appearance -----
		add_settings_field( 'demitr_brand',
			__( 'Brand Name', 'demitr' ),
			[ $this, 'render_field_brand' ],
			'demitr', 'demitr_appearance'
		);

		add_settings_field( 'demitr_color',
			__( 'Accent Colour', 'demitr' ),
			[ $this, 'render_field_color' ],
			'demitr', 'demitr_appearance'
		);

		add_settings_field( 'demitr_position',
			__( 'Widget Position', 'demitr' ),
			[ $this, 'render_field_position' ],
			'demitr', 'demitr_appearance'
		);
	}

	// ── Field renderers ───────────────────────────────────────────────────────

	/**
	 * Render the enable/disable toggle.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_enabled(): void {
		$enabled = (bool) get_option( 'demitr_enabled', false );
		?>
		<label for="demitr_enabled">
			<input type="checkbox" id="demitr_enabled" name="demitr_enabled" value="1" <?php checked( $enabled ); ?>>
			<?php esc_html_e( 'Show the chat widget on the frontend', 'demitr' ); ?>
		</label>
		<p class="description">
			<?php esc_html_e( 'Requires a valid API Endpoint to be set below.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the API URL field.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_api_url(): void {
		$value = esc_url( (string) get_option( 'demitr_api_url', '' ) );
		?>
		<input
			type="url"
			id="demitr_api_url"
			name="demitr_api_url"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="https://your-server.com/api/chat"
		>
		<p class="description">
			<?php esc_html_e( 'The full URL of your Demitr API endpoint (e.g. your Hetzner VPS).', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the language selector.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_lang(): void {
		$lang = (string) get_option( 'demitr_lang', 'auto' );
		?>
		<select id="demitr_lang" name="demitr_lang">
			<option value="auto" <?php selected( $lang, 'auto' ); ?>>
				<?php esc_html_e( 'Auto (matches WordPress locale)', 'demitr' ); ?>
			</option>
			<option value="en" <?php selected( $lang, 'en' ); ?>>
				<?php esc_html_e( 'English', 'demitr' ); ?>
			</option>
			<option value="fr" <?php selected( $lang, 'fr' ); ?>>
				<?php esc_html_e( 'Français', 'demitr' ); ?>
			</option>
		</select>
		<p class="description">
			<?php esc_html_e( '"Auto" detects French locale automatically; everything else defaults to English.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the brand name field.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_brand(): void {
		$value = sanitize_text_field( (string) get_option( 'demitr_brand', get_bloginfo( 'name' ) ) );
		?>
		<input
			type="text"
			id="demitr_brand"
			name="demitr_brand"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			maxlength="60"
			placeholder="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>"
		>
		<p class="description">
			<?php esc_html_e( 'Shown in the widget header. Defaults to your site name.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the accent colour picker.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_color(): void {
		$value = sanitize_hex_color( (string) get_option( 'demitr_color', '#7c3aed' ) ) ?? '#7c3aed';
		?>
		<input
			type="text"
			id="demitr_color"
			name="demitr_color"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			maxlength="7"
		>
		<p class="description">
			<?php esc_html_e( 'Hex colour for the widget header, trigger button, and user message bubbles.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the widget position selector.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_position(): void {
		$position = (string) get_option( 'demitr_position', 'bottom-right' );
		?>
		<select id="demitr_position" name="demitr_position">
			<option value="bottom-right" <?php selected( $position, 'bottom-right' ); ?>>
				<?php esc_html_e( 'Bottom right', 'demitr' ); ?>
			</option>
			<option value="bottom-left" <?php selected( $position, 'bottom-left' ); ?>>
				<?php esc_html_e( 'Bottom left', 'demitr' ); ?>
			</option>
		</select>
		<?php
	}

	// ── Sanitize callbacks ────────────────────────────────────────────────────

	/**
	 * Sanitize the language option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $value Raw value.
	 *
	 * @return string
	 */
	public function sanitize_lang( string $value ): string {
		return in_array( $value, [ 'auto', 'en', 'fr' ], true ) ? $value : 'auto';
	}

	/**
	 * Sanitize a hex color value.
	 *
	 * @since 1.0.0
	 *
	 * @param string $value Raw color value.
	 *
	 * @return string Valid hex color or default.
	 */
	public function sanitize_hex_color( string $value ): string {
		if ( preg_match( '/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/', $value ) ) {
			return $value;
		}
		return '#7c3aed';
	}

	/**
	 * Sanitize the position option.
	 *
	 * @since 1.0.0
	 *
	 * @param string $value Raw value.
	 *
	 * @return string
	 */
	public function sanitize_position( string $value ): string {
		return in_array( $value, [ 'bottom-right', 'bottom-left' ], true ) ? $value : 'bottom-right';
	}

	// ── Settings page view ────────────────────────────────────────────────────

	/**
	 * Render the settings page.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_settings_page(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to access this page.', 'demitr' ) );
		}
		include DEMITR_PLUGIN_DIR . 'admin/views/settings.php';
	}

	// ── Plugin list link ──────────────────────────────────────────────────────

	/**
	 * Add a "Settings" link on the Plugins list page.
	 *
	 * @since 1.0.0
	 *
	 * @param string[] $links Existing action links.
	 *
	 * @return string[]
	 */
	public function add_action_links( array $links ): array {
		$settings_link = sprintf(
			'<a href="%s">%s</a>',
			esc_url( admin_url( 'options-general.php?page=demitr' ) ),
			esc_html__( 'Settings', 'demitr' )
		);
		array_unshift( $links, $settings_link );
		return $links;
	}

	// ── Activation redirect ───────────────────────────────────────────────────

	/**
	 * Redirect to settings on first activation.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function maybe_redirect_after_activation(): void {
		if ( ! get_transient( 'demitr_activation_redirect' ) ) {
			return;
		}

		delete_transient( 'demitr_activation_redirect' );

		if ( isset( $_GET['activate-multi'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			return;
		}

		wp_safe_redirect( admin_url( 'options-general.php?page=demitr' ) );
		exit;
	}
}
