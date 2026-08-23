<script lang="ts">
	import { addCollectionSubscriber } from '$lib/services/collection.services';
	import {
		contactCsvTemplate,
		downloadCsv,
		isValidEmail,
		parseContactCsv,
		readFileAsText,
		summariseImport,
		validateCsvFile,
		type CsvImportResult
	} from '$lib/utils/csv';
	import Icon from '@iconify/svelte';
	import { createEventDispatcher } from 'svelte';

	export let collectionId: string;
	const dispatch = createEventDispatcher();

	let step: 'choose' | 'csv' | 'manual' | 'preview' = 'choose';
	let submitting = false;
	let errorMsg = '';
	let successMsg = '';

	/** Import diagnostics from the last parsed file, surfaced in the UI. */
	let importResult: CsvImportResult | null = null;
	let parsing = false;

	/** Live progress while adding subscribers, so large lists don't look frozen. */
	let progressDone = 0;
	let progressTotal = 0;

	/** Drag-and-drop highlight state for the upload zone. */
	let dragActive = false;

	// Manual entry rows
	let manualRows: { email: string; name: string }[] = [
		{ email: '', name: '' },
		{ email: '', name: '' }
	];

	// CSV import
	interface PersonRow {
		email: string;
		name: string;
		firstName?: string;
		lastName?: string;
	}
	let csvPeople: PersonRow[] = [];
	let fileInput: HTMLInputElement;

	/**
	 * Which entry path the user is on. Tracked explicitly because `step` moves to
	 * 'preview' for both paths.
	 *
	 * The previous code derived the preview list with `step === 'csv' ? … : …`,
	 * so once a CSV import advanced to the preview step the condition was false
	 * and the list fell through to the (empty) manual rows. The result: a CSV
	 * import parsed the file, then showed an empty preview and "Add 0 People".
	 */
	let mode: 'csv' | 'manual' = 'csv';

	/** Rows shown in the preview step. */
	$: previewPeople =
		mode === 'csv'
			? csvPeople
			: manualRows
					// Only valid addresses count, so the "Add N People" button never
					// promises a number larger than what actually gets submitted.
					.filter((r) => isValidEmail(r.email))
					.map((r): PersonRow => {
						const parts = r.name.trim().split(/\s+/).filter(Boolean);
						return {
							email: r.email.trim(),
							name: r.name.trim(),
							firstName: parts[0] ?? '',
							lastName: parts.slice(1).join(' ')
						};
					});

	function chooseMode(next: 'csv' | 'manual') {
		mode = next;
		step = next;
		errorMsg = '';
		successMsg = '';
		// Drop any state from the other path so it can't leak into the preview.
		if (next === 'manual') {
			csvPeople = [];
			importResult = null;
		}
	}

	function addManualRow() {
		manualRows = [...manualRows, { email: '', name: '' }];
	}

	/**
	 * Explode a multi-address paste into separate rows.
	 *
	 * The UI has always advertised "paste multiple emails into a single input,
	 * separated by comma or space", but nothing implemented it — pasting a list
	 * dumped the whole string into one field, where it then failed validation.
	 *
	 * Handles the shapes people actually paste: comma, semicolon, space or
	 * newline separated, and "Name <email@host>" from mail clients.
	 */
	function handleManualPaste(e: ClipboardEvent, index: number) {
		const text = e.clipboardData?.getData('text') ?? '';
		if (!text.trim()) return;

		const tokens = text
			.split(/[,;\s\n\r]+/)
			.map((t) => t.trim())
			.filter(Boolean);

		// Single address pasted normally — let the browser handle it.
		if (tokens.length <= 1) return;

		e.preventDefault();

		const parsed: { email: string; name: string }[] = [];
		for (const raw of tokens) {
			// "Name <a@b.com>" → a@b.com
			const angle = raw.match(/<([^>]+)>/);
			const candidate = (angle ? angle[1] : raw).replace(/^["']|["'],?$/g, '').toLowerCase();
			if (!isValidEmail(candidate)) continue;
			if (parsed.some((p) => p.email === candidate)) continue;
			if (manualRows.some((r) => r.email.trim().toLowerCase() === candidate)) continue;
			parsed.push({ email: candidate, name: '' });
		}

		if (parsed.length === 0) {
			errorMsg = 'No valid email addresses found in what you pasted.';
			return;
		}

		errorMsg = '';
		// Fill the row that was pasted into, then append the rest.
		const rows = [...manualRows];
		rows[index] = { ...rows[index], email: parsed[0].email };
		rows.splice(index + 1, 0, ...parsed.slice(1));
		// Drop any leftover blank rows so the list stays tidy.
		manualRows = rows.filter((r, i) => r.email.trim() || i === rows.length - 1);
	}

	/** Inline validation: flag a row only once the user has typed something. */
	function rowInvalid(row: { email: string }): boolean {
		const v = row.email.trim();
		return v.length > 0 && !isValidEmail(v);
	}

	$: manualHasInvalid = mode === 'manual' && manualRows.some(rowInvalid);

	function removeManualRow(i: number) {
		manualRows = manualRows.filter((_, idx) => idx !== i);
		if (manualRows.length === 0) manualRows = [{ email: '', name: '' }];
	}

	function removePreviewPerson(i: number) {
		// Keyed off `mode`, not `step` — on the preview screen `step` is always
		// 'preview', so the old check always fell through to removeManualRow and
		// removing a row from a CSV preview silently deleted a manual row instead.
		if (mode === 'csv') {
			csvPeople = csvPeople.filter((_, idx) => idx !== i);
		} else {
			removeManualRow(i);
		}
	}

	async function handleCsvUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		// Always clear the input, so re-selecting the same file after a failed
		// import still fires a change event.
		input.value = '';
		if (file) await processFile(file);
	}

	function handleDrop(e: DragEvent) {
		dragActive = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processFile(file);
	}

	async function processFile(file: File) {
		errorMsg = '';
		importResult = null;

		const fileError = validateCsvFile(file);
		if (fileError) {
			errorMsg = fileError;
			return;
		}

		parsing = true;
		try {
			const text = await readFileAsText(file);
			const result = parseContactCsv(text);

			if (result.fatalError) {
				errorMsg = result.fatalError;
				return;
			}
			if (result.contacts.length === 0) {
				errorMsg =
					result.stats.totalRows === 0
						? 'No rows found in that file.'
						: `No valid email addresses found in ${result.stats.totalRows} row${result.stats.totalRows === 1 ? '' : 's'}. Check that the first column contains email addresses.`;
				importResult = result;
				return;
			}

			importResult = result;
			// Keep the parsed name parts — the API takes firstName/lastName, and
			// re-splitting the joined name would undo "Last, First" handling.
			csvPeople = result.contacts.map((c) => ({
				email: c.email,
				name: c.name,
				firstName: c.firstName,
				lastName: c.lastName
			}));
			mode = 'csv';
			step = 'preview';
		} catch (err: any) {
			errorMsg = err?.message ?? 'The file could not be read.';
		} finally {
			parsing = false;
		}
	}

	function downloadTemplate() {
		downloadCsv('subscribers_template.csv', contactCsvTemplate());
	}

	/**
	 * Add subscribers with bounded concurrency.
	 *
	 * This previously awaited each request one at a time, so a 500-row import
	 * meant 500 sequential round-trips with no progress shown. It also swallowed
	 * every error as "may already exist", which hid real failures (expired
	 * session, network down, server error) behind a reassuring message.
	 */
	async function handleSubmit() {
		const people = previewPeople.filter((p) => isValidEmail(p.email));
		if (people.length === 0) {
			errorMsg = 'No valid emails to add.';
			return;
		}

		submitting = true;
		errorMsg = '';
		successMsg = '';
		progressDone = 0;
		progressTotal = people.length;

		let added = 0;
		let alreadyExisted = 0;
		const realFailures: string[] = [];

		const CONCURRENCY = 5;
		let cursor = 0;

		async function worker() {
			while (cursor < people.length) {
				const p = people[cursor++];
				try {
					await addCollectionSubscriber(collectionId, {
						email: p.email.trim(),
						firstName: p.firstName || undefined,
						lastName: p.lastName || undefined
					});
					added++;
				} catch (err: any) {
					const msg = String(err?.message ?? '');
					// A duplicate is an expected, benign outcome. Anything else is a
					// real problem the organiser needs to know about.
					if (/exist|duplicate|already/i.test(msg)) alreadyExisted++;
					else if (realFailures.length < 3) realFailures.push(`${p.email}: ${msg || 'failed'}`);
					else realFailures.push('');
				} finally {
					progressDone++;
				}
			}
		}

		await Promise.all(Array.from({ length: Math.min(CONCURRENCY, people.length) }, worker));
		submitting = false;

		if (added > 0) {
			const extra: string[] = [];
			if (alreadyExisted > 0) extra.push(`${alreadyExisted} already subscribed`);
			if (realFailures.length > 0) extra.push(`${realFailures.length} failed`);
			successMsg =
				`Added ${added} subscriber${added > 1 ? 's' : ''}` +
				(extra.length ? ` (${extra.join(', ')})` : '') +
				`. Verification emails have been sent — they'll become active once confirmed.`;
			dispatch('added');
			setTimeout(() => dispatch('close'), 3000);
		} else if (realFailures.length > 0) {
			// Say what actually went wrong instead of blaming duplicates.
			errorMsg = `Could not add subscribers. ${realFailures.filter(Boolean)[0] ?? 'Please try again.'}`;
		} else {
			errorMsg = `No new subscribers were added — all ${alreadyExisted} are already on this list.`;
		}
	}

	function goBack() {
		if (step === 'preview') step = mode;
		else if (step === 'csv' || step === 'manual') step = 'choose';
		errorMsg = '';
		successMsg = '';
	}

	function getInitials(p: { email: string; name: string }): string {
		if (p.name)
			return p.name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.slice(0, 2)
				.toUpperCase();
		return p.email.slice(0, 2).toUpperCase();
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-3 backdrop-blur-sm"
	on:click={() => dispatch('close')}
>
	<div
		class="w-full max-w-md overflow-hidden rounded-xl bg-[#FDFCFB] shadow-xl"
		on:click|stopPropagation
	>
		{#if step === 'choose'}
			<!-- Step 1: Choose method -->
			<div class="p-6">
				<div class="mb-4 flex items-start justify-between">
					<div>
						<img src="/import-icon.svg" alt="" class="mb-3 h-12 w-12" />
						<h2 class="text-lg font-semibold">Add People</h2>
						<p class="mt-1 text-sm text-gray-500">Import your subscribers into your calendar.</p>
					</div>
					<button
						on:click={() => dispatch('close')}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
					>
						<Icon icon="mdi:close" class="text-lg text-gray-600" />
					</button>
				</div>
				<div class="mt-5 grid grid-cols-2 gap-3">
					<button
						on:click={() => chooseMode('csv')}
						class="flex flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400 hover:shadow-sm"
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
							><path
								d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
								stroke="#616265"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/><path
								d="M14 2v6h6M12 18v-6M9 15h6"
								stroke="#616265"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/></svg
						>
						<span class="text-sm font-medium">Import CSV</span>
						<span class="text-xs text-gray-400">Import from other services</span>
					</button>
					<button
						on:click={() => chooseMode('manual')}
						class="flex flex-col items-start gap-2 rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-gray-400 hover:shadow-sm"
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
							><path
								d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
								stroke="#616265"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/></svg
						>
						<span class="text-sm font-medium">Enter Manually</span>
						<span class="text-xs text-gray-400">Paste in a list of emails</span>
					</button>
				</div>
			</div>
		{:else if step === 'csv'}
			<!-- Step 2a: CSV Import -->
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<button on:click={goBack}
						><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button
					>
					<h2 class="text-base font-semibold">Add People</h2>
					<button
						on:click={() => dispatch('close')}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
					>
						<Icon icon="mdi:close" class="text-lg text-gray-600" />
					</button>
				</div>
				<!-- The copy has always promised drag-and-drop; now it actually works. -->
				<button
					on:click={() => fileInput?.click()}
					on:dragover|preventDefault={() => (dragActive = true)}
					on:dragleave={() => (dragActive = false)}
					on:drop|preventDefault={handleDrop}
					disabled={parsing}
					class="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed bg-white p-8 transition {dragActive
						? 'border-gray-800 bg-gray-50'
						: 'border-gray-300 hover:border-gray-400'}"
				>
					{#if parsing}
						<Icon icon="mdi:loading" class="animate-spin text-2xl text-gray-500" />
						<span class="text-sm font-medium text-gray-700">Reading file…</span>
					{:else}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="none"
							><path
								d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"
								stroke="#9CA3AF"
								stroke-width="1.5"
							/><path d="M14 2v6h6" stroke="#9CA3AF" stroke-width="1.5" /></svg
						>
						<span class="text-sm font-medium text-gray-700">Import CSV File</span>
						<span class="text-xs text-gray-400">Drop file or click here to choose file.</span>
					{/if}
				</button>
				<input
					bind:this={fileInput}
					type="file"
					accept=".csv,text/csv"
					class="hidden"
					on:change={handleCsvUpload}
				/>
				<button
					on:click={downloadTemplate}
					class="mt-3 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
				>
					<Icon icon="mdi:folder-download-outline" class="text-sm" /> Download CSV Template
				</button>

				{#if errorMsg}
					<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{errorMsg}</p>
				{/if}

				<!-- Tell the organiser exactly what happened, including what was skipped. -->
				{#if importResult && !errorMsg}
					<div class="mt-4 rounded-lg bg-gray-50 px-3 py-2">
						<p class="text-sm text-gray-700">{summariseImport(importResult.stats)}</p>
						{#if importResult.issues.length > 0}
							<ul class="mt-1 list-disc pl-4 text-xs text-gray-500">
								{#each importResult.issues as issue}
									<li>{issue}</li>
								{/each}
							</ul>
						{/if}
					</div>
				{/if}

				<button
					on:click={() => {
						if (csvPeople.length > 0) step = 'preview';
					}}
					disabled={csvPeople.length === 0}
					class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {csvPeople.length >
					0
						? 'bg-gray-900'
						: 'cursor-not-allowed bg-gray-300'}"
				>
					Preview
				</button>
			</div>
		{:else if step === 'manual'}
			<!-- Step 2b: Manual Entry -->
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<button on:click={goBack}
						><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button
					>
					<h2 class="text-base font-semibold">Add People</h2>
					<button
						on:click={() => dispatch('close')}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
					>
						<Icon icon="mdi:close" class="text-lg text-gray-600" />
					</button>
				</div>
				<p class="mb-4 text-xs text-gray-500">
					Pro tip: You can paste multiple emails into a single input, separated by comma or space.
				</p>
				<div class="custom-scrollbar max-h-60 space-y-2 overflow-y-auto">
					{#each manualRows as row, i}
						<div class="flex items-center gap-2">
							<input
								type="email"
								bind:value={row.email}
								on:paste={(e) => handleManualPaste(e, i)}
								placeholder="Email"
								aria-invalid={rowInvalid(row)}
								class="flex-1 rounded-md border bg-white px-3 py-2 text-sm focus:outline-none {rowInvalid(
									row
								)
									? 'border-red-400'
									: 'border-gray-200'}"
							/>
							<input
								type="text"
								bind:value={row.name}
								placeholder="Name (Optional)"
								class="w-36 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none"
							/>
							{#if manualRows.length > 1}
								<button on:click={() => removeManualRow(i)} class="text-gray-400 hover:text-red-500"
									><Icon icon="mdi:close" class="text-base" /></button
								>
							{/if}
						</div>
					{/each}
				</div>

				{#if manualHasInvalid}
					<p class="mt-2 text-xs text-red-600">
						Some rows aren't valid email addresses — they'll be skipped.
					</p>
				{/if}
				{#if errorMsg}
					<p class="mt-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{errorMsg}</p>
				{/if}
				<button
					on:click={addManualRow}
					class="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
				>
					<Icon icon="mdi:plus" class="text-sm" /> Add another row
				</button>
				<button
					on:click={() => {
						if (previewPeople.length > 0) step = 'preview';
					}}
					disabled={previewPeople.length === 0}
					class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {previewPeople.length >
					0
						? 'bg-gray-900'
						: 'cursor-not-allowed bg-gray-300'}"
				>
					Preview
				</button>
			</div>
		{:else if step === 'preview'}
			<!-- Step 3: Preview & Submit -->
			<div class="p-6">
				<div class="mb-4 flex items-center justify-between">
					<button on:click={goBack}
						><img src="/back-button.svg" alt="back" class="h-7 w-7" /></button
					>
					<h2 class="text-base font-semibold">Add People</h2>
					<button
						on:click={() => dispatch('close')}
						class="flex h-8 w-8 items-center justify-center rounded-full bg-[#EBECED]"
					>
						<Icon icon="mdi:close" class="text-lg text-gray-600" />
					</button>
				</div>

				{#if csvPeople.length > 0}
					<button
						on:click={() => {
							step = 'csv';
							fileInput?.click();
						}}
						class="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm text-gray-600 hover:bg-gray-50"
					>
						<Icon icon="mdi:file-upload-outline" class="text-base" /> Import Another CSV File
					</button>
				{/if}

				{#if errorMsg}<p class="mb-3 rounded-md bg-red-50 p-2 text-sm text-red-600">
						{errorMsg}
					</p>{/if}
				{#if successMsg}<p class="mb-3 rounded-md bg-green-50 p-2 text-sm text-green-600">
						{successMsg}
					</p>{/if}

				<p class="mb-2 text-sm text-gray-600">
					{previewPeople.length} email{previewPeople.length > 1 ? 's' : ''} to import
				</p>

				<div class="custom-scrollbar max-h-52 space-y-2 overflow-y-auto">
					{#each previewPeople as person, i}
						<div class="flex items-center justify-between rounded-lg bg-white px-3 py-2">
							<div class="flex items-center gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-xs font-medium text-white"
								>
									{getInitials(person)}
								</div>
								<div>
									<p class="text-sm font-medium">{person.name || person.email.split('@')[0]}</p>
									<p class="text-xs text-gray-400">{person.email}</p>
								</div>
							</div>
							<button
								on:click={() => removePreviewPerson(i)}
								class="text-gray-400 hover:text-red-500"
							>
								<Icon icon="mdi:close" class="text-base" />
							</button>
						</div>
					{/each}
				</div>

				<!-- Progress bar: a large import is many requests, and a static
			     "Adding..." for 30s reads as a hang. -->
				{#if submitting && progressTotal > 0}
					<div class="mt-4">
						<div class="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								class="h-full rounded-full bg-gray-900 transition-all duration-200"
								style="width: {Math.round((progressDone / progressTotal) * 100)}%"
							></div>
						</div>
						<p class="mt-1.5 text-center text-xs text-gray-500">
							Adding {progressDone} of {progressTotal}…
						</p>
					</div>
				{/if}

				<button
					on:click={handleSubmit}
					disabled={submitting || previewPeople.length === 0}
					class="mt-4 w-full rounded-lg py-3 text-center text-sm font-medium text-white {submitting
						? 'bg-gray-400'
						: 'bg-gray-900'}"
				>
					{submitting
						? 'Adding…'
						: `Add ${previewPeople.length} ${previewPeople.length === 1 ? 'Person' : 'People'}`}
				</button>
			</div>
		{/if}
	</div>
</div>
