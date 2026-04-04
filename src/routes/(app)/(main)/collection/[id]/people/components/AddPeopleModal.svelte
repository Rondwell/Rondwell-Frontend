<script lang="ts">
	import { addCollectionSubscriber } from '$lib/services/collection.services';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let collectionId: string;
	const dispatch = createEventDispatcher();

	let step: 'choose' | 'csv' | 'manual' | 'preview' = 'choose';
	let submitting = false;
	let errorMsg = '';
	let successMsg = '';

	// Manual entry rows
	let manualRows: { email: string; name: string }[] = [{ email: '', name: '' }, { email: '', name: '' }];

	// CSV import
	let csvPeople: { email: string; name: string }[] = [];
	let fileInput: HTMLInputElement;

	// Combined list for preview
	$: previewPeople = step === 'csv'
		? csvPeople
		: manualRows.filter(r => r.email.trim());

	function addManualRow() {
		manualRows = [...manualRows, { email: '', name: '' }];
	}

	function removeManualRow(i: number) {
		manualRows = manualRows.filter((_, idx) => idx !== i);
		if (manualRows.length === 0) manualRows = [{ email: '', name: '' }];
	}

	function removePreviewPerson(i: number) {
		if (step === 'csv') {
			csvPeople = csvPeople.filter((_, idx) => idx !== i);
		} else {
			removeManualRow(i);
		}
	}

	function handleCsvUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = reader.result as string;
			const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
			// Skip header if it looks like one
			const start = lines[0]?.toLowerCase().includes('email') ? 1 : 0;
			csvPeople = lines.slice(start).map(line => {
				const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
				return { email: parts[0] || '', name: parts[1] || '' };
			}).filter(p => p.email.includes('@'));
			step = 'preview';
		};
		reader.readAsText(file);
	}

	function downloadTemplate() {
		const csv = 'email,name\njohn@example.com,John Doe\njane@example.com,Jane Smith';
		const blob = new Blob([csv], { type: 'text/csv' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url; a.download = 'subscribers_template.csv'; a.click();
		URL.revokeObjectURL(url);
	}

	async function handleSubmit() {
		const people = previewPeople.filter(p => p.email.trim());
		if (people.length === 0) { errorMsg = 'No valid emails to add.'; return; }
		submitting = true; errorMsg = ''; successMsg = '';
		let added = 0;
		for (const p of people) {
			try {
				const nameParts = p.name.split(' ');
				await addCollectionSubscriber(collectionId, {
					email: p.email.trim(),
					firstName: nameParts[0] || undefined,
					lastName: nameParts.slice(1).join(' ') || undefined,
				});
				added++;
			} catch { /* skip duplicates */ }
		}
		submitting = false;
		if (added > 0) {
			successMsg = `Added ${added} subscriber${added > 1 ? 's' : ''}. Verification emails have been sent — they'll become active once confirmed.`;
			dispatch('added');
			setTimeout(() => dispatch('close'), 2500);
		} else {
			errorMsg = 'No new subscribers were added. They may already exist.';
		}
	}

	function goBack() {
		if (step === 'preview') step = csvPeople.length > 0 ? 'csv' : 'manual';
		else if (step === 'csv' || step === 'manual') step = 'choose';
		errorMsg = ''; successMsg = '';
	}

	function getInitials(p: { email: string; name: string }): string {
		if (p.name) return p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
		return p.email.slice(0, 2).toUpperCase();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm" on:click={() => dispatch('close')}>
<div class="w-full max-w-md overflow-hidden rounded-xl bg-[#FDFCFB] shadow-xl" on:click|stopPropagation>

	{#if step === 'choose'}
		<!-- Step 1: Choose method -->
		<div class="p-6">
			<div class="mb-4 flex items-start justify-between">
				<div>
					<img src="/import-icon.svg" alt="" class="mb-3 h-12 w-12" />
					<h2 class="text-lg font-semibold">Add People</h2>
					<p class="mt-1 text-sm text-gray-500">Import your subscribers into your calendar.</p>
				</div>
				<button on:click={() => dispatch('close')} class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]">
					<Icon icon="mdi:close" class="text-lg text-gray-600" />
				</button>
			</div>
			<div class="mt-5 grid grid-cols-2 gap-3">
				<button on:click={() => step = 'csv'} class="flex flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400 hover:shadow-sm">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#616265" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6M12 18v-6M9 15h6" stroke="#616265" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					<span class="text-sm font-medium">Import CSV</span>
					<span class="text-xs text-gray-400">Import from other services</span>
				</button>
				<button on:click={() => step = 'manual'} class="flex flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400 hover:shadow-sm">
					<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke="#616265" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
					<span class="text-sm font-medium">Enter Manually</span>
					<span class="text-xs text-gray-400">Paste in a list of emails</span>
				</button>
			</div>
		</div>

	{:else if step === 'csv'}
		<!-- Step 2a: CSV Import -->
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<button on:click={goBack}><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button>
				<h2 class="text-base font-semibold">Add People</h2>
				<button on:click={() => dispatch('close')} class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]">
					<Icon icon="mdi:close" class="text-lg text-gray-600" />
				</button>
			</div>
			<button on:click={() => fileInput?.click()} class="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white p-8 transition hover:border-gray-400">
				<svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" stroke="#9CA3AF" stroke-width="1.5"/><path d="M14 2v6h6" stroke="#9CA3AF" stroke-width="1.5"/></svg>
				<span class="text-sm font-medium text-gray-700">Import CSV File</span>
				<span class="text-xs text-gray-400">Drop file or click here to choose file.</span>
			</button>
			<input bind:this={fileInput} type="file" accept=".csv" class="hidden" on:change={handleCsvUpload} />
			<button on:click={downloadTemplate} class="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
				<Icon icon="mdi:folder-download-outline" class="text-sm" /> Download CSV Template
			</button>
			{#if csvPeople.length > 0}
				<p class="mt-4 text-sm text-gray-600">{csvPeople.length} email{csvPeople.length > 1 ? 's' : ''} to import</p>
			{/if}
			<button on:click={() => { if (csvPeople.length > 0) step = 'preview'; }} disabled={csvPeople.length === 0}
				class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {csvPeople.length > 0 ? 'bg-gray-900' : 'bg-gray-300 cursor-not-allowed'}">
				Preview
			</button>
		</div>

	{:else if step === 'manual'}
		<!-- Step 2b: Manual Entry -->
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<button on:click={goBack}><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button>
				<h2 class="text-base font-semibold">Add People</h2>
				<button on:click={() => dispatch('close')} class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]">
					<Icon icon="mdi:close" class="text-lg text-gray-600" />
				</button>
			</div>
			<p class="mb-4 text-xs text-gray-500">Pro tip: You can paste multiple emails into a single input, separated by comma or space.</p>
			<div class="custom-scrollbar max-h-60 space-y-2 overflow-y-auto">
				{#each manualRows as row, i}
					<div class="flex items-center gap-2">
						<input type="email" bind:value={row.email} placeholder="Email" class="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none" />
						<input type="text" bind:value={row.name} placeholder="Name (Optional)" class="w-36 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none" />
						{#if manualRows.length > 1}
							<button on:click={() => removeManualRow(i)} class="text-gray-400 hover:text-red-500"><Icon icon="mdi:close" class="text-base" /></button>
						{/if}
					</div>
				{/each}
			</div>
			<button on:click={addManualRow} class="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
				<Icon icon="mdi:plus" class="text-sm" /> Add another row
			</button>
			<button on:click={() => { if (previewPeople.length > 0) step = 'preview'; }}
				disabled={previewPeople.length === 0}
				class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {previewPeople.length > 0 ? 'bg-gray-900' : 'bg-gray-300 cursor-not-allowed'}">
				Preview
			</button>
		</div>

	{:else if step === 'preview'}
		<!-- Step 3: Preview & Submit -->
		<div class="p-6">
			<div class="mb-4 flex items-center justify-between">
				<button on:click={goBack}><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button>
				<h2 class="text-base font-semibold">Add People</h2>
				<button on:click={() => dispatch('close')} class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]">
					<Icon icon="mdi:close" class="text-lg text-gray-600" />
				</button>
			</div>

			{#if csvPeople.length > 0}
				<button on:click={() => { step = 'csv'; fileInput?.click(); }} class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-600 hover:bg-gray-50">
					<Icon icon="mdi:file-upload-outline" class="text-base" /> Import Another CSV File
				</button>
			{/if}

			{#if errorMsg}<p class="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">{errorMsg}</p>{/if}
			{#if successMsg}<p class="mb-3 rounded-md bg-green-50 p-2 text-sm text-green-600">{successMsg}</p>{/if}

			<p class="mb-2 text-sm text-gray-600">{previewPeople.length} email{previewPeople.length > 1 ? 's' : ''} to import</p>

			<div class="custom-scrollbar max-h-52 space-y-2 overflow-y-auto">
				{#each previewPeople as person, i}
					<div class="flex items-center justify-between rounded-lg bg-white px-3 py-2">
						<div class="flex items-center gap-3">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-medium text-white">
								{getInitials(person)}
							</div>
							<div>
								<p class="text-sm font-medium">{person.name || 'Importing 1 person'}</p>
								<p class="text-xs text-gray-400">{person.email}</p>
							</div>
						</div>
						<button on:click={() => removePreviewPerson(i)} class="text-gray-400 hover:text-red-500">
							<Icon icon="mdi:close" class="text-base" />
						</button>
					</div>
				{/each}
			</div>

			<button on:click={handleSubmit} disabled={submitting || previewPeople.length === 0}
				class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {submitting ? 'bg-gray-400' : 'bg-gray-900'}">
				{submitting ? 'Adding...' : `Add ${previewPeople.length} People`}
			</button>
		</div>
	{/if}

</div>
</div>
