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
  const historyEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    origem: String(data.get("origem") || ""),
    destino: String(data.get("destino") || ""),
    data: String(data.get("data") || ""),
    horario: String(data.get("horario") || ""),
    passageiros: String(data.get("passageiros") || ""),
    detalhes: details,
    status: "agendada",
    criadaEm: new Date().toISOString(),
  };
  const storedHistory = JSON.parse(localStorage.getItem("savian-corridas-historico") || "[]");
  storedHistory.unshift(historyEntry);
  localStorage.setItem("savian-corridas-historico", JSON.stringify(storedHistory));
  const message = [
    "Olá! Gostaria de consultar uma corrida com a Savian Corridas.",
    "",
    `🚏 Embarque na rodoviária: ${data.get("origem")}`,
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

const historyDialog = document.querySelector("#history-dialog");
const historyLogin = document.querySelector("#history-login");
const historyContent = document.querySelector("#history-content");
const historyBody = document.querySelector("#history-body");
const historyFeedback = document.querySelector("#history-feedback");
const adminPasswordHash = "90c60ae0fbb59dc226132ca7850ca3d827c010bf8f6a32ac5f2ee15561c19a4e";

async function sha256(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem("savian-corridas-historico") || "[]");
  } catch {
    return [];
  }
}

function formatHistoryDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date);
}

function renderHistory() {
  const entries = getHistory();
  const scheduled = entries.filter((entry) => entry.status === "agendada").length;
  const completed = entries.filter((entry) => entry.status === "realizada").length;
  document.querySelector("#history-scheduled").textContent = `${scheduled} agendada${scheduled === 1 ? "" : "s"}`;
  document.querySelector("#history-completed").textContent = `${completed} realizada${completed === 1 ? "" : "s"}`;

  historyBody.innerHTML = "";
  if (!entries.length) {
    historyBody.innerHTML = '<tr><td colspan="6" class="history-empty">Nenhuma corrida registrada neste navegador.</td></tr>';
    return;
  }

  entries.forEach((entry) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatHistoryDate(entry.data)}</td>
      <td><strong>${escapeHistoryHtml(entry.origem)}</strong><br><span>para ${escapeHistoryHtml(entry.destino)}</span></td>
      <td>${escapeHistoryHtml(entry.horario)}<br><small>${escapeHistoryHtml(entry.detalhes || "-")}</small></td>
      <td>${escapeHistoryHtml(entry.passageiros)}</td>
      <td>
        <select class="history-status" data-id="${entry.id}" aria-label="Status da corrida">
          <option value="agendada"${entry.status === "agendada" ? " selected" : ""}>Agendada</option>
          <option value="realizada"${entry.status === "realizada" ? " selected" : ""}>Realizada</option>
        </select>
      </td>
      <td><button class="history-delete" type="button" data-id="${entry.id}" aria-label="Excluir corrida">Excluir</button></td>
    `;
    historyBody.appendChild(row);
  });
}

function escapeHistoryHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value || "");
  return element.innerHTML;
}

document.querySelector("#history-access").addEventListener("click", () => {
  historyFeedback.textContent = "";
  historyDialog.showModal();
});

document.querySelector("#history-close").addEventListener("click", () => {
  historyDialog.close();
});

historyLogin.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.querySelector("#history-password").value;
  const enteredHash = await sha256(password);
  if (enteredHash !== adminPasswordHash) {
    historyFeedback.textContent = "Senha incorreta.";
    return;
  }
  historyFeedback.textContent = "";
  historyLogin.hidden = true;
  historyContent.hidden = false;
  renderHistory();
});

historyBody.addEventListener("change", (event) => {
  if (!event.target.matches(".history-status")) return;
  const entries = getHistory();
  const entry = entries.find((item) => item.id === event.target.dataset.id);
  if (!entry) return;
  entry.status = event.target.value;
  localStorage.setItem("savian-corridas-historico", JSON.stringify(entries));
  renderHistory();
});

historyBody.addEventListener("click", (event) => {
  const deleteButton = event.target.closest(".history-delete");
  if (!deleteButton) return;
  if (!window.confirm("Excluir esta corrida do histórico?")) return;
  const entries = getHistory().filter((item) => item.id !== deleteButton.dataset.id);
  localStorage.setItem("savian-corridas-historico", JSON.stringify(entries));
  renderHistory();
});

document.querySelector("#history-clear").addEventListener("click", () => {
  if (!window.confirm("Limpar todas as corridas deste navegador?")) return;
  localStorage.removeItem("savian-corridas-historico");
  renderHistory();
});
