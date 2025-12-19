import { api } from '$lib/utils/api';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
    const bookings = await api.getVendorBookings();
    return { bookings };
};