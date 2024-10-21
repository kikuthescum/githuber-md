<?php

/**
 * Class ImagePaste
 *
 * @author Terry Lin
 * @link https://terryl.in/
 *
 * @package Githuber
 * @since 1.0.1
 * @version 1.12.2
 */

namespace Githuber\Controller;

/**
 * Class ImagePaste
 */
class MovieUpload extends ControllerAbstract
{

	/**
	 * The version of movie-upload.js we are using.
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

		// For security reasons, only authorized logged-in users can upload images.
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
		wp_enqueue_script('movie-upload', $this->githuber_plugin_url . 'assets/vendor/movie-upload/movie-upload.js', array(), $this->movieupload_version, true);
		wp_localize_script('movie-upload', 'ajax_object', array(
			'ajaxurl' => admin_url('admin-ajax.php'),
			'post_id' => get_the_ID(),
			'nonce'   => wp_create_nonce('movie_upload_nonce')
		));
	}

	/**
	 * Do action hook for image paste.
	 */
	public function admin_githuber_movie_upload()
	{
		if (isset($_FILES['file'])) {

			// upload_to_s3
		}
		// To avoid wp_ajax return "0" string to break the vaild json string.
		wp_die();
	}
}
