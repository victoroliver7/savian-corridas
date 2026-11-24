"use strict";

const form = document.querySelector("#booking-form");
const feedback = document.querySelector("#form-feedback");
const messagePreview = document.querySelector("#message-preview");
const preparedMessage = document.querySelector("#prepared-message");
const shareButton = document.querySelector("#share-message");
const whatsappNumber = form.dataset.whatsappNumber;
const dateInput = form.querySelector('input[name="data"]');
const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(0, 10);
dateInput.min = localToday;
document.querySelector("#current-year").textContent = String(today.getFullYear());
shareButton.hidden = typeof navigator.share !== "function";
document.querySelector("#footer-whatsapp").href = `https://wa.me/${whatsappNumber}`;

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Abrir menu" : "Fechar menu");
  mainNav.classList.toggle("is-open", !isOpen);
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  feedback.textContent = "";

  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const departureDate = new Date(`${data.get("data")}T00:00:00`);
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
  }).format(departureDate);
  const details = String(data.get("detalhes") || "").trim();
  const message = [
    "Olá! Gostaria de consultar uma corrida com a Savian Corridas.",
    "",
    `📍 Origem: ${data.get("origem")}`,
    `📍 Destino: ${data.get("destino")}`,
    `📅 Data: ${dateLabel}`,
    `🕒 Horário: ${data.get("horario")}`,
    `👥 Passageiros: ${data.get("passageiros")}`,
    ...(details ? [`📝 Detalhes: ${details}`] : []),
    "",
    "Você pode confirmar a disponibilidade e o valor, por favor?",
  ].join("\n");
  preparedMessage.value = message;
  document.querySelector("#send-whatsapp").href =
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  messagePreview.hidden = false;
  feedback.textContent = "Pedido pronto. Revise a mensagem e envie pelo WhatsApp para a Savian.";
});

shareButton.addEventListener("click", async () => {
  try {
    await navigator.share({ text: preparedMessage.value });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return;
    feedback.textContent = "Não foi possível abrir o compartilhamento. Copie a mensagem abaixo.";
  }
});

document.querySelector("#copy-message").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(preparedMessage.value);
    feedback.textContent = "Mensagem copiada. Agora é só colar na conversa do WhatsApp.";
  } catch {
    preparedMessage.focus();
    preparedMessage.select();
    const copied = document.execCommand("copy");
    feedback.textContent = copied
      ? "Mensagem copiada. Agora é só colar na conversa do WhatsApp."
      : "Selecione e copie o texto acima para enviar pelo WhatsApp.";
  }
});

if ("IntersectionObserver" in window) {
  document.documentElement.classList.add("reveal-ready");
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll(".benefit-card, .step").forEach((element) => {
    revealObserver.observe(element);
  });
}
