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
use Aws\Exception\AwsException;

/**
 * Class ImagePaste
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
		$user          = wp_get_current_user();
		$allowed_roles = array('editor', 'administrator', 'author');

		// For security reasons, only authorized logged-in users can upload movie.
		if (array_intersect($allowed_roles, $user->roles) || is_super_admin()) {
			add_action('admin_enqueue_scripts', array($this, 'admin_enqueue_scripts'));
			add_action('wp_ajax_githuber_movie_upload', array($this, 'admin_githuber_movie_upload'));
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
		wp_enqueue_script('movie-upload', $this->githuber_plugin_url . 'assets/vendor/editor.md/plugins/movie-dialog/movie-dialog.js', array('jquery', 'axios'),  $this->movieupload_version, true);
		wp_localize_script('movie-upload', 'ajax_object', array(
			'ajaxurl' => admin_url('admin-ajax.php'),
			'post_id' => get_the_ID(),
			'nonce'   => wp_create_nonce('movie_upload_nonce')
		));
	}

	/**
	 * Do action hook for Movie upload.
	 */
	public function admin_githuber_movie_upload()
	{
		check_ajax_referer('movie_upload_nonce', '_wpnonce');
		if (isset($_FILES['file'])) {
			// upload_to_s3

			$response = array(
				'success' => true,
				'message' => 'Upload successful',
				'data' => array(
					'filename' => 'Test.mp4',
				),
			);
		} else {
			$response = array(
				'success' => false,
				'message' => __('Error while uploading file.', 'wp-githuber-md'),
			);
		}
		wp_send_json($response);
		// To avoid wp_ajax return "0" string to break the vaild json string.
		wp_die();
	}
}
