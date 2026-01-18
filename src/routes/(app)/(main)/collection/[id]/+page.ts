import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	throw redirect(302, `/collection/${params.id}/events`);
}
