<!--
	CC-3 — Reusable transaction status badge.

	One source of truth for the status pill rendered in:
	  - Wallet recent transactions
	  - Event earnings table
	  - Refund list (organizer + attendee)
	  - Vendor orders
	  - Customer purchases
	  - Escrow / dispute tables

	Covers every state machine in Phase 2:
	  PENDING / PROCESSING / COMPLETED / FAILED / REVERSED / REFUNDED /
	  DISPUTED / INITIATED / GATEWAY_PROCESSING / HELD / RELEASED /
	  CANCELED / FULFILLED / PAID / RESERVED / BOOKED / APPROVED / REJECTED
-->
<script lang="ts">
	export let status: string = '';
	/** Optional override label (defaults to title-cased status). */
	export let label: string = '';
	/** Optional tooltip surfaced on hover. */
	export let tooltip: string = '';

	type Style = { bg: string; text: string; border?: string };

	const STYLES: Record<string, Style> = {
		PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
		PROCESSING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
		INITIATED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
		GATEWAY_PROCESSING: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
		RESERVED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },

		COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
		PAID: { bg: 'bg-green-100', text: 'text-green-700' },
		RELEASED: { bg: 'bg-green-100', text: 'text-green-700' },
		FULFILLED: { bg: 'bg-green-100', text: 'text-green-700' },
		BOOKED: { bg: 'bg-green-100', text: 'text-green-700' },
		APPROVED: { bg: 'bg-green-100', text: 'text-green-700' },
		ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },

		FAILED: { bg: 'bg-red-100', text: 'text-red-700' },
		REJECTED: { bg: 'bg-red-100', text: 'text-red-700' },
		CANCELED: { bg: 'bg-gray-200', text: 'text-gray-700' },
		CANCELLED: { bg: 'bg-gray-200', text: 'text-gray-700' },

		REFUNDED: { bg: 'bg-orange-100', text: 'text-orange-700' },
		PARTIAL_REFUND: { bg: 'bg-orange-100', text: 'text-orange-700' },

		REVERSED: { bg: 'bg-blue-100', text: 'text-blue-700' },
		HELD: { bg: 'bg-amber-100', text: 'text-amber-700' },
		DISPUTED: { bg: 'bg-purple-100', text: 'text-purple-700' },

		PENDING_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700' },
		UNDER_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700' },
	};

	const FALLBACK: Style = { bg: 'bg-gray-100', text: 'text-gray-700' };

	$: key = (status || '').toUpperCase();
	$: style = STYLES[key] ?? FALLBACK;
	$: displayLabel =
		label ||
		(key
			? key
					.split('_')
					.map((w) => w.charAt(0) + w.slice(1).toLowerCase())
					.join(' ')
			: 'Unknown');
</script>

<span
	class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {style.bg} {style.text}"
	title={tooltip}
>
	{displayLabel}
</span>
