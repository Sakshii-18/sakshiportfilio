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

function validateForm(data) {
  const errors = {};
  if (data.name.length < 3) errors.name = "Please enter your full name. Minimum 3 characters.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!/^\d{10}$/.test(data.phone)) errors.phone = "Enter a valid 10-digit phone number. Numbers only.";
  if (!data.service) errors.service = "Please select a service.";
  if (!data.budget) errors.budget = "Please select a budget range.";
  if (data.message.length < 20) errors.message = "Please describe your project. Minimum 20 characters.";
  if (!data.termsAccepted) errors.terms = "Please accept before submitting.";
  return errors;
}

enquiryForm?.addEventListener("submit", async (event) => {
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

  ["name", "email", "phone", "service", "budget", "message", "terms"].forEach((field) => setError(field, ""));
  const errors = validateForm(payload);
  Object.entries(errors).forEach(([field, message]) => setError(field, message));
  if (Object.keys(errors).length) {
    showStatus("error", "Please fix the highlighted fields.");
    return;
  }

  const submitButton = enquiryForm.querySelector("button[type='submit']");
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch("http://localhost:8080/enquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Unable to submit enquiry.");
    enquiryForm.reset();
    showStatus("success", "Thank you for your enquiry. Your project request has been received successfully. I will review your requirements and get back to you soon.");
  } catch (error) {
    showStatus("error", error.message || "Something went wrong. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Send Enquiry";
  }
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