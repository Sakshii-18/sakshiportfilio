const progress = document.querySelector("[data-scroll-progress]");

window.addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const percent = max > 0 ? (window.scrollY / max) * 100 : 0;
  if (progress) progress.style.width = `${percent}%`;
});


document.querySelector("[data-back-top]")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.14 });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const countObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const element = entry.target;
    const target = Number(element.dataset.count || 0);
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 34));
    const timer = setInterval(() => {
      current += step;
      element.textContent = current >= target ? `${target}+` : current;
      if (current >= target) clearInterval(timer);
    }, 28);
    countObserver.unobserve(element);
  });
});
document.querySelectorAll("[data-count]").forEach((element) => countObserver.observe(element));

document.querySelectorAll("[data-architecture]").forEach((architecture) => {
  const architectureInfo = architecture.parentElement.querySelector("[data-architecture-info]");
  architecture.querySelectorAll("button").forEach((node) => {
    const showNode = () => {
      if (architectureInfo) {
        architectureInfo.innerHTML = `<strong>${node.dataset.title}</strong><p>${node.dataset.desc}</p>`;
      }
    };
    node.addEventListener("mouseenter", showNode);
    node.addEventListener("focus", showNode);
  });
});

const previewLightbox = document.createElement("div");
previewLightbox.className = "preview-lightbox";
previewLightbox.innerHTML = '<button type="button" aria-label="Close preview">x</button><div data-preview-content></div>';
document.body.append(previewLightbox);
const previewContent = previewLightbox.querySelector("[data-preview-content]");
document.querySelectorAll(".gallery-strip .mock-screen").forEach((screen) => {
  screen.addEventListener("click", () => {
    previewContent.innerHTML = "";
    previewContent.append(screen.cloneNode(true));
    previewLightbox.classList.add("open");
  });
});
previewLightbox.querySelector("button").addEventListener("click", () => previewLightbox.classList.remove("open"));

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const slides = [...carousel.querySelectorAll(".mock-screen")];
  const wrapper = carousel.closest(".gallery-carousel");
  let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains("active")));

  function renderSlide() {
    slides.forEach((slide) => slide.classList.remove("active"));
    slides[index]?.classList.add("active");
  }

  wrapper?.querySelector("[data-carousel-next]")?.addEventListener("click", () => {
    index = (index + 1) % slides.length;
    renderSlide();
  });

  wrapper?.querySelector("[data-carousel-prev]")?.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    renderSlide();
  });

  renderSlide();
});

const enquiryForm = document.querySelector("#enquiryForm");
const toast = document.querySelector("[data-toast]");
const emailConfig = {
  publicKey:             "9AcyqBhVDlw1cMuL2",
  serviceId:             "service_54beuuh",
  templateId:            "template_n8e1p0q",          // Template 1: enquiry to Sakshi
  autoReplyTemplateId:   "template_qdgzdgk" // Template 2: confirmation to client
};
const analyticsConfig = {
  measurementId: "G-XXXXXXXXXX"
};

function isConfigured(value) {
  return value && !value.startsWith("YOUR_") && value !== "G-XXXXXXXXXX";
}

function trackEvent(name, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}

