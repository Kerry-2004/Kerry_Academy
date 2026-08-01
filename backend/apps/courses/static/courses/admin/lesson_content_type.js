(function () {
  "use strict";

  var FIELD_CLASSES = ["field-video", "field-text_content", "field-file"];
  var VALUE_TO_CLASS = {
    video: "field-video",
    text: "field-text_content",
    file: "field-file",
  };

  function findScope(select) {
    // Conteneur englobant à la fois les champs de la leçon (fieldset.module)
    // et le formset imbriqué des Questions (div.form-nested) : c'est le
    // "form-group" de la ligne de leçon dans le formset parent.
    return select.closest(".form-group") || select.closest("fieldset.module") || document;
  }

  function toggle(select) {
    var scope = findScope(select);
    var value = select.value;

    FIELD_CLASSES.forEach(function (className) {
      var row = scope.querySelector("." + className);
      if (!row) return;
      var shouldShow = VALUE_TO_CLASS[value] === className;
      row.style.display = shouldShow ? "" : "none";
    });

    var questions = scope.querySelector(".form-nested");
    if (questions) {
      questions.style.display = value === "quiz" ? "" : "none";
    }
  }

  function initAll(root) {
    (root || document)
      .querySelectorAll('select[id$="content_type"]')
      .forEach(toggle);
  }

  // Un seul écouteur délégué : fonctionne aussi pour les lignes clonées par le
  // formset (un addEventListener posé sur l'élément d'origine ne survivrait
  // pas au clonage utilisé par Django pour "Ajouter un objet supplémentaire").
  document.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches('select[id$="content_type"]')) {
      toggle(event.target);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    initAll(document);
  });

  // Nouvelle ligne ajoutée via "Ajouter un objet Lesson supplémentaire" (formset dynamique) :
  // initialise son affichage (le listener "change" ci-dessus la couvre déjà pour la suite).
  if (window.django && window.django.jQuery) {
    window.django.jQuery(document).on("formset:added", function (event, row) {
      var el = row && row[0] ? row[0] : null;
      if (el) initAll(el);
    });
  }
})();
