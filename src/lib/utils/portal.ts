/**
 * Portal action — moves a node to another container (default: <body>).
 *
 * Needed by anchored popovers so they escape parent `overflow: hidden` /
 * `transform` / stacking contexts. The node keeps its Svelte reactivity; only
 * its DOM position changes.
 *
 * Usage:
 *   <div use:portal>...</div>
 *   <div use:portal={'#some-container'}>...</div>
 */
export function portal(node: HTMLElement, target: HTMLElement | string = 'body') {
	let mounted = false;

	function resolve(t: HTMLElement | string): HTMLElement | null {
		if (typeof t !== 'string') return t;
		if (typeof document === 'undefined') return null;
		return document.querySelector(t);
	}

	function mount(t: HTMLElement | string) {
		const container = resolve(t);
		if (!container) return;
		container.appendChild(node);
		node.hidden = false;
		mounted = true;
	}

	mount(target);

	return {
		update(newTarget: HTMLElement | string) {
			mount(newTarget);
		},
		destroy() {
			if (mounted && node.parentNode) {
				node.parentNode.removeChild(node);
			}
		}
	};
}

/**
 * Roving keyboard navigation for option lists.
 *
 * Moves focus between elements matching `[data-option]:not([disabled])` inside
 * the node with ArrowUp / ArrowDown / Home / End. Typing letters is left alone
 * so it composes with a search input placed outside the list.
 */
export function listNav(node: HTMLElement) {
	function options(): HTMLElement[] {
		return Array.from(node.querySelectorAll<HTMLElement>('[data-option]')).filter(
			(el) => !el.hasAttribute('disabled') && el.offsetParent !== null
		);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
		const items = options();
		if (items.length === 0) return;

		const current = document.activeElement as HTMLElement | null;
		const index = current ? items.indexOf(current) : -1;

		let next = index;
		if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
		else if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = items.length - 1;

		event.preventDefault();
		items[next]?.focus();
		items[next]?.scrollIntoView({ block: 'nearest' });
	}

	node.addEventListener('keydown', handleKeydown);

	return {
		destroy() {
			node.removeEventListener('keydown', handleKeydown);
		}
	};
}
