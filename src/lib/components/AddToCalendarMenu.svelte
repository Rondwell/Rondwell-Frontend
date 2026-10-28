<script lang="ts">
	/**
	 * "Add to calendar" — a themed split button with a provider menu.
	 *
	 * ── Design notes ────────────────────────────────────────────────────────
	 *
	 * Takes its colours from the event's resolved theme tokens (`cover`,
	 * `toggle`, `text`, `lightText`) exactly like the rest of the event page, so
	 * it sits inside a themed page rather than on top of it. The provider rows
	 * use each vendor's own glyph at 18px — recognisable, but small enough that
	 * four different brand colours in a list still read as one menu.
	 *
	 * Interaction follows the existing dropdowns in this app: click to open,
	 * click-outside and Escape to close, and the trigger keeps focus so a
	 * keyboard user lands back where they started. The menu is a real
	 * `role="menu"` with `menuitem` children, because an attendee using a screen
	 * reader is exactly the person most likely to want a calendar reminder.
	 *
	 * ── Why Apple/ICS is the first row ──────────────────────────────────────
	 *
	 * It is the only option that carries the reminders and the join link, since
	 * the hosted deep links cannot express a `VALARM` or a conference property.
	 * It is also the one that works on a phone, which is where calendar entries
	 * actually get used.
	 */
	import Icon from '@iconify/svelte';
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		downloadIcs,
		getCalendarLinks,
		icsFileName,
		type CalendarLinks
	} from '$lib/services/calendar.services';
	import { toast } from '$lib/stores/toast.store';

	export let eventId: string;
	export let eventTitle = 'Event';
	/** Resolved theme tokens from the host page. */
	export let themeColor: {
		cover: string;
		smallCover: string;
		toggle: string;
		text: string;
		lightText: string;
		button: string;
		buttonText: string;
	};
	/** `solid` for a primary CTA, `ghost` to sit quietly beside one. */
	export let variant: 'solid' | 'ghost' = 'ghost';
	export let fullWidth = false;
	/** Shown instead of the default label. */
	export let label = 'Add to calendar';

	let open = false;
	let loading = false;
	let links: CalendarLinks | null = null;
	let triggerEl: HTMLButtonElement | null = null;
	let menuEl: HTMLDivElement | null = null;

	type Provider = {
		id: keyof CalendarLinks | 'ics' | 'icsPerDay';
		label: string;
		hint?: string;
		icon: string;
		color: string;
	};

	const PROVIDERS: Provider[] = [
		{
			id: 'ics',
			label: 'Apple Calendar & others',
			hint: 'Includes reminders',
			icon: 'mdi:calendar-heart',
			color: '#111111'
		},
		{ id: 'google', label: 'Google Calendar', icon: 'logos:google-calendar', color: '#4285F4' },
		{ id: 'outlook', label: 'Outlook.com', icon: 'logos:microsoft-icon', color: '#0078D4' },
		{
			id: 'office365',
			label: 'Outlook (work or school)',
			icon: 'logos:microsoft-icon',
			color: '#0078D4'
		},
		{ id: 'yahoo', label: 'Yahoo Calendar', icon: 'logos:yahoo', color: '#6001D2' }
	];

	/**
	 * Links are fetched on first open rather than on mount.
	 *
	 * The event page already makes several calls on load, and most visitors never
	 * open this menu — fetching eagerly would add a request to every page view to
	 * serve a minority of them.
	 */
	async function ensureLinks() {
		if (links || loading) return;
		loading = true;
		links = await getCalendarLinks(eventId);
		loading = false;
	}

	async function toggle() {
		open = !open;
		if (open) await ensureLinks();
	}

	function close() {
		open = false;
		triggerEl?.focus();
	}

	async function choose(provider: Provider) {
		// The ICS path streams through `fetch` so the viewer's Authorization
		// header is attached — that header is what decides whether the file
		// contains the join link.
		if (provider.id === 'ics' || provider.id === 'icsPerDay') {
			const ok = await downloadIcs(
				eventId,
				icsFileName(eventTitle),
				provider.id === 'icsPerDay'
			);
			if (!ok) {
				toast.error('Could not build the calendar file. Try Google or Outlook instead.');
				return;
			}
			toast.success('Added to your downloads — open it to save the event.');
			open = false;
			return;
		}

		const href = links?.[provider.id as keyof CalendarLinks];
		if (typeof href !== 'string' || !href) {
			toast.error('That calendar is unavailable right now.');
			return;
		}
		// `noopener` on a user-triggered new tab: without it the opened page can
		// reach back through `window.opener`.
		window.open(href, '_blank', 'noopener,noreferrer');
		open = false;
	}

	function onDocumentClick(event: MouseEvent) {
		if (!open) return;
		const target = event.target as Node;
		if (menuEl?.contains(target) || triggerEl?.contains(target)) return;
		open = false;
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open) {
			event.stopPropagation();
			close();
		}
	}

	$: if (browser) {
		// Listeners attach only while the menu is open, so a page with several of
		// these does not carry a document listener per instance.
		if (open) {
			document.addEventListener('click', onDocumentClick, true);
			document.addEventListener('keydown', onKeydown, true);
		} else {
			document.removeEventListener('click', onDocumentClick, true);
			document.removeEventListener('keydown', onKeydown, true);
		}
	}

	onDestroy(() => {
		if (!browser) return;
		document.removeEventListener('click', onDocumentClick, true);
		document.removeEventListener('keydown', onKeydown, true);
	});
