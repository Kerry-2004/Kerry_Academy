/*
 * Barre de progression pour le téléversement de la vidéo d'accueil.
 *
 * L'admin Django envoie normalement le formulaire par un POST classique (page
 * qui « fige » pendant l'upload). Ici, quand un nouveau fichier vidéo est
 * choisi, on intercepte l'envoi et on le rejoue en AJAX (XMLHttpRequest) pour
 * pouvoir suivre la progression réelle (0 % → 100 %) et afficher un message de
 * confirmation à la fin.
 */
(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("kh-upload-styles")) return;
    var css =
      ".kh-upload{margin-top:12px;padding:16px;border:1px solid rgba(201,168,76,.35);" +
      "border-radius:12px;background:rgba(201,168,76,.06);font-family:inherit;display:none}" +
      ".kh-upload.is-active{display:block}" +
      ".kh-upload__label{display:flex;justify-content:space-between;align-items:center;" +
      "font-size:13px;font-weight:600;margin-bottom:8px}" +
      ".kh-upload__pct{font-variant-numeric:tabular-nums}" +
      ".kh-upload__track{height:10px;border-radius:999px;background:rgba(0,0,0,.15);overflow:hidden}" +
      ".kh-upload__bar{height:100%;width:0;border-radius:999px;background:#c9a84c;" +
      "transition:width .15s ease}" +
      ".kh-upload.is-done .kh-upload__bar{background:#2e7d32}" +
      ".kh-upload.is-error .kh-upload__bar{background:#c62828}" +
      ".kh-upload__msg{margin-top:10px;font-size:13px;font-weight:600}" +
      ".kh-upload.is-done .kh-upload__msg{color:#2e7d32}" +
      ".kh-upload.is-error .kh-upload__msg{color:#c62828}";
    var style = document.createElement("style");
    style.id = "kh-upload-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function buildUI(afterEl) {
    var box = document.createElement("div");
    box.className = "kh-upload";
    box.innerHTML =
      '<div class="kh-upload__label">' +
      "<span>Téléversement de la vidéo…</span>" +
      '<span class="kh-upload__pct">0 %</span>' +
      "</div>" +
      '<div class="kh-upload__track"><div class="kh-upload__bar"></div></div>' +
      '<div class="kh-upload__msg" style="display:none"></div>';
    afterEl.parentNode.insertBefore(box, afterEl.nextSibling);
    return {
      box: box,
      pct: box.querySelector(".kh-upload__pct"),
      bar: box.querySelector(".kh-upload__bar"),
      msg: box.querySelector(".kh-upload__msg"),
    };
  }

  function isStillOnForm(url) {
    // Après succès, Django redirige vers la liste ; en cas d'erreur, il re-rend
    // le formulaire (URL se terminant par /add/ ou /<id>/change/).
    return /\/add\/?$/.test(url) || /\/\d+\/change\/?$/.test(url);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form =
      document.getElementById("homecontent_form") ||
      document.querySelector('form[id$="homecontent_form"]');
    if (!form) return;

    var fileInput = form.querySelector('input[type="file"][name="hero_video"]');
    if (!fileInput) return;

    injectStyles();
    var ui = buildUI(fileInput);

    function setProgress(pct) {
      ui.bar.style.width = pct + "%";
      ui.pct.textContent = pct + " %";
    }

    form.addEventListener("submit", function (event) {
      // Pas de nouveau fichier vidéo choisi → laisser l'envoi normal se faire
      // (ex. on ne modifie que l'image de couverture ou on vide le champ).
      if (!fileInput.files || fileInput.files.length === 0) return;

      event.preventDefault();

      var data = new FormData(form);
      if (!data.has("_save")) data.append("_save", "");

      var xhr = new XMLHttpRequest();
      xhr.open("POST", form.action || window.location.href, true);
      xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

      ui.box.className = "kh-upload is-active";
      ui.msg.style.display = "none";
      setProgress(0);
      ui.box.scrollIntoView({ behavior: "smooth", block: "center" });

      xhr.upload.addEventListener("progress", function (evt) {
        if (evt.lengthComputable) {
          setProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      });

      xhr.addEventListener("load", function () {
        var url = xhr.responseURL || "";
        var success = xhr.status >= 200 && xhr.status < 400 && !isStillOnForm(url);

        if (success) {
          setProgress(100);
          ui.box.className = "kh-upload is-active is-done";
          ui.msg.style.display = "";
          ui.msg.textContent = "✓ Vidéo téléversée avec succès !";
          setTimeout(function () {
            window.location.href = url || window.location.href;
          }, 1000);
        } else {
          // Erreur de validation : ré-afficher la page renvoyée par Django
          // (avec ses messages d'erreur) pour ne rien masquer à l'admin.
          document.open();
          document.write(xhr.responseText);
          document.close();
        }
      });

      xhr.addEventListener("error", function () {
        ui.box.className = "kh-upload is-active is-error";
        ui.msg.style.display = "";
        ui.msg.textContent = "✕ Échec du téléversement. Vérifiez votre connexion et réessayez.";
      });

      xhr.send(data);
    });
  });
})();
