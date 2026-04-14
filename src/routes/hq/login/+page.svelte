<script lang="ts">
	import { goto } from '$app/navigation';
	import { adminLogin, seedAdmin, setAdminAuth } from '$lib/services/admin.services';
	import { onDestroy, onMount } from 'svelte';

	let email = '';
	let password = '';
	let errorMsg = '';
	let loading = false;
	let showPassword = false;

	// Live time (matching main auth header)
	let now = formatTime();
	function formatTime() {
		let rawTime = new Date().toLocaleString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true,
			timeZoneName: 'short'
		});
		return rawTime.replace(/am|pm/, (match: string) => match.toUpperCase());
	}
	const interval = setInterval(() => { now = formatTime(); }, 60000);
	onDestroy(() => clearInterval(interval));

	onMount(async () => {
		try { await seedAdmin(); } catch { /* ignore */ }
	});

	async function handleLogin() {
		if (!email || !password) { errorMsg = 'Please enter email and password'; return; }
		errorMsg = '';
		loading = true;
		try {
			const { token, admin } = await adminLogin(email, password);
			setAdminAuth(token, admin);
			goto('/hq');
		} catch (err: any) {
			errorMsg = err.message || 'Login failed. Please check your credentials.';
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleLogin();
	}
</script>

<svelte:head>
	<title>Admin Login | Rondwell HQ</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="bg flex h-full min-h-screen flex-col items-stretch">
	<!-- Header (matching main auth) -->
	<div class="relative w-full border-b border-[#AAA19F]">
		<header class="relative z-20 mx-auto flex max-w-screen-2xl items-center justify-between px-6 py-3 md:px-10">
			<a href="/" class="flex items-center gap-2">
				<img src="/logo.svg" alt="Rondwell Logo" class="h-8 w-auto" />
			</a>
			<div class="flex items-center gap-3 text-[#909EA3] md:gap-6">
				<span class="hidden text-sm md:inline">{now}</span>
				<span class="flex items-center gap-1.5 rounded-full bg-[#513BE2]/10 px-3 py-1 text-xs font-semibold text-[#513BE2]">
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
					Admin Portal
				</span>
			</div>
		</header>
	</div>

	<!-- Login Card -->
	<div class="h-full flex-1 px-4 py-15">
		<div class="mx-auto w-full max-w-[405px] rounded-[12px] bg-[#FDFCFB] p-6 shadow-sm">
			<div class="mb-6 space-y-3 text-left">
				<div class="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#F4F3F3]">
					<img src="/logo1.svg" alt="logo" />
				</div>
				<h2 class="text-2xl font-semibold">
					<span class="gradient-text">Rondwell</span> HQ
				</h2>
				<p class="text-sm text-[#919091]">Admin access only. Sign in with your credentials.</p>
			</div>

			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="space-y-4" on:keydown={handleKeydown}>
				<!-- Email -->
				<div>
					<label for="admin-email" class="mb-1 block text-sm font-medium">Email</label>
					<input
						id="admin-email"
						bind:value={email}
						type="email"
						placeholder="you@email.com"
						class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
					/>
				</div>

				<!-- Password -->
				<div>
					<label for="admin-password" class="mb-1 block text-sm font-medium">Password</label>
					<div class="relative">
						<input
							id="admin-password"
							bind:value={password}
							type={showPassword ? 'text' : 'password'}
							placeholder="Enter your password"
							class="h-[41.25px] w-full rounded-md border border-gray-300 px-3 py-2 pr-10 focus:ring-2 focus:ring-black focus:outline-none"
						/>
						<button
							type="button"
							on:click={() => (showPassword = !showPassword)}
							class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{#if showPassword}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 1l22 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
							{:else}
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/></svg>
							{/if}
						</button>
					</div>
				</div>

				<!-- Sign In Button -->
				<button
					on:click={handleLogin}
					disabled={loading}
					class="w-full rounded-md bg-black py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
				>
					{loading ? 'Signing in...' : 'Sign In'}
				</button>

				{#if errorMsg}
					<p class="text-center text-sm text-red-500">{errorMsg}</p>
				{/if}

				<!-- Divider -->
				<div class="flex items-center gap-3 pt-1">
					<div class="h-px flex-1 bg-gray-200"></div>
					<span class="text-xs text-gray-400">Authorized personnel only</span>
					<div class="h-px flex-1 bg-gray-200"></div>
				</div>
			</div>
		</div>

		<!-- Back link -->
		<p class="mt-6 text-center text-sm text-[#909EA3]">
			<a href="/" class="transition hover:text-gray-600">← Back to Rondwell</a>
		</p>
	</div>
</main>

<style>
	.gradient-text {
		background: linear-gradient(90deg, #db3ec6 0%, #513be2 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
		color: transparent;
	}

	.bg {
		background: conic-gradient(
			from 10.7deg at 50.03% 44.27%,
			rgba(242, 243, 246, 0.923391) -135.02deg,
			rgba(240, 245, 245, 0.985181) 34.46deg,
			#f0f5f5 75.11deg,
			#fae9fa 134.76deg,
			#ffefec 175.96deg,
			#fbebf6 184.8deg,
			rgba(250, 233, 250, 0.36) 203.89deg,
			rgba(242, 243, 246, 0.923391) 224.98deg,
			rgba(240, 245, 245, 0.985181) 394.46deg
		);
	}
</style>
