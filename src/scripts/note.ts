/*
 * The command menu and the shortcuts are notes that unfold as they open (in CSS) and
 * fold back up as they close. A native dialog closes at once, so closing goes through
 * here: the note folds, then the dialog closes. Escape does the same.
 */

const FOLD = 340;

/**
 * Folds a note away, then closes its dialog.
 *
 * @param dialog - The dialog
 * @param instant - Whether to close at once, as when leaving the page
 * @returns Once it is closed
 */
export function closeNote(dialog: HTMLDialogElement, instant = false): Promise<void> {
  if (!dialog.open) {
    return Promise.resolve();
  }

  const close = () => {
    dialog.classList.remove("is-closing");
    dialog.close();
  };

  if (instant || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    close();

    return Promise.resolve();
  }

  if (dialog.classList.contains("is-closing")) {
    return new Promise(resolve => window.setTimeout(resolve, FOLD));
  }

  dialog.classList.add("is-closing");

  return new Promise((resolve) => {
    window.setTimeout(() => {
      // Opened again while folding: it stays.
      if (dialog.classList.contains("is-closing")) {
        close();
      }

      resolve();
    }, FOLD);
  });
}

/**
 * Opens a note, or keeps it open if it was folding away.
 *
 * @param dialog - The dialog
 */
export function openNote(dialog: HTMLDialogElement) {
  dialog.classList.remove("is-closing");

  if (!dialog.open) {
    dialog.showModal();
  }
}

/**
 * Lets Escape and a click on the veil around a note fold it away.
 *
 * @param dialog - The dialog
 */
export function foldOnDismiss(dialog: HTMLDialogElement) {
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeNote(dialog);
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeNote(dialog);
    }
  });
}
