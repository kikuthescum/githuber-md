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
        <div style="display:flex;align-items: end;margin-bottom:1rem">
        <input type=\"text\" style="width:200px" data-url />
        <div class="${classPrefix}file-input">
        <input type="file" name="${classPrefix}movie-file" accept="video/*" />
        <input type="submit" value="${movieLang.uploadButton}" />
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
                return false;

                var altAttr = alt !== "" ? ' "' + alt + '"' : "";

                if (link === "" || link === "http://") {
                  cm.replaceSelection("![" + alt + "](" + url + altAttr + ")");
                } else {
                  cm.replaceSelection(
                    "[![" +
                      alt +
                      "](" +
                      url +
                      altAttr +
                      ")](" +
                      link +
                      altAttr +
                      ")"
                  );
                }

                if (alt === "") {
                  cm.setCursor(cursor.line, cursor.ch + 2);
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

          loading(true);

          var submitHandler = function () {
            console.log("submitHandler");
            var movieFile = fileInput[0].files[0];
            var movieUploader = new MovieUpload({
              onFileUploaded: function (filename) {
                console.log("File uploaded: " + filename);
                loading(false);
                dialog.find("[data-url]").val(filename);
              },
            });
            movieUploader.uploadFile(movieFile);
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
