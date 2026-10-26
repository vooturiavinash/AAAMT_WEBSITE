(function () {
  function fieldsIn(step) {
    return Array.from(step.querySelectorAll("input, select, textarea")).filter(function (el) {
      return el.type !== "hidden";
    });
  }

  function setStepRequired(step, on) {
    fieldsIn(step).forEach(function (el) {
      if (el.closest("[hidden]") || el.closest(".is-hidden-field")) {
        el.removeAttribute("required");
        return;
      }
      if (!el.dataset.wasRequired) {
        if (el.hasAttribute("required")) el.dataset.wasRequired = "1";
        else if (el.type === "radio" && el.name) {
          var group = step.querySelectorAll('input[type="radio"][name="' + el.name + '"]');
          var anyRequired = Array.from(group).some(function (r) {
            return r.hasAttribute("required") || r.dataset.wasRequired === "1";
          });
          if (anyRequired) el.dataset.wasRequired = "1";
        } else if (el.type === "checkbox" && el.name === "product-interest") {
          el.dataset.wasRequired = "group";
        }
      }
      if (el.dataset.wasRequired === "1") {
        if (on) el.setAttribute("required", "");
        else el.removeAttribute("required");
      }
    });
  }

  function validateStep(step, note) {
    var required = Array.from(step.querySelectorAll("[required]")).filter(function (field) {
      return !field.closest("[hidden]") && !field.closest(".is-hidden-field");
    });
    var missing = required.filter(function (field) {
      if (field.type === "radio") {
        var checked = step.querySelector('input[name="' + field.name + '"]:checked');
        return !checked;
      }
      if (field.type === "checkbox") return !field.checked;
      return !String(field.value || "").trim();
    });
    var phoneInvalid = false;
    var phoneField = step.querySelector("#phone");
    var phoneError = step.querySelector("[data-phone-error]");
    if (phoneField) {
      var phoneVal = String(phoneField.value || "").trim();
      if (phoneVal && !/^\d{7,15}$/.test(phoneVal)) {
        phoneInvalid = true;
        missing.push(phoneField);
      }
    }
    if (phoneError) {
      if (phoneInvalid) phoneError.hidden = false;
      else if (!phoneField || !String(phoneField.value || "").trim() || /^\d{7,15}$/.test(String(phoneField.value || "").trim())) {
        phoneError.hidden = true;
      }
    }
    var seen = {};
    missing = missing.filter(function (field) {
      if (field.type === "radio") {
        if (seen[field.name]) return false;
        seen[field.name] = true;
      }
      return true;
    });

    // At least one product interest checkbox
    var productBoxes = step.querySelectorAll('input[name="product-interest"]');
    if (productBoxes.length) {
      var anyProduct = Array.from(productBoxes).some(function (c) {
        return c.checked;
      });
      if (!anyProduct) {
        productBoxes[0].setAttribute("aria-invalid", "true");
        missing.push(productBoxes[0]);
      }
    }

    required.forEach(function (field) {
      field.removeAttribute("aria-invalid");
    });
    if (phoneField) phoneField.removeAttribute("aria-invalid");
    if (!missing.length) {
      if (note) note.textContent = "";
      return true;
    }
    missing.forEach(function (field) {
      field.setAttribute("aria-invalid", "true");
    });
    missing[0].focus();
    if (note) {
      note.textContent = phoneInvalid
        ? "Please enter phone like this: digits only (e.g. 9876543210)."
        : "Complete the required fields before continuing.";
    }
    return false;
  }

  function applyApplicantType(form) {
    var selected = form.querySelector('input[name="partner-type"]:checked');
    var isIndependent = selected && selected.value === "Independent Professional";
    var orgWrap = form.querySelector("[data-org-field]");
    var orgInput = form.querySelector("#org");
    form.classList.toggle("is-independent", !!isIndependent);
    if (!orgWrap || !orgInput) return;
    if (isIndependent) {
      orgWrap.classList.add("is-hidden-field");
      orgWrap.setAttribute("hidden", "");
      orgInput.removeAttribute("required");
      orgInput.value = "";
      orgInput.setAttribute("aria-hidden", "true");
    } else {
      orgWrap.classList.remove("is-hidden-field");
      orgWrap.removeAttribute("hidden");
      orgInput.setAttribute("required", "");
      orgInput.dataset.wasRequired = "1";
      orgInput.removeAttribute("aria-hidden");
    }
  }

  function updateProfileSummary(form) {
    var nameEl = form.querySelector("[data-profile-name]");
    var emailEl = form.querySelector("[data-profile-email]");
    if (nameEl) nameEl.textContent = (form.querySelector("#full-name") || {}).value || "";
    if (emailEl) emailEl.textContent = (form.querySelector("#email") || {}).value || "";
  }

  function goToStep(form, stepNum) {
    var steps = form.querySelectorAll(".partner-form-step");
    var labels = form.querySelectorAll(".partner-form-progress-item");
    var prevStep = 1;
    labels.forEach(function (item, index) {
      if (item.classList.contains("is-active")) prevStep = index + 1;
    });
    steps.forEach(function (step) {
      var n = Number(step.getAttribute("data-step"));
      var active = n === stepNum;
      step.classList.toggle("is-active", active);
      if (active) step.removeAttribute("hidden");
      else step.setAttribute("hidden", "");
      setStepRequired(step, active);
    });
    labels.forEach(function (item, index) {
      var n = index + 1;
      item.classList.remove("is-animating");
      item.classList.toggle("is-active", n === stepNum);
      item.classList.toggle("is-done", n < stepNum);
      var label = item.querySelector("span");
      if (label) {
        if (n === 1 && stepNum > 1) label.textContent = "✓ Your profile";
        else if (n === 1) label.textContent = "1 Your profile";
      }
      if (n === stepNum && stepNum > prevStep) {
        // Force reflow so the fill animation runs when advancing
        void item.offsetWidth;
        item.classList.add("is-animating");
        window.setTimeout(function () {
          item.classList.remove("is-animating");
        }, 600);
      }
    });
    if (stepNum === 2) updateProfileSummary(form);
    applyApplicantType(form);
  }

  document.querySelectorAll("form[data-partner-steps]").forEach(function (form) {
    var note = form.querySelector("[data-form-note]");
    var step1 = form.querySelector('.partner-form-step[data-step="1"]');
    var step2 = form.querySelector('.partner-form-step[data-step="2"]');
    if (!step1 || !step2) return;

    var modelRadios = step2.querySelectorAll('input[name="partner-model"]');
    if (modelRadios[0]) {
      modelRadios.forEach(function (r) {
        r.dataset.wasRequired = "1";
      });
      modelRadios[0].setAttribute("required", "");
    }
    ["#customer-groups", "#target-country", "#start-timeline", "#market-approach"].forEach(function (sel) {
      var el = form.querySelector(sel);
      if (el) {
        el.dataset.wasRequired = "1";
        el.setAttribute("required", "");
      }
    });

    form.querySelectorAll('input[name="partner-type"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        applyApplicantType(form);
      });
    });

    var phoneInput = form.querySelector("#phone");
    var phoneError = form.querySelector("[data-phone-error]");
    function showPhoneError(show) {
      if (phoneError) phoneError.hidden = !show;
      if (phoneInput) {
        if (show) phoneInput.setAttribute("aria-invalid", "true");
        else phoneInput.removeAttribute("aria-invalid");
      }
      if (note && show) {
        note.textContent = "Please enter phone like this: digits only (e.g. 9876543210).";
      } else if (note && !show && /Please enter phone like this/.test(note.textContent || "")) {
        note.textContent = "";
      }
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        var raw = phoneInput.value;
        if (/[^\d]/.test(raw)) {
          showPhoneError(true);
          phoneInput.value = raw.replace(/\D/g, "").slice(0, 15);
          return;
        }
        phoneInput.value = raw.slice(0, 15);
        var ok = !phoneInput.value || /^\d{7,15}$/.test(phoneInput.value);
        showPhoneError(!ok && phoneInput.value.length > 0);
      });
      phoneInput.addEventListener("paste", function (e) {
        e.preventDefault();
        var text = (e.clipboardData || window.clipboardData).getData("text") || "";
        if (/[^\d]/.test(text)) showPhoneError(true);
        phoneInput.value = text.replace(/\D/g, "").slice(0, 15);
        var ok = !phoneInput.value || /^\d{7,15}$/.test(phoneInput.value);
        if (ok) showPhoneError(false);
      });
      phoneInput.addEventListener("blur", function () {
        var val = String(phoneInput.value || "").trim();
        if (!val) {
          showPhoneError(false);
          return;
        }
        showPhoneError(!/^\d{7,15}$/.test(val));
      });
    }

    setStepRequired(step2, false);
    setStepRequired(step1, true);
    applyApplicantType(form);
    goToStep(form, 1);

    var nextBtn = form.querySelector(".partner-form-next");
    var backBtn = form.querySelector(".partner-form-back");
    var editBtn = form.querySelector("[data-edit-profile]");
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (!validateStep(step1, note)) return;
        goToStep(form, 2);
        window.scrollTo({ top: form.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
      });
    }
    if (backBtn) {
      backBtn.addEventListener("click", function () {
        goToStep(form, 1);
        if (note) note.textContent = "";
      });
    }
    if (editBtn) {
      editBtn.addEventListener("click", function (e) {
        e.preventDefault();
        goToStep(form, 1);
      });
    }

    // Not Sure product exclusivity
    form.querySelectorAll('input[name="product-interest"]').forEach(function (box) {
      box.addEventListener("change", function () {
        if (box.value === "Not Sure" && box.checked) {
          form.querySelectorAll('input[name="product-interest"]').forEach(function (other) {
            if (other !== box) other.checked = false;
          });
        } else if (box.checked) {
          var notSure = form.querySelector('input[name="product-interest"][value="Not Sure"]');
          if (notSure) notSure.checked = false;
        }
      });
    });
  });
})();
