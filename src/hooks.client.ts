import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ error, status, message }) => {
	// Log structured diagnostics without leaking stack traces into the UI.
	// eslint-disable-next-line no-console
	console.error('[Rondwell Client Error]', { status, message, error });

	return {
		message: status === 404 ? 'The requested page could not be found.' : 'Something went wrong. Please try again.'
	};
};
