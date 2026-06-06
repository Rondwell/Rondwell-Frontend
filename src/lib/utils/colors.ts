export interface Color {
	name: string;
	bg: string;
	text: string;
	lightText: string;
	cover: string;
	smallCover: string;
	toggle: string;
	button: string;
	buttonText: string;
}

/**
 * Event / collection theme palettes.
 *
 * Field roles (used consistently across event page, collection page, cards):
 * - bg:         full page background.
 * - cover:      card / section surface (kept subtly deeper than `bg` for layering).
 * - smallCover: nested surface (avatars, chips, icon buttons).
 * - toggle:     borders, dividers, segmented-control track.
 * - text:       headings + strong text — deep & saturated so it POPS on `cover`.
 * - lightText:  body / secondary text — a muted-but-readable tone (~5:1 contrast
 *               on `cover`, vs the old ~1.5:1 that looked blurry/faint).
 * - button:     primary CTA fill.
 * - buttonText: CTA label (contrast-checked against `button`).
 *
 * Names are intentionally stable — events persist their theme by name.
 */
export const colors: Color[] = [
	{
		name: 'Light Rose',
		bg: '#FDEEEE',
		text: '#6E3B3A',
		lightText: '#8A5856',
		cover: '#F9E6E3',
		smallCover: '#F2DAD6',
		toggle: '#E7C5C2',
		button: '#C53635',
		buttonText: '#FFFFFF'
	},
	{
		name: 'Sky Blue',
		bg: '#EBF6FF',
		text: '#344A86',
		lightText: '#4E5F94',
		cover: '#E1EDF9',
		smallCover: '#D6E5F4',
		toggle: '#C1D4EA',
		button: '#2C6CD5',
		buttonText: '#FFFFFF'
	},
	{
		name: 'Pale Green',
		bg: '#EDF9EB',
		text: '#355035',
		lightText: '#4C6A4B',
		cover: '#E3F0E1',
		smallCover: '#D8E8D6',
		toggle: '#C2D8C0',
		button: '#2F8326',
		buttonText: '#FFFFFF'
	},
	{
		name: 'Pale Pink',
		bg: '#FFEEF3',
		text: '#7C3A50',
		lightText: '#97546B',
		cover: '#FAE4EB',
		smallCover: '#F4D8E1',
		toggle: '#EAC3D0',
		button: '#C32C68',
		buttonText: '#FFFFFF'
	},
	{
		name: 'Light Apricot',
		bg: '#FFF3E1',
		text: '#74441F',
		lightText: '#8C5C30',
		cover: '#FAEAD6',
		smallCover: '#F4DEC8',
		toggle: '#E8CDB1',
		button: '#AA5C00',
		buttonText: '#FFFFFF'
	},
	{
		name: 'pastel purple',
		bg: '#FBF1FF',
		text: '#5A3771',
		lightText: '#714A8A',
		cover: '#F1E6F8',
		smallCover: '#E8D9F1',
		toggle: '#D9C7E5',
		button: '#9051B2',
		buttonText: '#FFFFFF'
	},
	{
		name: 'Coffee Brown',
		bg: '#3A1F04',
		text: '#F2EBE2',
		lightText: '#CBBBA8',
		cover: '#4A2E13',
		smallCover: '#5A3B20',
		toggle: '#6E5238',
		button: '#F6EFE6',
		buttonText: '#4A2E13'
	},
	{
		name: 'White Black',
		bg: '#FFFFFF',
		text: '#141414',
		lightText: '#5C5550',
		cover: '#FBFAF9',
		smallCover: '#F2F1EF',
		toggle: '#E6E3E0',
		button: '#171717',
		buttonText: '#FFFFFF'
	}
];
