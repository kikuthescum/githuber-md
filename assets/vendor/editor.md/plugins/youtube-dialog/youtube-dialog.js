(function () {
  var factory = function (exports) {
    var pluginName = "youtube-dialog";

    exports.fn.youtubeDialog = function () {
      var cm = this.cm;
      var editor = this.editor;
      var settings = this.settings;
      var selection = cm.getSelection();
      var lang = this.lang;
      var youtubeLang = lang.dialog.youtube;
      var classPrefix = this.classPrefix;
      var dialogName = classPrefix + pluginName,
        dialog;

      cm.focus();

      if (editor.find("." + dialogName).length > 0) {
        dialog = editor.find("." + dialogName);
        dialog.find("[data-title]").val(selection);

        this.dialogShowMask(dialog);
        this.dialogLockScreen();
        dialog.show();
      } else {
        var dialogHTML =
          '<div class="' +
          classPrefix +
          'form">' +
          "<label style='width:auto;'>" +
          youtubeLang.url +
          "</label>" +
          '<input type="text" value="" data-url />' +
          "<br/>" +
          "<label>" +
          youtubeLang.urlTitle +
          "</label>" +
          '<input type="text" value="' +
          selection +
          '" data-title />' +
          "<br/>" +
          "</div>";

        dialog = this.createDialog({
          title: youtubeLang.title,
          width: 380,
          content: dialogHTML,
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
                var url = this.find("[data-url]").val();
                var title = this.find("[data-title]").val();

                if (url === "") {
                  alert(youtubeLang.urlEmpty);
                  return false;
                }

                function convertToEmbedUrl(url) {
                  try {
                    const urlObj = new URL(url);
                    const videoId = urlObj.searchParams.get("v");
                    return videoId
                      ? `https://www.youtube.com/embed/${videoId}`
                      : null;
                  } catch (error) {
                    return null;
                  }
                }

                var embedUrl = convertToEmbedUrl(url);
                if (embedUrl) {
                  var iframeStr = `<iframe width="100%" height="auto" src="${embedUrl}" title="${
                    title || "YouTube video player"
                  }" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>\r\n`;

                  cm.replaceSelection(iframeStr);
                } else {
                  alert(youtubeLang.urlError);
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
      }
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
        var editormd = require("./../../editormd");
        factory(editormd);
      });
    }
  } else {
    factory(window.editormd);
  }
})();
