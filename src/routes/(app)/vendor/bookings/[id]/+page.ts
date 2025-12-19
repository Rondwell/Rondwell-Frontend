import { api } from '$lib/utils/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
    try {
        const booking = await api.getBookingDetail(params.id);
        return { booking };
    } catch (e) {
        error(404, 'Booking not found');
    }
};