import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const prerender = false;

function getEventUrl() {
	return env.VITE_EVENT_API_URL
		|| env.EVENT_API_URL
		|| env.VITE_API_URL
		|| 'https://api.rondwell.com';
}

export const load: LayoutServerLoad = async ({ params, fetch }) => {
	const { id } = params;
	const EVENT_URL = getEventUrl();
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
