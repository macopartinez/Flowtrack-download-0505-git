import { useState, useEffect } from 'react';

export function useAnimationPreference() {
  const [disableAnimation, setDisableAnimation] = useState(() => {
    return localStorage.getItem('disableBackgroundAnimation') === 'true';
  });

  useEffect(() => {
    const handlePreferenceChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ disabled: boolean }>;
      setDisableAnimation(customEvent.detail.disabled);
    };

    window.addEventListener('animationPreferenceChanged', handlePreferenceChange);

    return () => {
      window.removeEventListener('animationPreferenceChanged', handlePreferenceChange);
    };
  }, []);

  return disableAnimation;
}
