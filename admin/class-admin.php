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

		register_setting( 'demitr_settings', 'demitr_business_type', [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		] );

		register_setting( 'demitr_settings', 'demitr_business_info', [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_textarea_field',
			'default'           => '',
		] );

		register_setting( 'demitr_settings', 'demitr_business_url', [
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		] );

		register_setting( 'demitr_settings', 'demitr_api_key', [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
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

		add_settings_section(
			'demitr_business',
			__( 'Business Card (Free Mode)', 'demitr' ),
			[ $this, 'render_section_business' ],
			'demitr'
		);

		add_settings_section(
			'demitr_paid',
			__( 'Paid / Managed Mode', 'demitr' ),
			[ $this, 'render_section_paid' ],
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

		// ----- Fields — Business Card -----
		add_settings_field( 'demitr_business_type',
			__( 'Business Type', 'demitr' ),
			[ $this, 'render_field_business_type' ],
			'demitr', 'demitr_business'
		);

		add_settings_field( 'demitr_business_info',
			__( 'Business Info', 'demitr' ),
			[ $this, 'render_field_business_info' ],
			'demitr', 'demitr_business'
		);

		add_settings_field( 'demitr_business_url',
			__( 'Business URL', 'demitr' ),
			[ $this, 'render_field_business_url' ],
			'demitr', 'demitr_business'
		);

		// ----- Fields — Paid / Managed -----
		add_settings_field( 'demitr_api_key',
			__( 'API Key', 'demitr' ),
			[ $this, 'render_field_api_key' ],
			'demitr', 'demitr_paid'
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

	/**
	 * Render the Business Card section description.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_section_business(): void {
		?>
		<p id="demitr-business-section-desc">
			<?php esc_html_e( 'Tell the AI about your business. These attributes are embedded in the widget script tag so the AI can answer questions about your services, hours, and location.', 'demitr' ); ?>
		</p>
		<div id="demitr-managed-notice" style="display:none;">
			<div class="notice notice-info inline" style="margin:0;">
				<p>
					<strong><?php esc_html_e( 'Managed via demitr.ai/dashboard', 'demitr' ); ?></strong><br>
					<?php esc_html_e( 'Your widget configuration is managed from your demitr.ai dashboard. Business Card fields are not used when an API key is set.', 'demitr' ); ?>
					<a href="https://demitr.ai/dashboard" target="_blank" rel="noopener noreferrer">
						<?php esc_html_e( 'Open dashboard →', 'demitr' ); ?>
					</a>
				</p>
			</div>
		</div>
		<?php
	}

	/**
	 * Render the Paid / Managed section description.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_section_paid(): void {
		?>
		<p>
			<?php
			printf(
				/* translators: %s: link to demitr.ai */
				esc_html__( 'On a paid Demitr plan? Enter your publishable API key here. The widget will fetch its full configuration from %s — Business Card fields above are ignored.', 'demitr' ),
				'<a href="https://demitr.ai/dashboard/embed" target="_blank" rel="noopener noreferrer">demitr.ai/dashboard</a>'
			);
			?>
		</p>
		<?php
	}

	/**
	 * Render the Business Type field.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_business_type(): void {
		$value = sanitize_text_field( (string) get_option( 'demitr_business_type', '' ) );
		?>
		<input
			type="text"
			id="demitr_business_type"
			name="demitr_business_type"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text demitr-free-field"
			maxlength="120"
			placeholder="<?php esc_attr_e( 'e.g. French restaurant in Luxembourg City', 'demitr' ); ?>"
		>
		<p class="description demitr-free-field">
			<?php esc_html_e( 'A brief description of your business type and location. Used in the AI system prompt.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the Business Info textarea.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_business_info(): void {
		$value = sanitize_textarea_field( (string) get_option( 'demitr_business_info', '' ) );
		?>
		<textarea
			id="demitr_business_info"
			name="demitr_business_info"
			class="large-text demitr-free-field"
			rows="4"
			maxlength="500"
			placeholder="<?php esc_attr_e( 'e.g. Farm-to-table. Open Tue-Sat 12-14h, 19-22h. Lunch from €18.', 'demitr' ); ?>"
		><?php echo esc_textarea( $value ); ?></textarea>
		<p class="description demitr-free-field">
			<?php esc_html_e( 'Key facts: opening hours, specialties, pricing, contact info. Max 500 characters.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the Business URL field.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_business_url(): void {
		$value = esc_url( (string) get_option( 'demitr_business_url', get_home_url() ) );
		?>
		<input
			type="url"
			id="demitr_business_url"
			name="demitr_business_url"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text demitr-free-field"
			placeholder="<?php echo esc_attr( get_home_url() ); ?>"
		>
		<p class="description demitr-free-field">
			<?php esc_html_e( 'Your website URL. Defaults to your WordPress site URL.', 'demitr' ); ?>
		</p>
		<?php
	}

	/**
	 * Render the API key field (paid/managed mode).
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function render_field_api_key(): void {
		$value = sanitize_text_field( (string) get_option( 'demitr_api_key', '' ) );
		?>
		<input
			type="text"
			id="demitr-api-key"
			name="demitr_api_key"
			value="<?php echo esc_attr( $value ); ?>"
			class="regular-text"
			placeholder="dm_live_xxxxxxxxxxxxxxxx"
			autocomplete="off"
		>
		<p class="description">
			<?php esc_html_e( 'Your publishable Demitr API key (starts with dm_live_). Find it in your dashboard under Embed settings.', 'demitr' ); ?>
		</p>
		<script>
		document.addEventListener( 'DOMContentLoaded', function () {
			var apiKeyField = document.getElementById( 'demitr-api-key' );
			if ( ! apiKeyField ) return;

			function toggleFreeFields() {
				var hasPaidKey  = '' !== apiKeyField.value.trim();
				var freeFields  = document.querySelectorAll( '.demitr-free-field' );
				var managedNote = document.getElementById( 'demitr-managed-notice' );

				freeFields.forEach( function ( el ) {
					el.style.display = hasPaidKey ? 'none' : '';
				} );

				if ( managedNote ) {
					managedNote.style.display = hasPaidKey ? 'block' : 'none';
				}
			}

			// Toggle on input change.
			apiKeyField.addEventListener( 'input', toggleFreeFields );

			// Apply on page load.
			toggleFreeFields();
		} );
		</script>
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
