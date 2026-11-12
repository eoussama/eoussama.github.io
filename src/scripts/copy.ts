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

  const win = button.querySelector<HTMLElement>("[data-copy-label]");
  const label = button.dataset.label ?? win?.textContent ?? "";

  button.dataset.label = label;
  button.toggleAttribute("data-done", true);

  if (win) {
    slide(win, button.dataset.copied ?? label);
  }

  if (status) {
    status.textContent = button.dataset.copiedLong ?? "";
  }

  clearTimeout(timer);
  timer = window.setTimeout(() => {
    button.removeAttribute("data-done");

    if (win) {
      slide(win, label);
    }

    if (status) {
      status.textContent = "";
    }
  }, 1600);
}

let settle: (() => void) | null = null;

/**
 * Changes the words in the button's window: the new ones rise in from below as the
 * old leave through the top, and the window takes the new words' width.
 *
 * @param win - The window
 * @param text - The new words
 */
function slide(win: HTMLElement, text: string) {
  settle?.();

  const old = win.lastElementChild as HTMLElement | null;

  if (!old || old.textContent === text) {
    return;
  }

  const next = document.createElement("span");

  next.className = "cp-t";
  next.textContent = text;

  const done = () => {
    settle = null;
    win.replaceChildren(next);
    win.style.removeProperty("width");
  };

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    done();

    return;
  }

  const from = win.getBoundingClientRect().width;

  win.append(next);

  const to = next.getBoundingClientRect().width;
  const options: KeyframeAnimationOptions = { duration: 420, easing: "cubic-bezier(.55,0,.15,1)" };
  const moves = [
    old.animate([{ transform: "none" }, { transform: "translateY(-105%)" }], { ...options, fill: "forwards" }),
    next.animate([{ transform: "translateY(105%)" }, { transform: "none" }], options),
    win.animate([{ width: `${from}px` }, { width: `${to}px` }], options),
  ];

  settle = () => {
    moves.forEach(move => move.cancel());
    done();
  };
  Promise.all(moves.map(move => move.finished)).then(done, () => {});
}

button?.addEventListener("click", copyEmail);
