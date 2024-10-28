(function () {
  let factory = function (exports) {
    const pluginName = "movie-dialog";

    exports.fn.movieDialog = function () {
      const cm = this.cm;
      const lang = this.lang;
      const editor = this.editor;
      const settings = this.settings;
      const movieLang = lang.dialog.movie;
      const classPrefix = this.classPrefix;

      const iframeName = classPrefix + "movie-iframe";
      let dialogName = classPrefix + pluginName,
        dialog;

      cm.focus();

      let loading = function (show) {
        let _loading = dialog.find("." + classPrefix + "dialog-mask");
        _loading[show ? "show" : "hide"]();
      };

      if (editor.find("." + dialogName).length < 1) {
        const guid = new Date().getTime();
        const action =
          settings.movieUploadCallback +
          (settings.movieUploadCallback.indexOf("?") >= 0 ? "&" : "?") +
          "guid=" +
          guid;

        const dialogContent = `<form action="${action}" target="${iframeName}" method="post" enctype="multipart/form-data" class="${classPrefix}form">
        <div style="margin-bottom:1rem">
         <div style="display:flex;align-items:end;margin-bottom:.5rem;">
          <label style="width:55px;align-self:center;">${movieLang.file}</label>
          <input type=\"text\" style="width:200px" file-name />
          <input type=\"text\" style="display:none;" data-url />
          <div class="${classPrefix}file-input">
            <input type="file" name="${classPrefix}movie-file" accept="video/*" />
            <input type="submit" value="${movieLang.uploadButton}" />
          </div>
          </div>
          <div id="progress-container" style="display:none;background:rgba(1, 50, 117,.2);margin-top:1rem">
            <div id="progress-bar" style="width:0%;height:10px;background-color:#013275;transition:width 0.5s;"></div>
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
                const fileName = dialog.find("[data-url]").val();
                const isMovie = new RegExp(
                  "(\\.(" + settings.movieFormats.join("|") + "))$"
                );
                if (!isMovie.test(fileName)) {
                  alert(
                    movieLang.formatNotAllowed +
                      settings.movieFormats.join(", ")
                  );
                  reset();
                  return false;
                }
                const fileExtension = fileName.split(".").pop();
                if (fileName) {
                  const html = `<video controls playsinline><source src='${fileName}' type='video/${fileExtension}'>Your browser does not support the video tag.</video>`;
                  cm.replaceSelection(html);
                } else {
                  alert(movieLang.fileNotSelected);
                  return false;
                }
                this.hide().lockScreen(false).hideMask();
                return false;
              },
            ],
            cancel: [
              lang.buttons.cancel,
              function () {
                reset();
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
        let lastPercent = 0;
        const reset = () => {
          dialog.find('[type="file"]').val("");
          dialog.find("[file-name]").val("");
          dialog.find("[data-url]").val("");
        };
        const fileInput = dialog.find('[name="' + classPrefix + 'movie-file"]');
        fileInput.bind("change", function () {
          const fileName = fileInput.val();
          const isMovie = new RegExp(
            "(\\.(" + settings.movieFormats.join("|") + "))$"
          );
          if (!isMovie.test(fileName)) {
            alert(
              movieLang.formatNotAllowed + settings.movieFormats.join(", ")
            );
            reset();
            return false;
          }
          const getPresignedUrl = async (file) => {
            const postDate = (() => {
              const date = new Date();
              const year = String(date.getFullYear()).slice(-2);
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");

              return `${year}${month}${day}`;
            })();
            const key =
              "movies/" + postDate + "/" + encodeURIComponent(file.name);
            return await axios
              .get(ajax_object.ajaxurl, {
                params: {
                  action: "githuber_presigned_url",
                  key: key,
                  contentType: file.type,
                },
              })
              .then((res) => {
                return res.data;
              })
              .catch((err) => {
                reset();
                alert(movieLang.fetchingPresigned + err);
                // console.error("Error fetching presigned URL: ", err);
                throw err;
              });
          };
          const submitHandler = async () => {
            // console.log("submitHandler");
            loading(true);
            const file = fileInput[0].files[0];
            dialog.find("[file-name]").val(file.name);
            const presignedUrlData = await getPresignedUrl(file);

            const progressContainer =
              document.getElementById("progress-container");
            const progressBar = document.getElementById("progress-bar");
            progressContainer.style.display = "block";

            try {
              await axios.put(presignedUrlData.url, file, {
                headers: {
                  "Content-Type": file.type,
                },
                onUploadProgress: function (progressEvent) {
                  const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                  );
                  if (
                    percentCompleted - lastPercent >= 5 ||
                    percentCompleted === 100
                  ) {
                    progressBar.style.width = percentCompleted + "%";
                    lastPercent = percentCompleted;
                  }
                },
              });
              dialog.find("[data-url]").val(presignedUrlData.path);
            } catch (error) {
              alert(movieLang.uploadError);
            } finally {
              dialog.find('[type="file"]').val("");
              progressContainer.style.display = "none";
              progressBar.style.width = 0;
              lastPercent = 0;
              loading(false);
            }
          };

          dialog
            .find('[type="submit"]')
            .bind("click", submitHandler)
            .trigger("click");
        });
      }
      dialog = editor.find("." + dialogName);
      dialog.find('[type="file"]').val("");
      dialog.find("[file-name]").val("");
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
        let editormd = require("../../editormd");
        factory(editormd);
      });
    }
  } else {
    factory(window.editormd);
  }
})();
