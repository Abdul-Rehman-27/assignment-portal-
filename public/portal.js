/* Core logic of the Assignment Submission Portal.
   Works in the browser (window.Portal) and in Node (module.exports). */
(function (root) {
  "use strict";

  var STORAGE_KEY = "assignment-submissions";
  var FIELDS = {
    name: "Name",
    regNo: "Registration number",
    title: "Assignment title",
    url: "Submission URL",
  };

  function isValidUrl(value) {
    try {
      var u = new URL(String(value).trim());
      return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.indexOf(".") > 0;
    } catch (e) {
      return false;
    }
  }

  /* Returns an array of messages; an empty array means the data is valid. */
  function validate(data) {
    var errors = [];
    Object.keys(FIELDS).forEach(function (key) {
      if (!String(data[key] || "").trim()) errors.push(FIELDS[key] + " is required.");
    });
    var url = String(data.url || "").trim();
    if (url && !isValidUrl(url)) errors.push("Submission URL is not a valid http(s) URL.");
    return errors;
  }

  function loadAll(storage) {
    try {
      return JSON.parse(storage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  /* Validates and saves. Returns { ok, errors, saved }. */
  function submit(storage, data) {
    var errors = validate(data);
    if (errors.length) return { ok: false, errors: errors };
    var record = {
      name: data.name.trim(),
      regNo: data.regNo.trim(),
      title: data.title.trim(),
      url: data.url.trim(),
      submittedAt: new Date().toISOString(),
    };
    var all = loadAll(storage);
    all.push(record);
    storage.setItem(STORAGE_KEY, JSON.stringify(all));
    return { ok: true, errors: [], saved: record };
  }

  var api = { STORAGE_KEY: STORAGE_KEY, isValidUrl: isValidUrl, validate: validate, loadAll: loadAll, submit: submit };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Portal = api;
})(typeof window !== "undefined" ? window : this);
