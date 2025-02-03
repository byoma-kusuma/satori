import { atomWithStorage } from 'jotai/utils';

export const fontAtom = atomWithStorage('font', 'poppins');
export const themeAtom = atomWithStorage('theme', 'light');