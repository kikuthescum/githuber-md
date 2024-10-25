<?php

/**
 * Class MovieUpload
 *
 * @author Terry Lin
 * @link https://terryl.in/
 *
 * @package Githuber
 * @since 1.0.1
 * @version 1.12.2
 */


namespace Githuber\Controller;

use Aws\S3\S3Client;

/**
 * Class MovieUpload
 */
class MovieUpload extends ControllerAbstract
{

	/**
	 * The version of MovieUpload we are using.
	 *
	 * @var string
	 */
	public $movieupload_version = '1.0.0';

	/**
	 * Constructer.
	 */
	public function __construct()
	{
		parent::__construct();
	}

	/**
	 * Initialize.
	 */
	public function init()
	{
		add_action('admin_init', array($this, 'admin_init'));
	}

	/**
	 * Initalize to WP `admin_init` hook.
	 */
	public function admin_init()
	{
		$user = wp_get_current_user();
		$allowed_roles = array('editor', 'administrator', 'author');

		// For security reasons, only authorized logged-in users can upload movie.
		if (array_intersect($allowed_roles, $user->roles) || is_super_admin()) {
			add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
			add_action('wp_ajax_githuber_presigned_url', array($this, 'admin_githuber_presigned_url'));
			add_action('wp_ajax_nopriv_githuber_presigned_url', array($this, 'admin_githuber_presigned_url'));
		}
	}

	/**
	 * Register CSS style files.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public function admin_enqueue_styles($hook_suffix) {}

	/**
	 * Register JS files.
	 *
	 * @param string $hook_suffix The current admin page.
	 */
	public function admin_enqueue_scripts($hook_suffix)
	{
		wp_enqueue_script('jquery');
		wp_enqueue_script('editormd', $this->githuber_plugin_url . 'assets/vendor/editor.md/editormd.js', array('jquery'), '1.0.0', true);
		wp_enqueue_script('axios', $this->githuber_plugin_url . 'assets/vendor/movie-upload/axios.min.js', array(), $this->movieupload_version, true);
		wp_enqueue_script('movie-upload', $this->githuber_plugin_url . 'assets/vendor/editor.md/plugins/movie-dialog/movie-dialog.js', array('jquery', 'axios'), $this->movieupload_version, true);
		wp_localize_script('movie-upload', 'ajax_object', array(
			'ajaxurl' => admin_url('admin-ajax.php'),
			'post_id' => get_the_ID(),
			'nonce' => wp_create_nonce('movie_upload_nonce')
		));
	}

	/**
	 * Do action hook for Movie upload.
	 */
	public function admin_githuber_presigned_url()
	{
		$key = isset($_GET['key']) ? $_GET['key'] : '';
		$contentType = isset($_GET['contentType']) ? $_GET['contentType'] : '';

		if (empty($key) || empty($contentType)) {
			wp_send_json_error('Invalid parameters.', 400);
			return;
		}
		$s3ApiRegion = githuber_get_option('s3_api_region', 'githuber_modules');
		$s3ApiBucket = githuber_get_option('s3_api_bucket', 'githuber_modules');
		$s3ApiKey = githuber_get_option('s3_api_key', 'githuber_modules');
		$s3ApiSecret = githuber_get_option('s3_api_secret', 'githuber_modules');
		$cloudfrontDistributionDomain = githuber_get_option('cloudfront_distribution_domain', 'githuber_modules');
		$fileUrl = 'https://' . $cloudfrontDistributionDomain . '.cloudfront.net/' . $key;
		$response = [];
		$s3Client = new S3Client([
			'region' => $s3ApiRegion,
			'version' => 'latest',
			'credentials' => [
				'key' => $s3ApiKey,
				'secret' => 	$s3ApiSecret,
			],
		]);
		$cmd = $s3Client->getCommand('PutObject', [
			'Bucket' => 	$s3ApiBucket,
			'Key' => $key,
			'ContentType' => $contentType
		]);
		$response['url'] = $s3Client->createPresignedRequest($cmd, '+120 minutes')->getUri();
		$response['path'] = $fileUrl;
		wp_send_json($response);
	}
}