</script>

<div class="relative {fullWidth ? 'w-full' : 'inline-block'}">
	<button
		bind:this={triggerEl}
		type="button"
		on:click={toggle}
		aria-haspopup="menu"
		aria-expanded={open}
		class="group flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold
		       transition-all duration-200 active:scale-[0.98] {fullWidth ? 'w-full' : ''}"
		style={variant === 'solid'
			? `background-color:${themeColor.button};color:${themeColor.buttonText};`
			: `background-color:${themeColor.smallCover};color:${themeColor.text};border:1px solid ${themeColor.toggle};`}
	>
		<Icon icon="mdi:calendar-plus-outline" class="text-[18px]" />
		<span>{label}</span>
		<Icon
			icon="mdi:chevron-down"
			class="text-[16px] transition-transform duration-200 {open ? 'rotate-180' : ''}"
		/>
	</button>

	{#if open}
		<!--
			Right-aligned and above the fold where there is room below, which is the
			common case on the event page sidebar. `min-w` rather than a fixed width
			so the longest label ("Outlook (work or school)") is never truncated.
		-->
		<div
			bind:this={menuEl}
			role="menu"
			aria-label="Choose a calendar"
			class="absolute right-0 z-50 mt-2 min-w-[268px] overflow-hidden rounded-2xl border shadow-xl
			       ring-1 ring-black/5 backdrop-blur-sm"
			style="background-color:{themeColor.cover};border-color:{themeColor.toggle};"
		>
			<div
				class="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider"
				style="color:{themeColor.lightText};"
			>
				Add this event to
			</div>

			{#if loading}
				<!-- Skeleton rows rather than a spinner: the menu keeps its final
				     height, so the list does not jump when the links arrive. -->
				{#each Array(3) as _, i (i)}
					<div class="flex items-center gap-3 px-4 py-2.5">
						<div
							class="h-[18px] w-[18px] animate-pulse rounded"
							style="background-color:{themeColor.smallCover};"
						></div>
						<div
							class="h-3 flex-1 animate-pulse rounded"
							style="background-color:{themeColor.smallCover};"
						></div>
					</div>
				{/each}
			{:else}
				{#each PROVIDERS as provider (provider.id)}
					{@const unavailable =
						provider.id !== 'ics' && !links?.[provider.id as keyof CalendarLinks]}
					<button
						type="button"
						role="menuitem"
						disabled={unavailable}
						on:click={() => choose(provider)}
						class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors
						       disabled:cursor-not-allowed disabled:opacity-40"
						style="color:{themeColor.text};"
						on:mouseenter={(e) =>
							(e.currentTarget.style.backgroundColor = themeColor.smallCover)}
						on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
						on:focus={(e) => (e.currentTarget.style.backgroundColor = themeColor.smallCover)}
						on:blur={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
					>
						<Icon icon={provider.icon} class="shrink-0 text-[18px]" />
						<span class="flex-1 leading-tight">
							{provider.label}
							{#if provider.hint}
								<span class="block text-[11px]" style="color:{themeColor.lightText};">
									{provider.hint}
								</span>
							{/if}
						</span>
					</button>
				{/each}

				{#if links?.isMultiDay && links?.icsPerDay}
					<div class="border-t" style="border-color:{themeColor.toggle};">
						<button
							type="button"
							role="menuitem"
							on:click={() => choose({ ...PROVIDERS[0], id: 'icsPerDay' })}
							class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
							style="color:{themeColor.text};"
							on:mouseenter={(e) =>
								(e.currentTarget.style.backgroundColor = themeColor.smallCover)}
							on:mouseleave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
						>
							<Icon icon="mdi:calendar-multiple" class="shrink-0 text-[18px]" />
							<span class="flex-1 leading-tight">
								Each day separately
								<span class="block text-[11px]" style="color:{themeColor.lightText};">
									One entry per day instead of one long block
								</span>
							</span>
						</button>
					</div>
				{/if}
			{/if}
		</div>
	{/if}
</div>
