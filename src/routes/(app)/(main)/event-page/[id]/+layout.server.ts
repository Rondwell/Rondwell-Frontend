import type { LayoutServerLoad } from './$types';

export const prerender = false;

const EVENT_URL = process.env.VITE_EVENT_API_URL || 'http://localhost:3000';

export const load: LayoutServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	try {
		const res = await fetch(`${EVENT_URL}/api/v1/events/${id}/public`);
		if (!res.ok) return { serverThemeColor: null };
		const data = await res.json();
		const themeColor = data.event?.themeColor ?? null;
		return { serverThemeColor: themeColor };
	} catch {
		return { serverThemeColor: null };
	}
};
