import { tryCatch } from "@eoussama/core";



/*
 * "Copy my email": puts the address on the clipboard and says so for a moment. Where
 * the clipboard is out of reach, it opens a new email instead.
 */

const button = document.querySelector<HTMLButtonElement>("[data-copy]");
const status = document.querySelector<HTMLElement>("[data-copy-status]");
let timer = 0;

/**
 * Copies the email address, with a short "Copied" on the button when there is one.
 *
 * @returns Once the address is copied, or a new email is opened instead
 */
export async function copyEmail() {
  const email = button?.dataset.copy ?? "oussama.essamadi@gmail.com";
  const [error] = await tryCatch(() => navigator.clipboard.writeText(email));

  if (error) {
    location.href = `mailto:${email}`;

    return;
  }

  if (!button) {
    return;
  }

  const label = button.dataset.label ?? button.textContent ?? "";

  button.dataset.label = label;
  button.textContent = button.dataset.copied ?? label;
  button.toggleAttribute("data-done", true);

  if (status) {
    status.textContent = button.dataset.copiedLong ?? "";
  }

  clearTimeout(timer);
  timer = window.setTimeout(() => {
    button.textContent = label;
    button.removeAttribute("data-done");

    if (status) {
      status.textContent = "";
    }
  }, 1600);
}

button?.addEventListener("click", copyEmail);
