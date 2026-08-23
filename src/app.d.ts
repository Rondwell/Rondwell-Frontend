// See https://svelte.dev/docs/kit/types#app.d.tss
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}

		/**
		 * H-13 — the server-side session, populated by `hooks.server.ts` from a
		 * verified `httpOnly` cookie. `undefined` means signed out.
		 *
		 * This is for RENDERING and ROUTING decisions. The API remains the
		 * authority on data access — a page must never treat `locals.user` as
		 * permission to return something the API would have refused.
		 */
		interface Locals {
			user?: {
				id: string;
				email: string;
				name?: string;
				role?: string;
			};
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	// Google Identity Services (GSI) types
	interface Window {
		google: {
			accounts: {
				id: {
					initialize: (config: {
						client_id: string;
						callback: (response: { credential: string; select_by?: string }) => void;
						auto_select?: boolean;
						cancel_on_tap_outside?: boolean;
					}) => void;
					prompt: (callback?: (notification: {
						isNotDisplayed: () => boolean;
						isSkippedMoment: () => boolean;
						isDismissedMoment: () => boolean;
						getNotDisplayedReason: () => string;
						getSkippedReason: () => string;
						getDismissedReason: () => string;
					}) => void) => void;
					renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
					disableAutoSelect: () => void;
				};
			};
		};
	}
}

export {};
