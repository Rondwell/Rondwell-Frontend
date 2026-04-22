import type { LayoutServerLoad } from './$types';

export const prerender = false;

const API_BASE = 'https://api.rondwell.com';

export const load: LayoutServerLoad = async ({ params }) => {
	const { id } = params;
	try {
		const res = await globalThis.fetch(`${API_BASE}/api/v1/events/${id}/public`);
		if (!res.ok) return { serverThemeColor: null };
		const data = await res.json();
		return { serverThemeColor: data.event?.themeColor ?? null };
	} catch {
		return { serverThemeColor: null };
	}
};
