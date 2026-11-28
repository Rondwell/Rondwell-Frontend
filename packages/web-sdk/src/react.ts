import Rondwell from './index';
import type { CollectionEmbedOptions, EventEmbedOptions } from './types';

export * from './types';
export { Rondwell };

export function createRondwellEventTrigger(eventIdOrSlug: string, options: EventEmbedOptions = {}) {
  return () => Rondwell.openEventModal(eventIdOrSlug, options);
}

export function mountRondwellCollection(
  element: HTMLElement | null,
  collectionIdOrSlug: string,
  options: CollectionEmbedOptions = {},
) {
  if (!element) return () => {};
  const handle = Rondwell.mountCollection(element, collectionIdOrSlug, options);
  return handle.destroy;
}
