import type {
  CollectionEmbedOptions,
  EventEmbedOptions,
  RondwellInitConfig,
  RondwellRegistrationSuccessPayload,
} from './types';

export * from './types';

const DEFAULT_BASE_URL = 'https://rondwell.com';

class RondwellWebSdk {
  private config: RondwellInitConfig = { baseUrl: DEFAULT_BASE_URL };

  init(config: RondwellInitConfig = {}): this {
    this.config = { ...this.config, ...config };
    return this;
  }

  private resolveTarget(target: string | HTMLElement): HTMLElement {
    if (typeof target === 'string') {
      const el = document.querySelector<HTMLElement>(target);
      if (!el) throw new Error(`[Rondwell SDK] Mount target not found: ${target}`);
      return el;
    }
    return target;
  }

  private resolveBaseUrl(override?: string): string {
    return (override || this.config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  private buildEmbedUrl(path: string, opts: Record<string, any> = {}): string {
    const base = this.resolveBaseUrl(opts.baseUrl);
    const params = new URLSearchParams();
    const pk = opts.publishableKey || this.config.publishableKey;
    if (pk) params.set('pk', pk);
    const theme = opts.theme ?? this.config.theme;
    if (theme) params.set('theme', String(theme));
    const primary = opts.primaryColor ?? this.config.primaryColor;
    if (primary) params.set('primary', String(primary));
    const bg = opts.backgroundColor ?? this.config.backgroundColor;
    if (bg) params.set('bg', String(bg));
    const text = opts.textColor ?? this.config.textColor;
    if (text) params.set('text', String(text));
    const radius = opts.borderRadius ?? this.config.borderRadius;
    if (radius !== undefined) params.set('radius', String(radius));
    if (opts.ticketId) params.set('ticketId', String(opts.ticketId));
    if (opts.layout) params.set('layout', String(opts.layout));
    if (opts.openMode) params.set('openMode', String(opts.openMode));
    if (opts.redirectUrl) params.set('redirectUrl', String(opts.redirectUrl));
    if (opts.showCover !== undefined) params.set('showCover', String(opts.showCover));
    if (opts.showDescription !== undefined) params.set('showDescription', String(opts.showDescription));
    if (opts.showSeatMap !== undefined) params.set('showSeatMap', String(opts.showSeatMap));
    if (opts.showAttendeeCount !== undefined) params.set('showAttendeeCount', String(opts.showAttendeeCount));
    if (opts.showSearch !== undefined) params.set('showSearch', String(opts.showSearch));
    if (opts.showTags !== undefined) params.set('showTags', String(opts.showTags));
    if (opts.showPastEvents !== undefined) params.set('showPastEvents', String(opts.showPastEvents));
    if (typeof window !== 'undefined' && window.location?.origin) {
      params.set('parentOrigin', window.location.origin);
    }
    const qs = params.toString();
    return `${base}${path}${qs ? `?${qs}` : ''}`;
  }

  private applySafeRedirect(redirectUrl: string | undefined, payload: RondwellRegistrationSuccessPayload): void {
    if (!redirectUrl || typeof window === 'undefined') return;
    try {
      const target = new URL(redirectUrl, window.location.origin);
      if (target.protocol !== 'https:' && target.protocol !== 'http:') return;
      if (payload.registrationId) target.searchParams.set('rondwell_registration_id', payload.registrationId);
      if (payload.eventId) target.searchParams.set('rondwell_event_id', payload.eventId);
      if (payload.status) target.searchParams.set('rondwell_status', payload.status);
      window.location.assign(target.toString());
    } catch {
      /* ignore invalid redirect URL */
    }
  }

  openEventModal(eventIdOrSlug: string, options: EventEmbedOptions = {}): { close: () => void } {
    if (typeof document === 'undefined') return { close: () => {} };
    const baseOrigin = new URL(this.resolveBaseUrl(options.baseUrl)).origin;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,0.68);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';

    const radius = options.borderRadius ?? this.config.borderRadius ?? 16;
    const card = document.createElement('div');
    card.style.cssText = `position:relative;width:100%;max-width:640px;height:min(88vh,820px);background:#ffffff;border-radius:${radius}px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.4);`;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Rondwell registration modal');
    closeBtn.textContent = '×';
    closeBtn.style.cssText =
      'position:absolute;top:12px;right:12px;z-index:10;width:34px;height:34px;border-radius:9999px;border:none;background:rgba(15,23,42,0.72);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;';

    const iframe = document.createElement('iframe');
    iframe.src = this.buildEmbedUrl(`/embed/event/${encodeURIComponent(eventIdOrSlug)}`, {
      ...options,
      mode: 'modal',
    });
    iframe.title = 'Rondwell Event Registration';
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';

    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      overlay.remove();
      options.onClose?.();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== baseOrigin) return;
      const msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:ready') options.onReady?.(msg.payload);
      else if (msg.type === 'rondwell:ticket:selected') options.onTicketSelected?.(msg.payload);
      else if (msg.type === 'rondwell:seat:selected') options.onSeatSelected?.(msg.payload);
      else if (msg.type === 'rondwell:error') options.onError?.(msg.payload);
      else if (msg.type === 'rondwell:close') cleanup();
      else if (msg.type === 'rondwell:registration:success') {
        options.onSuccess?.(msg.payload);
        const dest = options.redirectUrl || msg.payload?.redirectUrl;
        if (dest) {
          setTimeout(() => {
            cleanup();
            this.applySafeRedirect(dest, msg.payload);
          }, 900);
        }
      }
    };

    closeBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });
    window.addEventListener('message', onMessage);
    window.addEventListener('keydown', onKeyDown);

    card.appendChild(closeBtn);
    card.appendChild(iframe);
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    return { close: cleanup };
  }

  mountEvent(target: string | HTMLElement, eventIdOrSlug: string, options: EventEmbedOptions = {}): { destroy: () => void } {
    const el = this.resolveTarget(target);
    const baseOrigin = new URL(this.resolveBaseUrl(options.baseUrl)).origin;
    const iframe = document.createElement('iframe');
    iframe.src = this.buildEmbedUrl(`/embed/event/${encodeURIComponent(eventIdOrSlug)}`, {
      ...options,
      mode: 'inline',
    });
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = `width:100%;min-height:540px;border:0;border-radius:${options.borderRadius ?? 12}px;display:block;`;

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== baseOrigin || ev.source !== iframe.contentWindow) return;
      const msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:resize' && typeof msg.height === 'number') {
        iframe.style.height = `${Math.max(420, msg.height)}px`;
      } else if (msg.type === 'rondwell:registration:success') {
        options.onSuccess?.(msg.payload);
        this.applySafeRedirect(options.redirectUrl || msg.payload?.redirectUrl, msg.payload);
      } else if (msg.type === 'rondwell:ready') options.onReady?.(msg.payload);
    };

    window.addEventListener('message', onMessage);
    el.innerHTML = '';
    el.appendChild(iframe);
    return {
      destroy: () => {
        window.removeEventListener('message', onMessage);
        iframe.remove();
      },
    };
  }

  mountCollection(target: string | HTMLElement, collectionIdOrSlug: string, options: CollectionEmbedOptions = {}): { destroy: () => void } {
    const el = this.resolveTarget(target);
    const baseOrigin = new URL(this.resolveBaseUrl(options.baseUrl)).origin;
    const iframe = document.createElement('iframe');
    iframe.src = this.buildEmbedUrl(`/embed/collection/${encodeURIComponent(collectionIdOrSlug)}`, options);
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = `width:100%;min-height:580px;border:0;border-radius:${options.borderRadius ?? 12}px;display:block;`;

    const onMessage = (ev: MessageEvent) => {
      if (ev.origin !== baseOrigin || ev.source !== iframe.contentWindow) return;
      const msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:resize' && typeof msg.height === 'number') {
        iframe.style.height = `${Math.max(420, msg.height)}px`;
      } else if (msg.type === 'rondwell:collection:open-event' && msg.payload?.eventId) {
        options.onEventSelect?.(msg.payload);
        if ((options.openMode || 'modal') === 'modal') {
          this.openEventModal(msg.payload.eventId, {
            publishableKey: options.publishableKey,
            baseUrl: options.baseUrl,
            theme: options.theme,
            primaryColor: options.primaryColor,
            backgroundColor: options.backgroundColor,
            textColor: options.textColor,
            borderRadius: options.borderRadius,
            redirectUrl: options.redirectUrl,
            onSuccess: options.onSuccess,
          });
        }
      } else if (msg.type === 'rondwell:ready') options.onReady?.(msg.payload);
    };

    window.addEventListener('message', onMessage);
    el.innerHTML = '';
    el.appendChild(iframe);
    return {
      destroy: () => {
        window.removeEventListener('message', onMessage);
        iframe.remove();
      },
    };
  }
}

export const Rondwell = new RondwellWebSdk();
export default Rondwell;
