<?php
/**
 * Demitr WP — Uninstall cleanup.
 *
 * Runs when the user deletes the plugin from the WordPress admin.
 * All plugin options are removed so no data is left behind.
 *
 * @package DemitrWP
 */

defined( 'WP_UNINSTALL_PLUGIN' ) || exit;

$demitr_options = [
	'demitr_enabled',
	'demitr_api_url',
	'demitr_brand',
	'demitr_lang',
	'demitr_color',
	'demitr_position',
	'demitr_business_type',
	'demitr_business_info',
	'demitr_business_url',
	'demitr_api_key',
	'demitr_show_attribution',
];

foreach ( $demitr_options as $demitr_option ) {
	delete_option( $demitr_option );
}

delete_transient( 'demitr_activation_redirect' );
