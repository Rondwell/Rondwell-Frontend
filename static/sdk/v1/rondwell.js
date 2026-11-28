/* Rondwell Browser Web SDK v1 — Event Page Modal, Inline Embed & Collection SDK */
(function (global) {
  'use strict';

  var DEFAULT_BASE_URL =
    (document.currentScript && document.currentScript.src
      ? new URL(document.currentScript.src).origin
      : 'https://rondwell.com');

  var state = {
    publishableKey: '',
    baseUrl: DEFAULT_BASE_URL,
    theme: 'light',
    primaryColor: '',
    backgroundColor: '',
    textColor: '',
    borderRadius: 12,
  };

  function resolveBase(override) {
    return String(override || state.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  function buildUrl(path, opts) {
    opts = opts || {};
    var base = resolveBase(opts.baseUrl);
    var p = new URLSearchParams();
    var pk = opts.publishableKey || state.publishableKey;
    if (pk) p.set('pk', pk);
    if (opts.theme || state.theme) p.set('theme', opts.theme || state.theme);
    if (opts.primaryColor || state.primaryColor) p.set('primary', opts.primaryColor || state.primaryColor);
    if (opts.backgroundColor || state.backgroundColor) p.set('bg', opts.backgroundColor || state.backgroundColor);
    if (opts.textColor || state.textColor) p.set('text', opts.textColor || state.textColor);
    var radius = opts.borderRadius !== undefined ? opts.borderRadius : state.borderRadius;
    if (radius !== undefined && radius !== '') p.set('radius', String(radius));
    if (opts.ticketId) p.set('ticketId', String(opts.ticketId));
    if (opts.layout) p.set('layout', String(opts.layout));
    if (opts.openMode) p.set('openMode', String(opts.openMode));
    if (opts.redirectUrl) p.set('redirectUrl', String(opts.redirectUrl));
    if (opts.showCover !== undefined) p.set('showCover', String(opts.showCover));
    if (opts.showDescription !== undefined) p.set('showDescription', String(opts.showDescription));
    if (opts.showSeatMap !== undefined) p.set('showSeatMap', String(opts.showSeatMap));
    if (opts.showSearch !== undefined) p.set('showSearch', String(opts.showSearch));
    if (opts.showTags !== undefined) p.set('showTags', String(opts.showTags));
    if (opts.showPastEvents !== undefined) p.set('showPastEvents', String(opts.showPastEvents));
    if (opts.mode) p.set('mode', String(opts.mode));
    p.set('parentOrigin', window.location.origin);
    return base + path + '?' + p.toString();
  }

  function safeRedirect(redirectUrl, payload) {
    if (!redirectUrl) return;
    try {
      var u = new URL(redirectUrl, window.location.origin);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return;
      if (payload && payload.registrationId) u.searchParams.set('rondwell_registration_id', payload.registrationId);
      if (payload && payload.eventId) u.searchParams.set('rondwell_event_id', payload.eventId);
      if (payload && payload.status) u.searchParams.set('rondwell_status', payload.status);
      window.location.assign(u.toString());
    } catch (_) {}
  }

  function resolveEl(target) {
    if (typeof target === 'string') {
      var found = document.querySelector(target);
      if (!found) throw new Error('[Rondwell SDK] Element not found: ' + target);
      return found;
    }
    return target;
  }

  function openEventModal(eventIdOrSlug, options) {
    options = options || {};
    var baseOrigin = new URL(resolveBase(options.baseUrl)).origin;
    var prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    var overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,0.68);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;';

    var radius = options.borderRadius !== undefined ? options.borderRadius : state.borderRadius;
    var card = document.createElement('div');
    card.style.cssText =
      'position:relative;width:100%;max-width:640px;height:min(88vh,820px);background:#fff;border-radius:' +
      radius +
      'px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.4);';

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close Rondwell registration modal');
    closeBtn.textContent = '\u00D7';
    closeBtn.style.cssText =
      'position:absolute;top:12px;right:12px;z-index:10;width:34px;height:34px;border-radius:9999px;border:none;background:rgba(15,23,42,0.72);color:#fff;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;';

    var iframe = document.createElement('iframe');
    iframe.src = buildUrl('/embed/event/' + encodeURIComponent(eventIdOrSlug), Object.assign({}, options, { mode: 'modal' }));
    iframe.title = 'Rondwell Event Registration';
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = 'width:100%;height:100%;border:0;display:block;';

    function cleanup() {
      window.removeEventListener('message', onMsg);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      overlay.remove();
      if (typeof options.onClose === 'function') options.onClose();
    }

    function onKey(e) {
      if (e.key === 'Escape') cleanup();
    }

    function onMsg(ev) {
      if (ev.origin !== baseOrigin) return;
      var msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:ready' && options.onReady) options.onReady(msg.payload);
      else if (msg.type === 'rondwell:ticket:selected' && options.onTicketSelected) options.onTicketSelected(msg.payload);
      else if (msg.type === 'rondwell:seat:selected' && options.onSeatSelected) options.onSeatSelected(msg.payload);
      else if (msg.type === 'rondwell:error' && options.onError) options.onError(msg.payload);
      else if (msg.type === 'rondwell:close') cleanup();
      else if (msg.type === 'rondwell:registration:success') {
        if (options.onSuccess) options.onSuccess(msg.payload);
        var dest = options.redirectUrl || (msg.payload && msg.payload.redirectUrl);
        if (dest) {
          setTimeout(function () {
            cleanup();
            safeRedirect(dest, msg.payload);
          }, 900);
        }
      }
    }

    closeBtn.addEventListener('click', cleanup);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) cleanup();
    });
    window.addEventListener('message', onMsg);
    window.addEventListener('keydown', onKey);

    card.appendChild(closeBtn);
    card.appendChild(iframe);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    return { close: cleanup };
  }

  function mountEvent(target, eventIdOrSlug, options) {
    options = options || {};
    var el = resolveEl(target);
    var baseOrigin = new URL(resolveBase(options.baseUrl)).origin;
    var iframe = document.createElement('iframe');
    iframe.src = buildUrl('/embed/event/' + encodeURIComponent(eventIdOrSlug), Object.assign({}, options, { mode: 'inline' }));
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = 'width:100%;min-height:540px;border:0;border-radius:' + (options.borderRadius || 12) + 'px;display:block;';

    function onMsg(ev) {
      if (ev.origin !== baseOrigin || ev.source !== iframe.contentWindow) return;
      var msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:resize' && typeof msg.height === 'number') {
        iframe.style.height = Math.max(420, msg.height) + 'px';
      } else if (msg.type === 'rondwell:registration:success') {
        if (options.onSuccess) options.onSuccess(msg.payload);
        safeRedirect(options.redirectUrl || (msg.payload && msg.payload.redirectUrl), msg.payload);
      }
    }

    window.addEventListener('message', onMsg);
    el.innerHTML = '';
    el.appendChild(iframe);
    return {
      destroy: function () {
        window.removeEventListener('message', onMsg);
        iframe.remove();
      },
    };
  }

  function mountCollection(target, collectionIdOrSlug, options) {
    options = options || {};
    var el = resolveEl(target);
    var baseOrigin = new URL(resolveBase(options.baseUrl)).origin;
    var iframe = document.createElement('iframe');
    iframe.src = buildUrl('/embed/collection/' + encodeURIComponent(collectionIdOrSlug), options);
    iframe.allow = 'payment *; clipboard-write';
    iframe.style.cssText = 'width:100%;min-height:580px;border:0;border-radius:' + (options.borderRadius || 12) + 'px;display:block;';

    function onMsg(ev) {
      if (ev.origin !== baseOrigin || ev.source !== iframe.contentWindow) return;
      var msg = ev.data;
      if (!msg || msg.source !== 'rondwell-sdk') return;
      if (msg.type === 'rondwell:resize' && typeof msg.height === 'number') {
        iframe.style.height = Math.max(420, msg.height) + 'px';
      } else if (msg.type === 'rondwell:collection:open-event' && msg.payload && msg.payload.eventId) {
        if (options.onEventSelect) options.onEventSelect(msg.payload);
        if ((options.openMode || 'modal') === 'modal') {
          openEventModal(msg.payload.eventId, options);
        }
      }
    }

    window.addEventListener('message', onMsg);
    el.innerHTML = '';
    el.appendChild(iframe);
    return {
      destroy: function () {
        window.removeEventListener('message', onMsg);
        iframe.remove();
      },
    };
  }

  function readAttrs(el) {
    return {
      publishableKey: el.getAttribute('data-rondwell-pk') || undefined,
      baseUrl: el.getAttribute('data-rondwell-base') || undefined,
      theme: el.getAttribute('data-rondwell-theme') || undefined,
      primaryColor: el.getAttribute('data-rondwell-primary') || undefined,
      backgroundColor: el.getAttribute('data-rondwell-bg') || undefined,
      textColor: el.getAttribute('data-rondwell-text') || undefined,
      borderRadius: el.getAttribute('data-rondwell-radius') ? Number(el.getAttribute('data-rondwell-radius')) : undefined,
      redirectUrl: el.getAttribute('data-rondwell-redirect') || undefined,
      layout: el.getAttribute('data-rondwell-layout') || undefined,
      openMode: el.getAttribute('data-rondwell-open-mode') || undefined,
    };
  }

  function scanDeclarative() {
    var eventEls = document.querySelectorAll('[data-rondwell-event]');
    for (var i = 0; i < eventEls.length; i++) {
      var el = eventEls[i];
      if (el.__rwBound) continue;
      el.__rwBound = true;
      (function (node) {
        var eventId = node.getAttribute('data-rondwell-event');
        if (!eventId) return;
        var opts = readAttrs(node);
        if (node.getAttribute('data-rondwell-mode') === 'inline') {
          mountEvent(node, eventId, opts);
        } else {
          node.addEventListener('click', function (e) {
            e.preventDefault();
            openEventModal(eventId, opts);
          });
        }
      })(el);
    }

    var colEls = document.querySelectorAll('[data-rondwell-collection]');
    for (var j = 0; j < colEls.length; j++) {
      var cel = colEls[j];
      if (cel.__rwBound) continue;
      cel.__rwBound = true;
      var colId = cel.getAttribute('data-rondwell-collection');
      if (colId) mountCollection(cel, colId, readAttrs(cel));
    }
  }

  var Rondwell = {
    init: function (cfg) {
      cfg = cfg || {};
      Object.assign(state, cfg);
      return Rondwell;
    },
    openEventModal: openEventModal,
    mountEvent: mountEvent,
    mountCollection: mountCollection,
    mountCheckinScanner: function (target, eventId, opts) {
      var el = resolveEl(target);
      var iframe = document.createElement('iframe');
      iframe.src = buildUrl('/embed/checkin/' + encodeURIComponent(eventId), opts);
      iframe.allow = 'camera *; clipboard-write';
      iframe.style.cssText = 'width:100%;min-height:540px;border:0;border-radius:12px;display:block;';
      el.innerHTML = '';
      el.appendChild(iframe);
      return { destroy: function () { iframe.remove(); } };
    },
    mountAttendanceDashboard: function (target, eventId, opts) {
      var el = resolveEl(target);
      var iframe = document.createElement('iframe');
      iframe.src = buildUrl('/embed/attendance/' + encodeURIComponent(eventId), opts);
      iframe.style.cssText = 'width:100%;min-height:480px;border:0;border-radius:12px;display:block;';
      el.innerHTML = '';
      el.appendChild(iframe);
      return { destroy: function () { iframe.remove(); } };
    },
    scan: scanDeclarative,
  };

  global.Rondwell = Rondwell;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanDeclarative);
  } else {
    scanDeclarative();
  }

  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(scanDeclarative).observe(document.documentElement, { childList: true, subtree: true });
  }
})(typeof window !== 'undefined' ? window : this);
