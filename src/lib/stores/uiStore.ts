import { writable } from 'svelte/store';

export interface SubMenuItem {
    label: string;
    icon: string;
    nav: string;
}

export const showSubMenu = writable(false);
export const subMenuItems = writable<SubMenuItem[]>([]);
export const activeSubItem = writable('');

// Settings subMenu
export const showSettingsSubMenu = writable(false);
export const settingsSubMenuItems = writable<SubMenuItem[]>([]);
export const activeSettingsItem = writable('');