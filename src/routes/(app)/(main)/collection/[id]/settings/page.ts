import { redirect } from '@sveltejs/kit';



export function load({ params  }:any) {
	throw redirect(302, `/collection/${params.id}/settings/display`);
}
