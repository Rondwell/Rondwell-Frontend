export function clickOutside(node: HTMLElement, callback: () => void) {
    const handleClick = (event: MouseEvent) => {
        if (
            node &&
            !node.contains(event.target as Node) &&
            node.offsetParent !== null // ensures element is visible
        ) {
            callback();
        }
    };
    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}
