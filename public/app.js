/* Connects the form and table in index.html to the Portal logic. */
(function () {
  "use strict";

  function init() {
    var form = document.getElementById("submission-form");
    if (!form || form.dataset.ready) return;
    form.dataset.ready = "1";

    var messages = document.getElementById("messages");
    var tbody = document.querySelector("#submissions tbody");

    function showMessage(kind, lines) {
      messages.innerHTML = "";
      var box = document.createElement("div");
      box.className = kind;
      box.id = kind === "ok" ? "success" : "errors";
      lines.forEach(function (l) {
        var p = document.createElement("p");
        p.textContent = l;
        box.appendChild(p);
      });
      messages.appendChild(box);
    }

    function renderList() {
      var rows = window.Portal.loadAll(window.localStorage);
      tbody.innerHTML = "";
      if (!rows.length) {
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.colSpan = 5;
        td.textContent = "No submissions yet.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }
      rows.forEach(function (r) {
        var tr = document.createElement("tr");
        [r.name, r.regNo, r.title].forEach(function (text) {
          var td = document.createElement("td");
          td.textContent = text;
          tr.appendChild(td);
        });
        var linkCell = document.createElement("td");
        var a = document.createElement("a");
        a.href = r.url;
        a.textContent = r.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        linkCell.appendChild(a);
        tr.appendChild(linkCell);
        var when = document.createElement("td");
        when.textContent = r.submittedAt.replace("T", " ").slice(0, 19);
        tr.appendChild(when);
        tbody.appendChild(tr);
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = {
        name: form.elements.name.value,
        regNo: form.elements.regNo.value,
        title: form.elements.title.value,
        url: form.elements.url.value,
      };
      var result = window.Portal.submit(window.localStorage, data);
      if (result.ok) {
        form.reset();
        showMessage("ok", ["Submission saved successfully."]);
      } else {
        showMessage("err", result.errors);
      }
      renderList();
    });

    renderList();
  }

  window.initPortal = init;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
