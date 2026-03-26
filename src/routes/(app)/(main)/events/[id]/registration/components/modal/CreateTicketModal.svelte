<script lang="ts">
	import { createTicketType, updateTicketType } from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import PlaceholderExtension from '@tiptap/extension-placeholder';
	import StarterKit from '@tiptap/starter-kit';
	import { onDestroy, onMount } from 'svelte';
	import { createEditor, Editor, EditorContent } from 'svelte-tiptap';
	import type { Readable } from 'svelte/store';
	import DatePickerModal from '../../../../../../create-event/components/DatePickerModal.svelte';
	import TimeModal from '../../../../../../create-event/components/TimeModal.svelte';

	export let open = false;
	export let eventId: string;
	export let ticket: any = null; // null = create, object = edit
	export let eventTitle = '';
	export let onSuccess: () => void = () => {};

	// Form state
	let name = '';
	let description = '';
	let showDescription = false;
	let isFree = true;
	let price: number | string = '';
	let currency = 'USD';
	let requiresApproval = false;
	let salesStartDate: Date = new Date();
	let salesStartTime = '9:00 AM';
	let salesEndDate: Date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	let salesEndTime = '11:59 PM';
	let totalTickets: number | string = '';
	let tags: string[] = [];
	let newTag = '';
	let saving = false;
	let errorMsg = '';

	// Date/time picker toggles
	let openSalesStartDatePicker = false;
	let openSalesEndDatePicker = false;
	let openSalesStartTimePicker = false;
	let openSalesEndTimePicker = false;

	// TipTap editor
	let descEditor: Readable<Editor>;

	function initEditor(content: string = '') {
		if ($descEditor) $descEditor.destroy();
		descEditor = createEditor({
			extensions: [
				StarterKit,
				PlaceholderExtension.configure({
					placeholder: 'Describe what this ticket includes...'
				})
			],
			content,
			onUpdate: ({ editor }) => {
				description = editor.getHTML();
			}
		});
	}

	onMount(() => {
		initEditor('');
	});

	onDestroy(() => {
		$descEditor?.destroy();
	});

	const currencies = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD'];

	$: isEditing = !!ticket;
	$: modalTitle = isEditing ? 'Edit Ticket Type' : 'New Ticket Type';

	// Reset form when modal opens
	$: if (open) {
		errorMsg = '';
		if (ticket) {
			name = ticket.name ?? '';
			description = ticket.description ?? '';
			showDescription = !!ticket.description;
			isFree = ticket.isFree ?? (!ticket.price || ticket.price === 0);
			price = ticket.price ?? '';
			currency = ticket.currency ?? 'USD';
			requiresApproval = ticket.requiresApproval ?? false;
			tags = ticket.tags ?? [];
			totalTickets = ticket.quantityAvailable ?? '';
			if (ticket.salesStartDate) {
				const sd = new Date(ticket.salesStartDate);
				salesStartDate = sd;
				salesStartTime = sd.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			}
			if (ticket.salesEndDate) {
				const ed = new Date(ticket.salesEndDate);
				salesEndDate = ed;
				salesEndTime = ed.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
			}
			// Re-init editor with existing description
			if (typeof window !== 'undefined') initEditor(ticket.description ?? '');
		} else {
			name = '';
			description = '';
			showDescription = false;
			isFree = true;
			price = '';
			currency = 'USD';
			requiresApproval = false;
			tags = [];
			totalTickets = '';
			newTag = '';
			salesStartDate = new Date();
			salesStartTime = '9:00 AM';
			salesEndDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
			salesEndTime = '11:59 PM';
			// Re-init editor empty
			if (typeof window !== 'undefined') initEditor('');
		}
	}

	function addTag() {
		const trimmed = newTag.trim();
		if (trimmed && !tags.includes(trimmed)) {
			tags = [...tags, trimmed];
		}
		newTag = '';
	}

	function removeTag(tag: string) {
		tags = tags.filter((t) => t !== tag);
	}

	function handleTagKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addTag();
		}
	}

	function buildDateTime(date: Date, timeStr: string): Date {
		const [timePart, meridiem] = timeStr.split(' ');
		let [hours, minutes] = timePart.split(':').map(Number);
		if (meridiem === 'PM' && hours !== 12) hours += 12;
		if (meridiem === 'AM' && hours === 12) hours = 0;
		const d = new Date(date);
		d.setHours(hours, minutes, 0, 0);
		return d;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
	}

	async function handleSubmit() {
		errorMsg = '';
		if (!name.trim()) { errorMsg = 'Ticket name is required'; return; }
		if (!salesStartDate || !salesEndDate) { errorMsg = 'Sales start and end dates are required'; return; }

		const startDt = buildDateTime(salesStartDate, salesStartTime);
		const endDt = buildDateTime(salesEndDate, salesEndTime);
		if (startDt >= endDt) { errorMsg = 'Sales start must be before end date'; return; }

		if (!isFree && (!price || Number(price) <= 0)) { errorMsg = 'Price is required for paid tickets'; return; }

		saving = true;
		try {
			const payload: any = {
				name: name.trim(),
				description: description.trim() || undefined,
				salesStartDate: startDt.toISOString(),
				salesEndDate: endDt.toISOString(),
				requiresApproval,
				isFree,
				currency: isFree ? 'USD' : currency,
				price: isFree ? 0 : Number(price),
				tags: tags.length > 0 ? tags : undefined,
				quantityAvailable: totalTickets ? Number(totalTickets) : undefined,
			};

			if (isEditing) {
				await updateTicketType(eventId, ticket.id, payload);
			} else {
				await createTicketType(eventId, payload);
			}
			onSuccess();
		} catch (e: any) {
			errorMsg = e.message ?? 'Failed to save ticket';
		} finally {
			saving = false;
		}
	}

	$: canSubmit = name.trim() && salesStartDate && salesEndDate && !saving;
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
		on:click={() => (open = false)}
		on:keydown={(e) => { if (e.key === 'Escape') open = false; }}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="flex h-full max-h-[85vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-lg"
			on:click|stopPropagation
			on:keydown|stopPropagation
			role="document"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-200 px-5 py-3">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EFF0F0]">
						<svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path opacity="0.4" d="M34.2712 21.6511C34.9125 21.6511 35.4222 21.1249 35.4222 20.4672V19.0203C35.4222 12.5583 33.449 10.6016 27.0035 10.6016H16.6445V14.5972C17.2858 14.5972 17.812 15.1233 17.812 15.7646V20.1713C17.812 20.8125 17.2858 21.3387 16.6445 21.3387V25.4658C17.2858 25.4658 17.812 25.992 17.812 26.6333V31.0399C17.812 31.6812 17.2858 32.2074 16.6445 32.2074V36.1701H27.0035C33.449 36.1701 35.4222 34.1969 35.4222 27.7514C35.4222 27.1101 34.9125 26.5839 34.2712 26.5839C32.89 26.5839 31.7883 25.4823 31.7883 24.1175C31.7883 22.7528 32.89 21.6511 34.2712 21.6511Z" fill="#737577"/>
							<path d="M15.4785 15.7716V20.1783C15.4785 20.8195 16.0047 21.3457 16.6459 21.3457V25.4728C16.0047 25.4728 15.4785 25.999 15.4785 26.6403V31.0469C15.4785 31.6882 16.0047 32.2144 16.6459 32.2144V36.1771H12.4695C6.02391 36.1771 4.05078 34.2039 4.05078 27.7584V27.0513C4.05078 26.3936 4.56051 25.8839 5.20178 25.8839C6.58297 25.8839 7.68463 24.7658 7.68463 23.401C7.68463 22.0363 6.58297 20.9182 5.20178 20.9182C4.56051 20.9182 4.05078 20.4085 4.05078 19.7507V19.0437C4.05078 12.5817 6.02391 10.625 12.4695 10.625H16.6295V14.6206C16.0047 14.6206 15.4785 15.1468 15.4785 15.7716Z" fill="#737577"/>
						</svg>
					</div>
					<div>
						<h2 class="font-semibold text-gray-800">{modalTitle}</h2>
						<p class="text-xs text-[#A5A6A6]">
							{isEditing ? 'Existing ticket holders won\'t be affected' : `Create a ticket for ${eventTitle}`}
						</p>
					</div>
				</div>
				<button
					class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#EBECED] text-xl leading-none text-gray-700"
					on:click={() => (open = false)}
				>
					<Icon icon="mdi:close" class="text-lg font-bold" />
				</button>
			</div>

			<!-- Body -->
			<div class="custom-scrollbar flex-1 overflow-y-auto px-5 py-4">
				{#if errorMsg}
					<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>
				{/if}

				<!-- Ticket Name -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Ticket Name</label>
					<input
						type="text"
						bind:value={name}
						placeholder="e.g. Friends & Family, VIP Pass"
						class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
					/>
				</div>

				<!-- Description -->
				{#if !showDescription}
					<button
						class="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-700"
						on:click={() => (showDescription = true)}
					>
						<Icon icon="mdi:plus" class="mr-1 h-4 w-4" />
						Add Ticket Description
					</button>
				{:else}
					<div class="mb-4">
						<div class="mb-1.5 flex items-center justify-between">
							<label class="text-xs font-medium text-[#666769]">Description</label>
							<button class="text-gray-400 hover:text-gray-600" on:click={() => { showDescription = false; description = ''; $descEditor?.commands.clearContent(); }}>
								<Icon icon="mdi:close" class="h-4 w-4" />
							</button>
						</div>
						<div class="ticket-editor overflow-hidden rounded-md border border-gray-200">
							<!-- Toolbar -->
							<div class="flex flex-wrap items-center gap-0.5 border-b border-gray-100 bg-[#F8F9FA] px-2 py-1">
								{#if $descEditor}
									<button type="button" title="Bold"
										on:click={() => $descEditor.chain().focus().toggleBold().run()}
										class="rounded px-2 py-1 text-sm font-bold hover:bg-gray-200 {$descEditor.isActive('bold') ? 'bg-gray-800 text-white' : 'text-gray-700'}">B</button>
									<button type="button" title="Italic"
										on:click={() => $descEditor.chain().focus().toggleItalic().run()}
										class="rounded px-2 py-1 text-sm italic hover:bg-gray-200 {$descEditor.isActive('italic') ? 'bg-gray-800 text-white' : 'text-gray-700'}">I</button>
									<div class="mx-1 h-4 w-px bg-gray-300"></div>
									<button type="button" title="Bullet list"
										on:click={() => $descEditor.chain().focus().toggleBulletList().run()}
										class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('bulletList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
										<Icon icon="mdi:format-list-bulleted" class="text-base" />
									</button>
									<button type="button" title="Ordered list"
										on:click={() => $descEditor.chain().focus().toggleOrderedList().run()}
										class="rounded px-2 py-1 text-xs hover:bg-gray-200 {$descEditor.isActive('orderedList') ? 'bg-gray-800 text-white' : 'text-gray-700'}">
										<Icon icon="mdi:format-list-numbered" class="text-base" />
									</button>
									<div class="mx-1 h-4 w-px bg-gray-300"></div>
									<button type="button" title="Undo"
										on:click={() => $descEditor.chain().focus().undo().run()}
										class="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200">↩</button>
									<button type="button" title="Redo"
										on:click={() => $descEditor.chain().focus().redo().run()}
										class="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200">↪</button>
								{/if}
							</div>
							<!-- Editor area -->
							<div class="min-h-[80px] max-h-[150px] overflow-y-auto bg-[#F8F8F9] p-3 text-sm text-gray-800">
								<EditorContent editor={$descEditor} />
							</div>
						</div>
					</div>
				{/if}

				<!-- Free / Paid Toggle -->
				<div class="mb-4 rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<div class="flex items-center justify-between">
						<div>
							<p class="text-sm font-medium text-gray-700">Free Ticket</p>
							<p class="text-xs text-gray-400">Toggle off to set a price for this ticket</p>
						</div>
						<button
							aria-label="toggle free"
							class="relative h-6 w-10 rounded-full transition-colors duration-300"
							class:bg-gray-300={!isFree}
							class:bg-gray-800={isFree}
							on:click={() => (isFree = !isFree)}
						>
							<span
								class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
								class:translate-x-4={isFree}
							></span>
						</button>
					</div>

					{#if !isFree}
						<div class="mt-3 flex gap-3">
							<div class="w-1/3">
								<label class="mb-1 block text-xs font-medium text-[#666769]">Currency</label>
								<select
									bind:value={currency}
									class="h-[40px] w-full rounded-md border border-gray-200 bg-white px-2 text-sm focus:outline-none"
								>
									{#each currencies as cur}
										<option value={cur}>{cur}</option>
									{/each}
								</select>
							</div>
							<div class="flex-1">
								<label class="mb-1 block text-xs font-medium text-[#666769]">Price</label>
								<input
									type="number"
									min="0"
									step="0.01"
									bind:value={price}
									placeholder="0.00"
									class="h-[40px] w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Tags -->
				{#if !isFree}
					<div class="mb-4">
						<label class="mb-1.5 block text-xs font-medium text-[#666769]">Tags (optional)</label>
						<div class="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2">
							{#each tags as tag}
								<span class="flex items-center gap-1 rounded-full bg-[#F8EFDD] px-2 py-0.5 text-xs font-medium text-[#D69814]">
									{tag}
									<button on:click={() => removeTag(tag)} class="text-[#D69814] hover:text-red-500">
										<Icon icon="mdi:close" class="h-3 w-3" />
									</button>
								</span>
							{/each}
							<input
								type="text"
								bind:value={newTag}
								on:keydown={handleTagKeydown}
								placeholder={tags.length === 0 ? 'e.g. Early Bird, Limited Time' : 'Add tag...'}
								class="min-w-[100px] flex-1 border-none bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
							/>
						</div>
						<p class="mt-1 text-xs text-gray-400">Press Enter to add a tag</p>
					</div>
				{/if}

				<!-- Require Approval -->
				<div class="mb-4 flex items-center justify-between rounded-lg border border-gray-100 bg-[#F8F8F9] p-3">
					<div>
						<p class="text-sm font-medium text-gray-700">Require Approval</p>
						<p class="text-xs text-gray-400">Organizer must approve attendees before they become "Attending"</p>
					</div>
					<button
						aria-label="toggle approval"
						class="relative h-6 w-10 rounded-full transition-colors duration-300"
						class:bg-gray-300={!requiresApproval}
						class:bg-gray-800={requiresApproval}
						on:click={() => (requiresApproval = !requiresApproval)}
					>
						<span
							class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
							class:translate-x-4={requiresApproval}
						></span>
					</button>
				</div>

				<!-- Sales Start Date -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Sales Start</label>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (openSalesStartDatePicker = false)}>
							<button type="button"
								on:click={() => (openSalesStartDatePicker = !openSalesStartDatePicker)}
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
							>
								{formatDate(salesStartDate)}
							</button>
							<DatePickerModal open={openSalesStartDatePicker} bind:selectedDate={salesStartDate} />
						</div>
						<div class="relative w-[130px]" use:clickOutside={() => (openSalesStartTimePicker = false)}>
							<button type="button"
								on:click={() => (openSalesStartTimePicker = !openSalesStartTimePicker)}
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
							>
								{salesStartTime}
							</button>
							<TimeModal open={openSalesStartTimePicker} bind:selectedTime={salesStartTime} />
						</div>
					</div>
				</div>

				<!-- Sales End Date -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Sales End</label>
					<div class="flex gap-2">
						<div class="relative flex-1" use:clickOutside={() => (openSalesEndDatePicker = false)}>
							<button type="button"
								on:click={() => (openSalesEndDatePicker = !openSalesEndDatePicker)}
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
							>
								{formatDate(salesEndDate)}
							</button>
							<DatePickerModal open={openSalesEndDatePicker} bind:selectedDate={salesEndDate} startDate={salesStartDate} />
						</div>
						<div class="relative w-[130px]" use:clickOutside={() => (openSalesEndTimePicker = false)}>
							<button type="button"
								on:click={() => (openSalesEndTimePicker = !openSalesEndTimePicker)}
								class="w-full rounded-md border border-gray-200 bg-[#F4F4F4] px-3 py-2.5 text-left text-sm font-medium text-gray-700"
							>
								{salesEndTime}
							</button>
							<TimeModal open={openSalesEndTimePicker} bind:selectedTime={salesEndTime} referenceTime={salesStartTime} />
						</div>
					</div>
				</div>

				<!-- Total Tickets -->
				<div class="mb-4">
					<label class="mb-1.5 block text-xs font-medium text-[#666769]">Total Tickets (optional)</label>
					<input
						type="number"
						min="1"
						bind:value={totalTickets}
						placeholder="Leave empty for unlimited"
						class="w-full rounded-md border border-gray-200 bg-[#F8F8F9] px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-gray-400 focus:outline-none"
					/>
					<p class="mt-1 text-xs text-gray-400">Total number of this ticket type that can be purchased before sold out</p>
				</div>
			</div>

			<!-- Footer -->
			<div class="flex h-15 items-center justify-between border-t border-gray-200 px-5 py-3">
				<span class="text-sm text-[#B9BABA]">
					{isFree ? 'Free ticket' : `${currency} ${price || '0'}`}
					{totalTickets ? ` · ${totalTickets} total` : ' · Unlimited'}
				</span>
				<div class="flex items-center gap-2">
					<button
						on:click={() => (open = false)}
						class="flex items-center gap-1 rounded-md border bg-gray-100 px-4 py-2 text-sm text-[#626365]"
					>
						Cancel
					</button>
					<button
						on:click={handleSubmit}
						disabled={!canSubmit}
						class="flex items-center gap-2 rounded-md px-6 py-2 text-sm font-medium text-white {canSubmit ? 'bg-gray-800' : 'cursor-not-allowed bg-[#969798]'}"
					>
						{#if saving}
							<Icon icon="mdi:loading" class="animate-spin text-base" />
							{isEditing ? 'Updating...' : 'Creating...'}
						{:else}
							{isEditing ? 'Update Ticket' : 'Create Ticket'}
						{/if}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(.ticket-editor .ProseMirror) {
		outline: none;
		min-height: 60px;
		line-height: 1.5;
	}
	:global(.ticket-editor .ProseMirror p.is-editor-empty:first-child::before) {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
		float: left;
		height: 0;
	}
	:global(.ticket-editor .ProseMirror p) { margin-bottom: 0.3rem; }
	:global(.ticket-editor .ProseMirror ul) { list-style: disc; padding-left: 1.5rem; margin-bottom: 0.3rem; }
	:global(.ticket-editor .ProseMirror ol) { list-style: decimal; padding-left: 1.5rem; margin-bottom: 0.3rem; }
	:global(.ticket-editor .ProseMirror strong) { font-weight: 700; }
	:global(.ticket-editor .ProseMirror em) { font-style: italic; }
</style>
