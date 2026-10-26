/* ==========================================================
   Omar Walid Personal Coaching — Behaviour
   - Mobile navigation
   - Package selection -> shared application form
   - Validation + WhatsApp message generation (no backend)
   - Scroll reveal / active nav link
   ========================================================== */

(function () {
  "use strict";

  var OMAR_WHATSAPP_INTL = "201106971435"; // 01106971435 in international format

  /* ---------- Pure helpers (also exported for tests) ---------- */

  function cleanPhone(raw) {
    var s = String(raw || "").trim().replace(/[\s\-().]/g, "");
    if (s.indexOf("00") === 0) s = "+" + s.slice(2);
    return s;
  }

  // Accepts Egyptian local (01XXXXXXXXX), Egyptian international (+20 1XXXXXXXXX),
  // and other international numbers (8-15 digits, optional +).
  function isValidPhone(raw) {
    var s = cleanPhone(raw);
    if (/^01[0125]\d{8}$/.test(s)) return true;
    if (/^\+201[0125]\d{8}$/.test(s)) return true;
    return /^\+?[1-9]\d{7,14}$/.test(s);
  }

  function formatEgp(n) {
    return Number(n).toLocaleString("en-US");
  }

  function buildMessage(d) {
    var lines = [
      "أهلًا كابتن عمر، أنا " + d.name + "، وعايز أقدم على برنامج الكوتشينج.",
      "",
      "رقم الواتساب: " + d.phone,
      "الهدف التدريبي: " + d.goal,
      "الباقة المختارة: " + d.packageName,
      "المدة: " + d.duration,
      "السعر: " + formatEgp(d.price) + " جنيه مصري",
      ""
    ];
    if (d.notes && d.notes.trim()) {
      lines.push("ملاحظات إضافية: " + d.notes.trim(), "");
    }
    lines.push("مستعد أعرف الخطوات التالية للاشتراك. شكرًا!");
    return lines.join("\n");
  }

  function buildWhatsAppUrl(message) {
    return "https://wa.me/" + OMAR_WHATSAPP_INTL + "?text=" + encodeURIComponent(message);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { cleanPhone: cleanPhone, isValidPhone: isValidPhone, buildMessage: buildMessage, buildWhatsAppUrl: buildWhatsAppUrl, formatEgp: formatEgp };
  }
  if (typeof document === "undefined") return;

  /* ---------- DOM ---------- */
  document.documentElement.classList.add("js");

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Mobile navigation ---------- */
  var nav = $("#main-nav");
  var toggle = $(".nav-toggle");

  function setNav(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
  }
  toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
  $$("a", nav).forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setNav(false); toggle.focus(); }
  });

  /* ---------- Package selection ---------- */
  var selectedPlan = null;
  var cards = $$(".package-card");
  var planBox = $("#selected-plan");
  var planContent = $("#selected-plan-content");
  var form = $("#apply-form");
  var submitBtn = $("#submit-btn");

  function readPlan(card) {
    var price = parseInt(card.getAttribute("data-price"), 10);
    var id = card.getAttribute("data-package-id");
    var name = card.getAttribute("data-name");
    var duration = card.getAttribute("data-duration");
    if (!id || !name || !duration || !(price > 0)) return null;
    return { id: id, name: name, duration: duration, price: price };
  }

  function renderPlan() {
    planContent.textContent = "";
    if (!selectedPlan) {
      planBox.classList.add("is-empty");
      var p = document.createElement("p");
      p.className = "plan-empty-msg";
      p.appendChild(document.createTextNode("لسه ماختارتش باقة. "));
      var a = document.createElement("a");
      a.href = "#packages";
      a.textContent = "اختار باقتك الأول";
      p.appendChild(a);
      planContent.appendChild(p);
      submitBtn.setAttribute("aria-disabled", "true");
      return;
    }
    planBox.classList.remove("is-empty");
    submitBtn.removeAttribute("aria-disabled");
    var row = document.createElement("div");
    row.className = "plan-line";
    var left = document.createElement("div");
    var nm = document.createElement("div");
    nm.className = "plan-name";
    nm.textContent = selectedPlan.name;
    var meta = document.createElement("div");
    meta.className = "plan-meta";
    meta.textContent = "المدة: " + selectedPlan.duration;
    left.appendChild(nm);
    left.appendChild(meta);
    var price = document.createElement("div");
    price.className = "plan-price";
    price.textContent = "EGP " + formatEgp(selectedPlan.price);
    row.appendChild(left);
    row.appendChild(price);
    planContent.appendChild(row);
  }

  function selectPlan(card) {
    var plan = readPlan(card);
    if (!plan) return;
    selectedPlan = plan;
    cards.forEach(function (c) { c.classList.toggle("is-selected", c === card); });
    hideHandoff();
    renderPlan();
    var target = $("#apply");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    setTimeout(function () { $("#fullName").focus({ preventScroll: true }); }, reduce ? 0 : 500);
  }

  cards.forEach(function (card) {
    var btn = $(".apply-btn", card);
    if (btn) btn.addEventListener("click", function () { selectPlan(card); });
  });

  /* ---------- Validation ---------- */
  function setError(input, msg) {
    var err = $("#" + input.id + "-error");
    if (err) err.textContent = msg || "";
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
  }

  function validate() {
    var name = $("#fullName"), phone = $("#phone"), goal = $("#goal");
    var firstBad = null;

    if (name.value.trim().length < 2) { setError(name, "اكتب اسمك بالكامل."); firstBad = firstBad || name; }
    else setError(name, "");

    if (!phone.value.trim()) { setError(phone, "اكتب رقم الواتساب بتاعك."); firstBad = firstBad || phone; }
    else if (!isValidPhone(phone.value)) { setError(phone, "الرقم مش مظبوط. مثال: 01012345678 أو +201012345678"); firstBad = firstBad || phone; }
    else setError(phone, "");

    if (!goal.value) { setError(goal, "اختار هدفك الأساسي."); firstBad = firstBad || goal; }
    else setError(goal, "");

    return firstBad;
  }

  ["fullName", "phone", "goal"].forEach(function (id) {
    var el = document.getElementById(id);
    el.addEventListener("input", function () { if (el.getAttribute("aria-invalid")) setError(el, ""); });
    el.addEventListener("change", function () { if (el.getAttribute("aria-invalid")) setError(el, ""); });
  });

  /* ---------- WhatsApp hand-off ---------- */
  var handoff = $("#handoff");
  var preview = $("#message-preview");
  var retry = $("#retry-wa");
  var statusEl = $("#handoff-status");
  var copyStatus = $("#copy-status");
  var READY_MSG = "تم تجهيز طلبك. هيفتح واتساب برسالة جاهزة تقدر تراجعها وتبعتها للكابتن عمر.";

  function hideHandoff() { handoff.hidden = true; copyStatus.textContent = ""; }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedPlan) {
      renderPlan();
      $("#packages").scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    var bad = validate();
    if (bad) { bad.focus(); return; }

    var message = buildMessage({
      name: $("#fullName").value.trim(),
      phone: cleanPhone($("#phone").value),
      goal: $("#goal").value,
      packageName: selectedPlan.name,
      duration: selectedPlan.duration,
      price: selectedPlan.price,
      notes: $("#notes").value
    });
    var url = buildWhatsAppUrl(message);
    console.log("WhatsApp URL:", url);

    preview.value = message;
    retry.href = url;
    statusEl.textContent = READY_MSG;
    copyStatus.textContent = "";
    handoff.hidden = false;

    var win = null;
    try { win = window.open(url, "_blank"); if (win) win.opener = null; } catch (err) { win = null; }
    if (!win) {
      statusEl.textContent = READY_MSG + " لو واتساب ماتفتحش، دوس «افتح واتساب تاني» أو انسخ الرسالة وابعتها يدوي.";
    }
    handoff.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  $("#copy-msg").addEventListener("click", function () {
    var text = preview.value;
    function done(ok) { copyStatus.textContent = ok ? "تم نسخ الرسالة." : "ماقدرناش ننسخ تلقائي. حدد النص وانسخه يدوي."; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { done(true); }, function () { fallbackCopy(); });
    } else { fallbackCopy(); }
    function fallbackCopy() {
      preview.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
      done(ok);
    }
  });

  /* ---------- Scroll reveal ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Active nav link ---------- */
  if ("IntersectionObserver" in window) {
    var links = $$('.main-nav li a');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (l) { l.classList.remove("is-active"); l.removeAttribute("aria-current"); });
          map[en.target.id].classList.add("is-active");
          map[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) spy.observe(s); });
  }

  /* ---------- Init ---------- */
  var yr = $("#year");
  if (yr) yr.textContent = new Date().getFullYear();
  renderPlan();
})();
