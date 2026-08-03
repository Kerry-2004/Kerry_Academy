/*
 * Barre de progression pour le téléversement de la vidéo d'accueil.
 *
 * L'admin (thème Unfold) envoie le formulaire par un POST classique : la page
 * « fige » pendant l'upload, sans retour visuel. Ici, quand un nouveau fichier
 * vidéo est choisi, on intercepte l'envoi et on le rejoue en AJAX
 * (XMLHttpRequest) afin d'afficher la progression réelle (0 % → 100 %) puis un
 * message de confirmation.
 *
 * La barre est rendue dans une fenêtre superposée en position *fixed*, donc
 * indépendante du HTML d'Unfold (le vrai <input type="file"> y est caché dans
 * un conteneur à largeur nulle — insérer la barre à côté la rendait invisible).
 */
(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("kh-upload-styles")) return;
    var css =
      ".kh-ov{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;" +
      "justify-content:center;background:rgba(0,0,0,.6);font-family:system-ui,-apple-system,sans-serif}" +
      ".kh-card{width:min(92vw,420px);background:#141414;border:1px solid rgba(201,168,76,.35);" +
      "border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.5);color:#f4f4f2}" +
      ".kh-card__title{font-size:15px;font-weight:700;margin:0 0 4px}" +
      ".kh-card__sub{font-size:13px;color:#9a9a9a;margin:0 0 18px}" +
      ".kh-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px}" +
      ".kh-row__state{font-size:13px;font-weight:600}" +
      ".kh-row__pct{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;color:#c9a84c}" +
      ".kh-track{height:12px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}" +
      ".kh-bar{height:100%;width:0;border-radius:999px;background:#c9a84c;transition:width .15s ease}" +
      ".kh-msg{margin:16px 0 0;font-size:14px;font-weight:600;display:none}" +
      ".kh-is-done .kh-bar{background:#3ea55f}.kh-is-done .kh-row__pct{color:#3ea55f}" +
      ".kh-is-done .kh-msg{display:block;color:#3ea55f}" +
      ".kh-is-error .kh-bar{background:#e05656}.kh-is-error .kh-row__pct{color:#e05656}" +
      ".kh-is-error .kh-msg{display:block;color:#e05656}" +
      ".kh-btn{margin-top:18px;width:100%;padding:10px;border:0;border-radius:999px;" +
      "background:#c9a84c;color:#0d0d0d;font-weight:700;font-size:14px;cursor:pointer;display:none}" +
      ".kh-is-error .kh-btn{display:block}";
    var style = document.createElement("style");
    style.id = "kh-upload-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function createOverlay(fileName) {
    var ov = document.createElement("div");
    ov.className = "kh-ov";
    ov.innerHTML =
      '<div class="kh-card" role="dialog" aria-live="polite">' +
      '<p class="kh-card__title">Téléversement de la vidéo</p>' +
      '<p class="kh-card__sub"></p>' +
      '<div class="kh-row"><span class="kh-row__state">Envoi en cours…</span>' +
      '<span class="kh-row__pct">0 %</span></div>' +
      '<div class="kh-track"><div class="kh-bar"></div></div>' +
      '<p class="kh-msg"></p>' +
      '<button type="button" class="kh-btn">Fermer</button>' +
      "</div>";
    ov.querySelector(".kh-card__sub").textContent = fileName || "";
    document.body.appendChild(ov);
    return {
      ov: ov,
      card: ov.querySelector(".kh-card"),
      state: ov.querySelector(".kh-row__state"),
      pct: ov.querySelector(".kh-row__pct"),
      bar: ov.querySelector(".kh-bar"),
      msg: ov.querySelector(".kh-msg"),
      btn: ov.querySelector(".kh-btn"),
    };
  }

  function isStillOnForm(url) {
    // Succès → Django redirige vers la liste. Erreur → il re-rend le formulaire
    // (URL en /add/ ou /<id>/change/).
    return /\/add\/?$/.test(url) || /\/\d+\/change\/?$/.test(url);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var fileInput = document.querySelector('input[type="file"][name="hero_video"]');
    if (!fileInput) return;
    var form = fileInput.form || fileInput.closest("form");
    if (!form) return;

    injectStyles();

    // Capture = true : on passe avant tout autre gestionnaire (Alpine d'Unfold)
    // pour être sûr de pouvoir empêcher l'envoi classique.
    form.addEventListener(
      "submit",
      function (event) {
        // Aucun nouveau fichier vidéo → envoi normal (ex. modif image seule).
        if (!fileInput.files || fileInput.files.length === 0) return;

        event.preventDefault();
        event.stopPropagation();

        var ui = createOverlay(fileInput.files[0] && fileInput.files[0].name);

        function setPct(p) {
          ui.bar.style.width = p + "%";
          ui.pct.textContent = p + " %";
        }

        var data = new FormData(form);
        if (!data.has("_save")) data.append("_save", "");

        var xhr = new XMLHttpRequest();
        xhr.open("POST", form.action || window.location.href, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");

        xhr.upload.addEventListener("progress", function (evt) {
          if (evt.lengthComputable) setPct(Math.round((evt.loaded / evt.total) * 100));
        });

        xhr.addEventListener("load", function () {
          var url = xhr.responseURL || "";
          var ok = xhr.status >= 200 && xhr.status < 400 && !isStillOnForm(url);

          if (ok) {
            setPct(100);
            ui.card.classList.add("kh-is-done");
            ui.state.textContent = "Terminé";
            ui.msg.textContent = "✓ Vidéo téléversée avec succès !";
            setTimeout(function () {
              window.location.href = url || window.location.href;
            }, 1100);
          } else {
            // Erreur de validation : ré-afficher la page renvoyée par Django.
            document.open();
            document.write(xhr.responseText);
            document.close();
          }
        });

        xhr.addEventListener("error", function () {
          ui.card.classList.add("kh-is-error");
          ui.state.textContent = "Échec";
          ui.msg.textContent = "✕ Échec du téléversement. Vérifiez votre connexion et réessayez.";
          ui.btn.onclick = function () {
            ui.ov.remove();
          };
        });

        xhr.send(data);
      },
      true,
    );
  });
})();
