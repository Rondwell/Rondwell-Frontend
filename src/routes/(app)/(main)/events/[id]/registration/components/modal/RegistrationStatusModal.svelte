<script lang="ts">
	export let open = false;
	export let registrationOpen = true;
	export let onConfirm: (isOpen: boolean) => void = () => {};

	let selectedValue = registrationOpen;
	let saving = false;

	$: if (open) selectedValue = registrationOpen;

	async function confirm() {
		saving = true;
		await onConfirm(selectedValue);
		saving = false;
	}
</script>

{#if open}
	<div id="registration-status" class="absolute top-[60px] left-0 z-40 mt-2 inline-block text-left">
		<div class="relative w-[315px] max-w-lg rounded-lg bg-[#FFFCFC] p-4 shadow-lg">
			<div class="mb-3 flex h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF0F0]">
				<svg width="29" height="27" viewBox="0 0 29 27" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M8.33203 3.92188H10.6357V6.00488C10.6357 6.55688 11.0281 6.99464 11.5283 7.14355V9.59668C11.0279 9.7455 10.6357 10.1842 10.6357 10.7363V15.4785C10.6359 16.0304 11.0281 16.4684 11.5283 16.6172V19.0693C11.0279 19.2181 10.6358 19.6569 10.6357 20.209V22.293H8.33203C5.71655 22.2929 4.13765 21.9216 3.19629 21.0576C2.26522 20.2028 1.86426 18.7754 1.86426 16.3848V15.8389C1.86426 15.6273 2.07001 15.3936 2.38184 15.3936C3.70036 15.3935 4.83875 14.3926 4.83887 13.1074C4.83887 11.8221 3.70043 10.8203 2.38184 10.8203C2.07015 10.8203 1.86444 10.5875 1.86426 10.376V9.8291C1.86429 7.43867 2.26526 6.01199 3.19629 5.15723C4.13763 4.29309 5.71637 3.9219 8.33203 3.92188Z" fill="#3CBD2C" stroke="#3CBD2C" stroke-width="0.74922"/>
					<path opacity="0.4" d="M20.2305 3.92188C22.8461 3.92191 24.4249 4.29305 25.3662 5.15723C26.2972 6.01199 26.6982 7.43867 26.6982 9.8291V10.9219C26.6982 11.1334 26.4924 11.3671 26.1807 11.3672C24.8621 11.3672 23.7238 12.3681 23.7236 13.6533C23.7236 14.9386 24.8621 15.9404 26.1807 15.9404C26.4923 15.9405 26.698 16.1733 26.6982 16.3848C26.6982 18.7754 26.2973 20.2028 25.3662 21.0576C24.4249 21.9217 22.8459 22.2929 20.2305 22.293H13.167V20.209C13.1669 19.6573 12.7743 19.2194 12.2744 19.0703V16.6162C12.7742 16.4671 13.1668 16.0301 13.167 15.4785V10.7363C13.167 10.1846 12.7744 9.74675 12.2744 9.59766V7.14355C12.7743 6.99443 13.167 6.55662 13.167 6.00488V3.92188H20.2305Z" fill="#3CBD2C" stroke="#3CBD2C" stroke-width="0.74922"/>
				</svg>
			</div>

			<h2 class="text-lg font-semibold text-black">Registration Status</h2>
			<p class="mt-1 mb-4 text-sm leading-snug font-light text-[#8E8E90]">
				Control whether attendees can register for this event.
			</p>

			<div class="my-4 flex items-center justify-between">
				<label class="text-sm font-medium text-gray-700">Registration Open</label>
				<button
					aria-label="toggle"
					class="relative h-6 w-10 rounded-full transition-colors duration-300"
					class:bg-gray-300={!selectedValue}
					class:bg-gray-800={selectedValue}
					on:click={() => (selectedValue = !selectedValue)}
				>
					<span
						class="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-300"
						class:translate-x-4={selectedValue}
					></span>
				</button>
			</div>

			<button
				class="w-full rounded-lg bg-gray-900 py-2.5 font-medium text-white transition hover:bg-gray-800 disabled:opacity-50"
				disabled={saving}
				on:click={confirm}
			>
				{saving ? 'Saving...' : 'Confirm'}
			</button>
		</div>
	</div>
{/if}
