(function (document, window) {
  "use strict";

  var MovieUpload = function (options, instance) {
    this.settings = MovieUpload.util.merge(options, MovieUpload.defaults);
    this.editor = instance;
    this.filenameTag = "{filename}";
    this.lastValue = null;
  };

  MovieUpload.defaults = {
    uploadUrl: "upload_movie.php",
    uploadMethod: "POST",
    uploadFieldName: "file",
    allowedTypes: ["video/mp4", "video/webm", "video/ogg"],
    progressText: "Uploading video...",
    urlText: "![Video]({filename})",
    errorText: "Error uploading video",
    extraParams: {},
    beforeFileUpload: function () {
      return true;
    },
    onFileUploaded: function () {},
  };

  MovieUpload.prototype.uploadFile = function (file) {
    var me = this,
      formData = new FormData(),
      xhr = new XMLHttpRequest(),
      settings = this.settings;

    formData.append(settings.uploadFieldName, file);
    formData.append("action", "githuber_movie_upload");
    formData.append("_wpnonce", ajax_object.nonce);
    // console.log(settings);

    xhr.open(settings.uploadMethod, ajax_object.ajaxurl);
    xhr.onload = function () {
      if (xhr.status === 200) {
        var result = JSON.parse(xhr.responseText);
        console.log(result);
        var filename = result.data.data?.filename;
        if (result.data.error) {
          alert(settings.errorText);
          me.settings.onFileUploaded.call(me, "");
        } else {
          if (filename) {
            me.settings.onFileUploaded.call(me, filename);
          }
        }
      } else {
        alert(settings.errorText);
      }
    };
    xhr.send(formData);
  };

  MovieUpload.util = {
    merge: function (target, source) {
      return Object.assign({}, source, target);
    },
  };

  window.MovieUpload = MovieUpload;
})(document, window);
