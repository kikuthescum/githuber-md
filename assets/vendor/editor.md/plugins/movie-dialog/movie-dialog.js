(function () {
  var factory = function (exports) {
    var pluginName = "movie-dialog";

    exports.fn.movieDialog = function () {
      var _this = this;
      var cm = this.cm;
      var lang = this.lang;
      var editor = this.editor;
      var settings = this.settings;
      // console.log(settings);

      var config = window.editormd_config;
      var cursor = cm.getCursor();
      var selection = cm.getSelection();
      var movieLang = lang.dialog.movie;
      var classPrefix = this.classPrefix;

      var iframeName = classPrefix + "movie-iframe";
      var dialogName = classPrefix + pluginName,
        dialog;

      cm.focus();

      var loading = function (show) {
        var _loading = dialog.find("." + classPrefix + "dialog-mask");
        _loading[show ? "show" : "hide"]();
      };

      if (editor.find("." + dialogName).length < 1) {
        var guid = new Date().getTime();
        var action =
          settings.movieUploadCallback +
          (settings.movieUploadCallback.indexOf("?") >= 0 ? "&" : "?") +
          "guid=" +
          guid;

        var dialogContent = `<form action="${action}" target="${iframeName}" method="post" enctype="multipart/form-data" class="${classPrefix}form">
        <label style="width:55px">${movieLang.file}</label>
        <div style="margin-bottom:1rem">
          <div style="display:flex;align-items:end;margin-bottom:.5rem;">
            <input type=\"text\" style="width:200px" data-url />
            <div class="${classPrefix}file-input">
              <input type="file" name="${classPrefix}movie-file" accept="video/*" />
              <input type="submit" value="${movieLang.uploadButton}" />
            </div>
          </div>
          <div id="progress-container" style="display: none;">
            <div id="progress-bar" style="width:0%; height:5px;background-color:#013275;transition:width 0.5s;border-radius:10px;"></div>
          </div>
        </div>
        </form>`;

        dialog = this.createDialog({
          title: movieLang.title,
          width: 380,
          name: dialogName,
          content: dialogContent,
          mask: settings.dialogShowMask,
          drag: settings.dialogDraggable,
          lockScreen: settings.dialogLockScreen,
          maskStyle: {
            opacity: settings.dialogMaskOpacity,
            backgroundColor: settings.dialogMaskBgColor,
          },
          buttons: {
            enter: [
              lang.buttons.enter,
              function () {
                let fileName = dialog.find("[data-url]").val();
                let fileExtension = fileName.split(".").pop();
                if (fileName) {
                  let html = `<video controls><source src='${fileName}' type='video/${fileExtension}'>Your browser does not support the video tag.</video>\r\n`;
                  cm.replaceSelection(html);
                } else {
                  alert("ファイルが選択されていません。");
                  return false;
                }
                this.hide().lockScreen(false).hideMask();
                return false;
              },
            ],

            cancel: [
              lang.buttons.cancel,
              function () {
                this.hide().lockScreen(false).hideMask();

                return false;
              },
            ],
          },
        });

        dialog.attr("id", classPrefix + "movie-dialog-" + guid);

        if (!settings.movieUpload) {
          return;
        }

        var fileInput = dialog.find('[name="' + classPrefix + 'movie-file"]');

        fileInput.bind("change", function () {
          var fileName = fileInput.val();

          var isMovie = new RegExp(
            "(\\.(" + settings.movieFormats.join("|") + "))$"
          );

          if (!isMovie.test(fileName)) {
            alert(
              movieLang.formatNotAllowed + settings.movieFormats.join(", ")
            );
            return false;
          }

          var submitHandler = function () {
            console.log("submitHandler");
            let movieFile = fileInput[0].files[0];
            let formData = new FormData();
            formData.append("file", movieFile);
            formData.append("action", "githuber_movie_upload");
            formData.append("_wpnonce", ajax_object.nonce);

            // loading(true);
            var progressContainer =
              document.getElementById("progress-container");
            progressContainer.style.display = "block";
            let lastPercent = 0;
            axios
              .post(ajax_object.ajaxurl, formData, {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
                onUploadProgress: function (progressEvent) {
                  var percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );

                  if (
                    percentCompleted - lastPercent >= 5 ||
                    percentCompleted === 100
                  ) {
                    var progressBar = document.getElementById("progress-bar");
                    progressBar.style.width = percentCompleted + "%";
                    console.log("Uploading: " + percentCompleted + "%");
                    lastPercent = percentCompleted;
                  }
                },
              })
              .then(function (response) {
                let result = response.data;
                if (result.success) {
                  console.log("Upload successful:", result);

                  var fileName = result.data?.filename;
                  console.log(fileName);
                  if (fileName) {
                    dialog.find("[data-url]").val(fileName);
                  }
                } else {
                  console.error("Upload Error:", result.message);
                }
              })
              .catch(function (error) {
                console.error("Request Error:", error);
              })
              .finally(function () {
                progressContainer.style.display = "none";
                // loading(false);
              });
          };

          dialog
            .find('[type="submit"]')
            .bind("click", submitHandler)
            .trigger("click");
        });
      }

      dialog = editor.find("." + dialogName);
      dialog.find('[type="file"]').val("");
      dialog.find("[data-url]").val("");
      this.dialogShowMask(dialog);
      this.dialogLockScreen();
      dialog.show();
    };
  };

  // CommonJS/Node.js
  if (
    typeof require === "function" &&
    typeof exports === "object" &&
    typeof module === "object"
  ) {
    module.exports = factory;
  } else if (typeof define === "function") {
    // AMD/CMD/Sea.js
    if (define.amd) {
      // for Require.js
      define(["editormd"], function (editormd) {
        factory(editormd);
      });
    } else {
      // for Sea.js
      define(function (require) {
        var editormd = require("../../editormd");
        factory(editormd);
      });
    }
  } else {
    factory(window.editormd);
  }
})();
