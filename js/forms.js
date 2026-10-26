(function () {
  /**
   * Forms:
   * - Partnership: POST /api/partnership-enquiry (Nodemailer SMTP via serve.js — no third-party email API)
   * - Contact (legacy): communication.aaamt.in demo-survey or local /api/enquiry proxy
   */
  var UPSTREAM = "https://communication.aaamt.in/api/Email/demo-survey";
  var LOCAL_PROXY = "/api/enquiry";
  var PARTNERSHIP_ENDPOINT = "/api/partnership-enquiry";
  var ENQUIRY_THANKS = "/enquiry-submitted";

  function isLocalHost() {
    var h = location.hostname;
    return h === "127.0.0.1" || h === "localhost" || h === "::1";
  }

  function enquiryUrl() {
    return isLocalHost() ? LOCAL_PROXY : UPSTREAM;
  }

  function fieldValue(form, selector) {
    var el = form.querySelector(selector);
    return el ? String(el.value || "").trim() : "";
  }

  function selectedLabel(select) {
    if (!select || select.selectedIndex < 0) return "";
    var option = select.options[select.selectedIndex];
    return option ? String(option.text || "").trim() : "";
  }

  function enquiryTypeValue(form) {
    var select = form.querySelector("#enquiry-type");
    if (select && select.tagName === "SELECT") return selectedLabel(select);
    if (select && select.value) return String(select.value).trim();
    var radio = form.querySelector('input[name="enquiry-type"]:checked');
    return radio ? String(radio.value || "").trim() : "";
  }

  function checkedValues(form, name) {
    return Array.from(form.querySelectorAll('input[name="' + name + '"]:checked'))
      .map(function (el) {
        return String(el.value || "").trim();
      })
      .filter(Boolean);
  }

  function buildMessage(form) {
    var enquiryType = enquiryTypeValue(form);
    var product = selectedLabel(form.querySelector("#product"));
    var products = checkedValues(form, "product-interest");
    var partnerType = "";
    var partnerRadio = form.querySelector('input[name="partner-type"]:checked');
    if (partnerRadio) partnerType = String(partnerRadio.value || "").trim();
    var partnerModel = "";
    var modelRadio = form.querySelector('input[name="partner-model"]:checked');
    if (modelRadio) partnerModel = String(modelRadio.value || "").trim();
    var website = fieldValue(form, "#website");
    var country = selectedLabel(form.querySelector("#country")) || fieldValue(form, "#country");
    var customerGroups =
      selectedLabel(form.querySelector("#customer-groups")) || fieldValue(form, "#customer-groups");
    var targetCountry =
      selectedLabel(form.querySelector("#target-country")) || fieldValue(form, "#target-country");
    var startTimeline =
      selectedLabel(form.querySelector("#start-timeline")) || fieldValue(form, "#start-timeline");
    var marketApproach = fieldValue(form, "#market-approach");
    var userMessage = fieldValue(form, "#message");
    var parts = [];
    if (enquiryType) parts.push("Enquiry Type: " + enquiryType);
    if (partnerType) parts.push("Applying as: " + partnerType);
    if (partnerModel) parts.push("Partnership interest: " + partnerModel);
    if (products.length) parts.push("Product interest: " + products.join(", "));
    else if (product) parts.push("Product: " + product);
    if (website) parts.push("Website/profile: " + website);
    if (country) parts.push("Country: " + country);
    if (customerGroups) parts.push("Customer groups: " + customerGroups);
    if (targetCountry) parts.push("Primary target country: " + targetCountry);
    if (startTimeline) parts.push("Start timeline: " + startTimeline);
    if (marketApproach) {
      parts.push("");
      parts.push("Market approach:");
      parts.push(marketApproach);
    }
    if (userMessage && userMessage !== "Partnership enquiry") {
      if (parts.length) parts.push("");
      parts.push(userMessage);
    }
    return parts.join("\n");
  }

  function buildContactPayload(form) {
    var first = fieldValue(form, "#full-name");
    var last = fieldValue(form, "#last-name");
    var org = fieldValue(form, "#org");
    return {
      applicationName: "AAAMT Website",
      fullName: last ? first + " " + last : first,
      emailId: fieldValue(form, "#email"),
      phoneNumber: fieldValue(form, "#phone").replace(/\D/g, ""),
      companyName: org,
      message: buildMessage(form),
    };
  }

  function buildPartnershipPayload(form) {
    var first = fieldValue(form, "#full-name");
    var last = fieldValue(form, "#last-name");
    var org = fieldValue(form, "#org");
    var partnerRadio = form.querySelector('input[name="partner-type"]:checked');
    var applyingAs = partnerRadio ? String(partnerRadio.value || "").trim() : "";
    if (!org && applyingAs === "Independent Professional") {
      org = "Independent Professional";
    }
    var modelRadio = form.querySelector('input[name="partner-model"]:checked');
    return {
      fullName: last ? first + " " + last : first,
      email: fieldValue(form, "#email"),
      phone: fieldValue(form, "#phone").replace(/\D/g, ""),
      applyingAs: applyingAs,
      organisation: org,
      website: fieldValue(form, "#website"),
      productInterest: checkedValues(form, "product-interest"),
      partnershipInterest: modelRadio ? String(modelRadio.value || "").trim() : "",
      customerGroups:
        selectedLabel(form.querySelector("#customer-groups")) ||
        fieldValue(form, "#customer-groups"),
      targetCountry:
        selectedLabel(form.querySelector("#target-country")) ||
        fieldValue(form, "#target-country"),
      startTimeline:
        selectedLabel(form.querySelector("#start-timeline")) ||
        fieldValue(form, "#start-timeline"),
      marketApproach: fieldValue(form, "#market-approach"),
    };
  }

  function validatePartnershipSubmit(form, note) {
    var step2 = form.querySelector('.partner-form-step[data-step="2"]');
    if (step2 && step2.hasAttribute("hidden")) {
      if (note) note.textContent = "Continue to partnership fit before sending.";
      return false;
    }
    var productBoxes = form.querySelectorAll('input[name="product-interest"]');
    if (productBoxes.length) {
      var anyProduct = Array.from(productBoxes).some(function (c) {
        return c.checked;
      });
      if (!anyProduct) {
        productBoxes[0].setAttribute("aria-invalid", "true");
        productBoxes[0].focus();
        if (note) note.textContent = "Select at least one product interest.";
        return false;
      }
    }
    return true;
  }

  function setSubmitting(form, isSubmitting) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    if (isSubmitting) {
      if (!button.dataset.label) button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      button.textContent = "Sending…";
    } else {
      button.disabled = false;
      button.removeAttribute("aria-busy");
      if (button.dataset.label) button.innerHTML = button.dataset.label;
    }
  }

  async function submitPartnershipEnquiry(form, note) {
    var payload = buildPartnershipPayload(form);
    var url = PARTNERSHIP_ENDPOINT;

    setSubmitting(form, true);
    if (note) note.textContent = "Sending your partnership enquiry…";

    try {
      var response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      var data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        var msg =
          (data && data.message) ||
          "Request failed (" + response.status + ")";
        if (data && data.code === "SMTP_NOT_CONFIGURED") {
          msg =
            "Email is not configured on the server yet. Please try again later or email sales@aaamt.in.";
        }
        throw new Error(msg);
      }

      window.location.href = ENQUIRY_THANKS;
    } catch (error) {
      setSubmitting(form, false);
      if (note) {
        note.textContent =
          (error && error.message) ||
          "We could not send your enquiry right now. Please try again or email sales@aaamt.in.";
      }
      if (typeof console !== "undefined" && console.error) {
        console.error("Partnership enquiry failed →", url, error);
      }
    }
  }

  async function submitContactEnquiry(form, note) {
    var payload = buildContactPayload(form);
    var url = enquiryUrl();

    setSubmitting(form, true);
    if (note) note.textContent = "Sending your enquiry…";

    try {
      var response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      var data = null;
      try {
        data = await response.json();
      } catch (e) {
        data = null;
      }

      if (!response.ok) {
        throw new Error((data && data.message) || "Request failed (" + response.status + ")");
      }

      window.location.href = ENQUIRY_THANKS;
    } catch (error) {
      setSubmitting(form, false);
      if (note) {
        note.textContent =
          "We could not send your enquiry right now. Please try again or email sales@aaamt.in.";
      }
      if (typeof console !== "undefined" && console.error) {
        console.error("Enquiry POST failed →", url, error);
      }
    }
  }

  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    var note = form.querySelector("[data-form-note]");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var required = Array.from(form.querySelectorAll("[required]")).filter(function (field) {
        return !field.closest("[hidden]") && !field.closest(".is-hidden-field");
      });
      var missing = required.filter(function (field) {
        if (field.type === "radio") {
          return !form.querySelector('input[name="' + field.name + '"]:checked');
        }
        if (field.type === "checkbox") return !field.checked;
        return !String(field.value || "").trim();
      });
      var seenRadio = {};
      missing = missing.filter(function (field) {
        if (field.type === "radio") {
          if (seenRadio[field.name]) return false;
          seenRadio[field.name] = true;
        }
        return true;
      });
      required.forEach(function (field) {
        field.removeAttribute("aria-invalid");
      });
      if (missing.length) {
        missing.forEach(function (field) {
          field.setAttribute("aria-invalid", "true");
        });
        missing[0].focus();
        if (note) note.textContent = "Complete the required fields before sending.";
        return;
      }

      if (form.hasAttribute("data-partner-steps")) {
        if (!validatePartnershipSubmit(form, note)) return;
        submitPartnershipEnquiry(form, note);
        return;
      }

      if (form.hasAttribute("data-enquiry-api")) {
        submitContactEnquiry(form, note);
        return;
      }

      form.reset();
      if (note) {
        note.textContent =
          "Enquiry recorded in this browser. No server is connected in this local build.";
      }
    });
  });
})();
