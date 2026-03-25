<?php
/**
 * Admin settings page view.
 *
 * @package DemitrWP
 */

defined( 'ABSPATH' ) || exit;

$enabled  = (bool) get_option( 'demitr_enabled', false );
$api_url  = (string) get_option( 'demitr_api_url', '' );
$status   = ( $enabled && '' !== trim( $api_url ) ) ? 'active' : ( $enabled ? 'needs-config' : 'inactive' );
?>
<div class="wrap demitr-wrap">

	<div class="demitr-header">
		<div class="demitr-header__brand">
			<span class="demitr-logo">💬</span>
			<div>
				<h1><?php esc_html_e( 'Demitr — AI Chat Widget', 'demitr' ); ?></h1>
				<p class="demitr-header__tagline">
					<?php esc_html_e( 'GDPR-compliant · EU-sovereign · Powered by Mistral', 'demitr' ); ?>
				</p>
			</div>
		</div>
		<div class="demitr-status demitr-status--<?php echo esc_attr( $status ); ?>">
			<?php if ( 'active' === $status ) : ?>
				<span class="demitr-status__dot"></span>
				<?php esc_html_e( 'Active', 'demitr' ); ?>
			<?php elseif ( 'needs-config' === $status ) : ?>
				<span class="demitr-status__dot"></span>
				<?php esc_html_e( 'Needs API URL', 'demitr' ); ?>
			<?php else : ?>
				<span class="demitr-status__dot"></span>
				<?php esc_html_e( 'Inactive', 'demitr' ); ?>
			<?php endif; ?>
		</div>
	</div>

	<?php if ( 'needs-config' === $status ) : ?>
		<div class="notice notice-warning inline">
			<p>
				<?php esc_html_e( 'The widget is enabled but no API endpoint is set. Add the URL of your Demitr API server below.', 'demitr' ); ?>
			</p>
		</div>
	<?php endif; ?>

	<?php settings_errors( 'demitr_settings' ); ?>

	<form method="post" action="options.php" class="demitr-form">
		<?php settings_fields( 'demitr_settings' ); ?>

		<div class="demitr-grid">

			<div class="demitr-card">
				<h2 class="demitr-card__title">
					<span class="dashicons dashicons-admin-settings"></span>
					<?php esc_html_e( 'Widget Settings', 'demitr' ); ?>
				</h2>
				<table class="form-table" role="presentation">
					<?php do_settings_fields( 'demitr', 'demitr_main' ); ?>
				</table>
			</div>

			<div class="demitr-card">
				<h2 class="demitr-card__title">
					<span class="dashicons dashicons-art"></span>
					<?php esc_html_e( 'Appearance', 'demitr' ); ?>
				</h2>
				<table class="form-table" role="presentation">
					<?php do_settings_fields( 'demitr', 'demitr_appearance' ); ?>
				</table>
			</div>

			<div class="demitr-card">
				<h2 class="demitr-card__title">
					<span class="dashicons dashicons-store"></span>
					<?php esc_html_e( 'Business Card', 'demitr' ); ?>
				</h2>
				<table class="form-table" role="presentation">
					<?php do_settings_fields( 'demitr', 'demitr_business' ); ?>
				</table>
			</div>

			<div class="demitr-card">
				<h2 class="demitr-card__title">
					<span class="dashicons dashicons-admin-network"></span>
					<?php esc_html_e( 'Paid / Managed Mode', 'demitr' ); ?>
				</h2>
				<table class="form-table" role="presentation">
					<?php do_settings_fields( 'demitr', 'demitr_paid' ); ?>
				</table>
			</div>

			<div class="demitr-card demitr-card--full">
				<h2 class="demitr-card__title">
					<span class="dashicons dashicons-shield"></span>
					<?php esc_html_e( 'GDPR Compliance', 'demitr' ); ?>
				</h2>
				<div class="demitr-compliance-grid">
					<div class="demitr-compliance-item demitr-compliance-item--ok">
						<span class="demitr-compliance-item__icon">✓</span>
						<div>
							<strong><?php esc_html_e( 'Consent gate', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Explicit opt-in shown before first message. GDPR Art. 6 compliant.', 'demitr' ); ?></p>
						</div>
					</div>
					<div class="demitr-compliance-item demitr-compliance-item--ok">
						<span class="demitr-compliance-item__icon">✓</span>
						<div>
							<strong><?php esc_html_e( 'AI disclosure', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Users are informed they are chatting with an AI. EU AI Act Art. 50 compliant.', 'demitr' ); ?></p>
						</div>
					</div>
					<div class="demitr-compliance-item demitr-compliance-item--ok">
						<span class="demitr-compliance-item__icon">✓</span>
						<div>
							<strong><?php esc_html_e( 'PII anonymization', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Emails and phone numbers are tokenized before reaching the LLM. Raw data never leaves your server.', 'demitr' ); ?></p>
						</div>
					</div>
					<div class="demitr-compliance-item demitr-compliance-item--ok">
						<span class="demitr-compliance-item__icon">✓</span>
						<div>
							<strong><?php esc_html_e( 'EU-sovereign LLM', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Mistral AI is a French company (Paris). No international data transfer agreement needed.', 'demitr' ); ?></p>
						</div>
					</div>
					<div class="demitr-compliance-item demitr-compliance-item--ok">
						<span class="demitr-compliance-item__icon">✓</span>
						<div>
							<strong><?php esc_html_e( 'No persistent storage', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Sessions held in memory only. Auto-expire after 30 minutes. Nothing is logged to disk.', 'demitr' ); ?></p>
						</div>
					</div>
					<div class="demitr-compliance-item demitr-compliance-item--action">
						<span class="demitr-compliance-item__icon">📄</span>
						<div>
							<strong><?php esc_html_e( 'Update your privacy policy', 'demitr' ); ?></strong>
							<p><?php esc_html_e( 'Add a section describing your use of the AI chat widget and session data handling. This is your responsibility.', 'demitr' ); ?></p>
						</div>
					</div>
				</div>
			</div>

		</div>

		<?php submit_button( __( 'Save Settings', 'demitr' ) ); ?>
	</form>

	<div class="demitr-footer">
		<p>
			<?php
			printf(
				/* translators: 1: Demitr link, 2: dcode link */
				esc_html__( '%1$s · Built by %2$s · GDPR-compliant agentic AI', 'demitr' ),
				'<a href="https://demitr.ai" target="_blank">demitr.ai</a>',
				'<a href="https://d-code.lu" target="_blank">dcode technologies</a>'
			);
			?>
		</p>
	</div>

</div>
