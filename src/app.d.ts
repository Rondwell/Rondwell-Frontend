// See https://svelte.dev/docs/kit/types#app.d.tss
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
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
						ux_mode?: 'popup' | 'redirect';
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
