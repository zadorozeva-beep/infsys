import { useEffect, useState } from 'react';

import { Confetti } from './Confetti';

/** Слухає window event 'confetti' і відтворює анімацію. */
export function ConfettiHost(): JSX.Element {
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const handler = (): void => setTrigger((t) => t + 1);
    window.addEventListener('confetti', handler);
    return () => window.removeEventListener('confetti', handler);
  }, []);

  return <Confetti trigger={trigger} />;
}

export function fireConfetti(): void {
  window.dispatchEvent(new CustomEvent('confetti'));
}
