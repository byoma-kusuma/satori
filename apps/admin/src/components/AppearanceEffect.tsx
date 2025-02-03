import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { fontAtom, themeAtom } from '@/stores/appearanceAtoms';

export default function AppearanceEffect() {
  const [font] = useAtom(fontAtom);
  const [theme] = useAtom(themeAtom);

  useEffect(() => {
    const root = document.documentElement;
    // Remove any existing font classes and add the current one
    root.classList.remove('font-poppins', 'font-inter');
    root.classList.add(`font-${font}`);
  }, [font]);

  useEffect(() => {
    const root = document.documentElement;
    // Remove any existing theme classes and add the current theme
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  return null;
}