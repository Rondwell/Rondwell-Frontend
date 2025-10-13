export function clickOutside(node: HTMLElement, onClose: () => void) {
    const handleClick = (event: MouseEvent) => {
        if (!node.contains(event.target as Node)) {
            onClose();
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}
