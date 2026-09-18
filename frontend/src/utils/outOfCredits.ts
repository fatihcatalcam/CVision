import toast from 'react-hot-toast';

/**
 * The moment someone runs out of credits is the only moment they are ready to
 * buy some, and it used to be a dead end.
 *
 * The backend refuses with 402 and an English sentence ("Not enough credits:
 * this costs 2, you have 1."). Every caller put that sentence straight into a
 * red toast - in English, on a Turkish page, with nothing to click - and the
 * two cover-letter buttons swallowed the error entirely, so the button just
 * stopped spinning. The backend's own docstring says the frontend "offers a
 * top-up"; nothing ever did.
 *
 * Status, not message: the text is for humans reading logs and may change,
 * while 402 is the contract.
 */
export function isOutOfCredits(err: unknown): boolean {
  return (err as { response?: { status?: number } } | null)?.response?.status === 402;
}

type Listener = (cost: number) => void;

let listener: Listener | null = null;

/**
 * OutOfCreditsDialog registers itself here. One listener, not a list: there is
 * a single dialog mounted in App, and a second registration would mean two
 * dialogs racing to answer the same refusal.
 */
export function onOutOfCredits(fn: Listener): () => void {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/**
 * Raise the out-of-credits dialog for an action that costs `cost` credits.
 *
 * Imperative on purpose: this is called from catch blocks in four different
 * components, and threading a hook through each of them (including one that
 * renders without a router in its own tests) buys nothing.
 *
 * The fallback is not decoration. A silent failure here is exactly the bug
 * being fixed, so if the dialog is somehow not mounted the user still gets the
 * sentence - through the i18n singleton, since there is no component in scope.
 */
export function notifyOutOfCredits(cost: number): void {
  if (listener) {
    listener(cost);
    return;
  }
  // Imported here rather than at the top of the file: pulling in the i18n
  // singleton statically drags `initReactI18next` into every module that
  // touches this one, which broke five test files that stub react-i18next.
  void import('../i18n').then(({ default: i18n }) => {
    toast.error(i18n.t('credits.notEnough', { count: cost }));
  });
}