function loadGoogleAnalytics() {
  if (!isConfigured(analyticsConfig.measurementId)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.measurementId}`;
  document.head.append(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(){ window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", analyticsConfig.measurementId);
}

loadGoogleAnalytics();

function setError(field, message) {
  const error = document.querySelector(`[data-error-for="${field}"]`);
  if (error) error.textContent = message;
}

function showStatus(type, message) {
  const status = document.querySelector("[data-form-status]");
  if (status) {
    status.hidden = false;
    status.className = `form-status ${type}`;
    status.textContent = message;
  }
  if (toast) {
    toast.hidden = false;
    toast.className = `toast ${type}`;
    toast.textContent = message;
    setTimeout(() => { toast.hidden = true; }, 4600);
  }
}

function checkedValues(form, name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function validateEmail(email) {
  if (!email) return "Email address is required.";
  if (!email.includes("@")) return "Missing '@' — email should look like you@example.com";
  const [local, domain] = email.split("@");
  if (!local) return "Missing username before '@'.";
  if (!domain) return "Missing domain after '@' — e.g. gmail.com";
  if (!domain.includes(".")) return "Missing domain extension — e.g. '.com' or '.in'";
  const ext = domain.split(".").pop();
  if (ext.length < 2) return "Domain extension too short — should be '.com', '.in', '.org' etc.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Email doesn't look right. Check for spaces or extra characters.";
  return null;
}

function validateForm(data) {
  const errors = {};
  if (data.name.length < 3) errors.name = "Please enter your full name (at least 3 characters).";
  const emailError = validateEmail(data.email);
  if (emailError) errors.email = emailError;
  if (!data.phone) errors.phone = "Phone number is required.";
  else if (!/^\d{10}$/.test(data.phone)) errors.phone = "Enter a valid 10-digit phone number (numbers only, no spaces or dashes).";
  if (!data.service) errors.service = "Please select the service you need.";
  if (!data.budget) errors.budget = "Please select a budget range.";
  if (data.message.length < 20) errors.message = "Please describe your project in at least 20 characters.";
  if (!data.termsAccepted) errors.terms = "Please confirm the information is correct before submitting.";
  return errors;
}

enquiryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(enquiryForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    organization: String(formData.get("organization") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    projectType: String(formData.get("projectType") || "").trim(),
    budget: String(formData.get("budget") || "").trim(),
    timeline: String(formData.get("timeline") || "").trim(),
    features: checkedValues(enquiryForm, "features").join(", "),
    contactMethod: String(formData.get("contactMethod") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    referenceLink: String(formData.get("referenceLink") || "").trim(),
    termsAccepted: Boolean(formData.get("terms"))
  };

  // Clear previous errors
  ["name", "email", "phone", "service", "budget", "message", "terms"].forEach((field) => setError(field, ""));

  const errors = validateForm(payload);
  Object.entries(errors).forEach(([field, message]) => setError(field, message));

  if (Object.keys(errors).length) {
    showStatus("error", "Please fix the highlighted fields before submitting.");
    // Scroll to first error
    const firstErrorField = enquiryForm.querySelector("small:not(:empty)");
    firstErrorField?.closest("label, fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // All good — show success without any backend call
  const submitButton = enquiryForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  // Small delay for feel, then show success
  setTimeout(() => {
    enquiryForm.reset();

    // Hide the form and show a full success message in its place
    const formStatus = document.querySelector("[data-form-status]");
    if (formStatus) {
      formStatus.hidden = false;
      formStatus.className = "form-status success";
      var contactWay = payload.contactMethod || "your preferred contact method";
      formStatus.innerHTML =
        '<div class="success-icon">&#10003;</div>' +
        '<h3>Enquiry Sent Successfully!</h3>' +
        '<p>Thank you, <strong>' + payload.name + '</strong>! Your project enquiry has been received.</p>' +
        '<p>I will review your requirements and get back to you via <strong>' + contactWay + '</strong> within the typical response time.</p>' +
        '<p style="margin-top:0.5rem;opacity:0.8;font-size:0.9em;">A follow-up will be sent to <strong>' + payload.email + '</strong></p>';
      formStatus.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    showStatus("success", "🎉 Enquiry submitted! I'll get back to you soon.");
    submitButton.disabled = false;
    submitButton.textContent = "Send Enquiry";
  }, 800);
});

// ── Typing Animation ──────────────────────────────────────────
const typingEl = document.querySelector("[data-typing]");
if (typingEl) {
  const words = ["Java Developer", "Spring Boot Builder", "Problem Solver", "Full Stack Learner", "BCA Student"];
  let wordIndex = 0, charIndex = 0, deleting = false;

  function typeLoop() {
    const word = words[wordIndex];
    if (!deleting) {
      typingEl.textContent = word.slice(0, ++charIndex);
      if (charIndex === word.length) {
        deleting = true;
        setTimeout(typeLoop, 1600);
        return;
      }
    } else {
      typingEl.textContent = word.slice(0, --charIndex);
      if (charIndex === 0) {
        deleting = false;
        wordIndex = (wordIndex + 1) % words.length;
      }
    }
    setTimeout(typeLoop, deleting ? 60 : 100);
  }
  typeLoop();
}

// ── Dark / Light Mode Toggle ──────────────────────────────────
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = themeToggle?.querySelector("i");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  if (themeIcon) {
    themeIcon.className = theme === "light" ? "fa-solid fa-sun" : "fa-solid fa-moon";
  }
}

const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

themeToggle?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "light" ? "dark" : "light");
});

// ── Scroll-to-Top: only show after 300px ─────────────────────
const backTop = document.querySelector("[data-back-top]");
function toggleBackTop() {
  if (!backTop) return;
  backTop.classList.toggle("visible", window.scrollY > 300);
}
window.addEventListener("scroll", toggleBackTop, { passive: true });
toggleBackTop();

// ── Active Nav Highlight on Scroll (homepage sections) ────────
const navLinks = document.querySelectorAll(".nav a");
const sections = document.querySelectorAll("main section[id]");

if (sections.length) {
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => link.classList.remove("active"));
        const active = document.querySelector(`.nav a[href="#${entry.target.id}"], .nav a[href*="${entry.target.id}"]`);
        if (active) active.classList.add("active");
      }
    });
  }, { threshold: 0.4 });
  sections.forEach((s) => navObserver.observe(s));
}

document.querySelectorAll("[data-back-top]").forEach((button) => {
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
});

document.querySelectorAll("[data-page-url]").forEach((input) => {
  input.value = window.location.href;
});

async function loadVisitorGeo() {
  const cached = sessionStorage.getItem("visitor_geo_summary");
  if (cached) {
    window.portfolioVisitorLocation = cached;
    document.querySelectorAll("[data-visitor-location]").forEach((input) => {
      input.value = cached;
    });
    return;
  }

  try {
    const response = await fetch("https://ipapi.co/json/");
    if (!response.ok) return;
    const data = await response.json();
    const summary = [data.city, data.region, data.country_name].filter(Boolean).join(", ");
    if (!summary) return;
    sessionStorage.setItem("visitor_geo_summary", summary);
    window.portfolioVisitorLocation = summary;
    document.querySelectorAll("[data-visitor-location]").forEach((input) => {
      input.value = summary;
    });
    trackEvent("visitor_geo", {
      city: data.city || "unknown",
      region: data.region || "unknown",
      country: data.country_name || "unknown"
    });
  } catch (error) {
    window.portfolioVisitorLocation = "Not available";
  }
}

loadVisitorGeo();

enquiryForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();

  const formData = new FormData(enquiryForm);
  const payload = {
    name: String(formData.get("name") || "").trim(),
    email: String(formData.get("email") || "").trim(),
    phone: String(formData.get("phone") || "").trim(),
    organization: String(formData.get("organization") || "").trim(),
    service: String(formData.get("service") || "").trim(),
    projectType: String(formData.get("projectType") || "").trim(),
    budget: String(formData.get("budget") || "").trim(),
    timeline: String(formData.get("timeline") || "").trim(),
    features: checkedValues(enquiryForm, "features").join(", "),
    contactMethod: String(formData.get("contactMethod") || "").trim(),
    message: String(formData.get("message") || "").trim(),
    referenceLink: String(formData.get("referenceLink") || "").trim(),
    termsAccepted: Boolean(formData.get("terms"))
  };

  ["name", "email", "phone", "service", "budget", "message", "terms"].forEach((field) => setError(field, ""));

  const errors = validateForm(payload);
  Object.entries(errors).forEach(([field, message]) => setError(field, message));

  if (Object.keys(errors).length) {
    showStatus("error", "Please fix the highlighted fields before submitting.");
    const firstErrorField = enquiryForm.querySelector("small:not(:empty)");
    firstErrorField?.closest("label, fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const locationInput = enquiryForm.querySelector("[data-visitor-location]");
  const pageInput = enquiryForm.querySelector("[data-page-url]");
  if (locationInput) locationInput.value = window.portfolioVisitorLocation || "Not available";
  if (pageInput) pageInput.value = window.location.href;

  const submitButton = enquiryForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const emailReady =
      window.emailjs &&
      isConfigured(emailConfig.publicKey) &&
      isConfigured(emailConfig.serviceId) &&
      isConfigured(emailConfig.templateId);

    if (emailReady) {
      window.emailjs.init({ publicKey: emailConfig.publicKey });

      // Send enquiry to Sakshi
      await window.emailjs.sendForm(emailConfig.serviceId, emailConfig.templateId, enquiryForm);

      // Send auto-reply confirmation to client
      const autoReplyConfigured =
        isConfigured(emailConfig.autoReplyTemplateId) &&
        emailConfig.autoReplyTemplateId !== "YOUR_EMAILJS_AUTOREPLY_TEMPLATE_ID";

      if (autoReplyConfigured) {
        await window.emailjs.send(emailConfig.serviceId, emailConfig.autoReplyTemplateId, {
          to_name:    payload.name,
          to_email:   payload.email,
          service:    payload.service    || "Not specified",
          budget:     payload.budget     || "Not specified",
          timeline:   payload.timeline   || "Not specified",
          contact:    payload.contactMethod || "Any method",
          message:    payload.message    || "",
          reply_time: "Within 24 hours (WhatsApp) or 1-2 business days (Email)"
        });
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    enquiryForm.reset();
    const formStatus = document.querySelector("[data-form-status]");
    if (formStatus) {
      formStatus.hidden = false;
      formStatus.className = "form-status success";
      const heading = emailReady ? "Enquiry Sent Successfully!" : "Enquiry Validated Successfully";
      const bodyMsg = emailReady
        ? "Your enquiry has been received. A confirmation has been sent to <strong>" + payload.email + "</strong>."
        : "EmailJS keys still need to be added before emails are delivered.";
      const replyMethod = payload.contactMethod || "Any method";
      formStatus.innerHTML =
        '<div class="success-icon">&#10003;</div>' +
        '<h3>' + heading + '</h3>' +
        '<p>Thank you, <strong>' + payload.name + '</strong>! ' + bodyMsg + '</p>' +
        '<p>Preferred reply method: <strong>' + replyMethod + '</strong></p>' +
        '<p class="form-confirm-note">Expected response: WhatsApp within 24hrs &bull; Email within 1-2 business days</p>';
      formStatus.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    trackEvent("enquiry_submit", {
      service: payload.service,
      budget: payload.budget,
      location: window.portfolioVisitorLocation || "unknown"
    });
    if (toast) {
      toast.hidden = false;
      toast.className = "toast success";
      toast.textContent = emailReady
        ? "Enquiry sent! Check your email for confirmation."
        : "Form works. Add EmailJS keys to send real emails.";
      setTimeout(() => { toast.hidden = true; }, 5000);
    }
  } catch (error) {
    showStatus("error", "Something went wrong while sending. Please try WhatsApp or email directly.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Enquiry";
  }
}, true);

// ── Project Fit Finder ────────────────────────────────────────
const finderContainer = document.querySelector("[data-project-finder]");
const finderResult    = document.querySelector("[data-finder-result]");
if (finderContainer && finderResult) {
  finderContainer.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      finderContainer.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      finderResult.querySelector("h3").textContent    = btn.dataset.fitTitle || "";
      finderResult.querySelector("p").textContent     = btn.dataset.fitDesc  || "";
      finderResult.querySelector("small").textContent = btn.dataset.fitStack
        ? `Suggested stack: ${btn.dataset.fitStack}` : "";
      finderResult.style.animation = "none";
      finderResult.offsetHeight; // reflow
      finderResult.style.animation = "fadeUp 400ms ease forwards";
    });
  });
}

// ── Subtle card entrance stagger ─────────────────────────────
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.transitionDelay = `${i * 60}ms`;
      entry.target.classList.add("visible");
      staggerObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".choice-card, .featured-project-card, .testimonial-card").forEach(
  (card) => staggerObserver.observe(card)
);

// ═══════════════════════════════════════════════════════════════
// FEATURE 5 — ANIMATED TERMINAL
// ═══════════════════════════════════════════════════════════════
(function initTerminal() {
  const body = document.getElementById("terminalBody");
  if (!body) return;

  const lines = [
    { type: "cmd",  text: "initializing project..." },
    { type: "out",  text: "✓ Spring Boot API connected",   gold: false },
    { type: "cmd",  text: "loading database schema..." },
    { type: "out",  text: "✓ MySQL tables ready",           gold: false },
    { type: "cmd",  text: "building frontend..." },
    { type: "out",  text: "✓ UI components loaded",         gold: false },
    { type: "cmd",  text: "running deployment check..." },
    { type: "out",  text: "🚀 Project deployed successfully!", gold: true  },
  ];

  let i = 0;
  function printNext() {
    if (i >= lines.length) {
      // restart after pause
      setTimeout(() => {
        body.innerHTML = "";
        i = 0;
        printNext();
      }, 3200);
      return;
    }
    const l = lines[i];
    const row = document.createElement("div");
    row.className = "t-line";

    if (l.type === "cmd") {
      row.innerHTML = '<span class="t-prompt">&#10095;</span><span class="t-cmd"></span><span class="t-cursor"></span>';
      body.appendChild(row);
      setTimeout(() => row.classList.add("show"), 30);
      const cmdSpan    = row.querySelector(".t-cmd");
      const cursorSpan = row.querySelector(".t-cursor");
      let ci = 0;
      const typeInterval = setInterval(() => {
        cmdSpan.textContent += l.text[ci++];
        if (ci >= l.text.length) {
          clearInterval(typeInterval);
          cursorSpan.remove();
          i++;
          setTimeout(printNext, 260);
        }
      }, 38);
    } else {
      var cls = l.gold ? "t-out gold" : "t-out";
      row.innerHTML = '<span class="' + cls + '">' + l.text + '</span>';
      body.appendChild(row);
      setTimeout(() => row.classList.add("show"), 30);
      i++;
      setTimeout(printNext, 520);
    }
  }
  printNext();
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 1 — LIVE COST ESTIMATOR
// ═══════════════════════════════════════════════════════════════
(function initEstimator() {
  const wrap = document.querySelector(".estimator-wrap");
  if (!wrap) return;

  const costEl  = document.getElementById("estCost");
  const rangeEl = document.getElementById("estRange");
  const timeEl  = document.getElementById("estTime");

  function fmt(n) {
    return "₹" + n.toLocaleString("en-IN");
  }
  function fmtWeeks(w) {
    if (w < 1)  return "3–5 Days";
    if (w === 1) return "1 Week";
    if (w < 4)  return Math.round(w) + " Weeks";
    return Math.ceil(w / 4) + " Month" + (Math.ceil(w / 4) > 1 ? "s" : "") + "+";
  }
  function bump(el) {
    el.classList.remove("est-bump");
    void el.offsetWidth;
    el.classList.add("est-bump");
  }

  function recalc() {
    let cost = 0, weeks = 0;

    wrap.querySelectorAll(".est-group").forEach(group => {
      group.querySelectorAll(".est-btn.active").forEach(btn => {
        cost  += parseFloat(btn.dataset.cost  || 0);
        weeks += parseFloat(btn.dataset.time  || 0);
      });
    });

    const lo = Math.round(cost * 0.85 / 500) * 500;
    const hi = Math.round(cost * 1.20 / 500) * 500;

    costEl.textContent  = fmt(cost);
    rangeEl.textContent = `Range: ${fmt(lo)} – ${fmt(hi)}`;
    timeEl.textContent  = fmtWeeks(weeks);

    bump(costEl);
    bump(timeEl);
  }

  wrap.querySelectorAll(".est-group").forEach(group => {
    const isSingle = group.hasAttribute("data-single");
    group.querySelectorAll(".est-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        if (isSingle) {
          group.querySelectorAll(".est-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        } else {
          btn.classList.toggle("active");
        }
        recalc();
      });
    });
  });

  recalc(); // set initial values
})();

// ═══════════════════════════════════════════════════════════════
// FEATURE 4 — HIRING INTENT NUDGE
// ═══════════════════════════════════════════════════════════════
(function initIntentNudge() {
  // Don't show on contact page — they're already there
  if (window.location.pathname.includes("contact")) return;
  // Don't show if already dismissed this session
  if (sessionStorage.getItem("nudgeDismissed")) return;

  // Inject nudge HTML
  const nudge = document.createElement("div");
  nudge.className = "intent-nudge";
  nudge.setAttribute("role", "complementary");
  nudge.setAttribute("aria-label", "Project inquiry prompt");
  nudge.innerHTML =
    '<button class="intent-nudge-close" aria-label="Dismiss">&times;</button>' +
    '<div class="intent-nudge-icon">&#128075;</div>' +
    '<div class="intent-nudge-body">' +
      '<strong>Thinking about a project?</strong>' +
      '<p>You have been exploring for a while &mdash; want to discuss your idea on WhatsApp?</p>' +
      '<div class="intent-nudge-actions">' +
        '<a class="nudge-yes" href="https://wa.me/917499683725?text=Hi%20Sakshi%2C%20I%20saw%20your%20portfolio%20and%20would%20like%20to%20discuss%20a%20project." target="_blank" rel="noopener">' +
          '<i class="fa-brands fa-whatsapp"></i> Let us Chat' +
        '</a>' +
        '<button class="nudge-no">Maybe Later</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(nudge);

  function dismiss() {
    nudge.classList.remove("show");
    sessionStorage.setItem("nudgeDismissed", "1");
  }

  nudge.querySelector(".intent-nudge-close").addEventListener("click", dismiss);
  nudge.querySelector(".nudge-no").addEventListener("click", dismiss);
  nudge.querySelector(".nudge-yes").addEventListener("click", () => {
    sessionStorage.setItem("nudgeDismissed", "1");
  });

  // Show after 90 seconds OR after scrolling 60% of page — whichever comes first
  let shown = false;
  function show() {
    if (shown || sessionStorage.getItem("nudgeDismissed")) return;
    shown = true;
    nudge.classList.add("show");
  }

  const timer = setTimeout(show, 90000);

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight);
      if (scrolled > 0.6) show();
      ticking = false;
    });
  });

  // Also track visits — show sooner on repeat visit
  const visits = parseInt(localStorage.getItem("portfolioVisits") || "0") + 1;
  localStorage.setItem("portfolioVisits", visits);
  if (visits >= 2) setTimeout(show, 45000);
})();