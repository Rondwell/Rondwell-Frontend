export interface ApiEndpointDoc {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  title: string;
  scope: string;
  summary: string;
  params: Array<{ name: string; location: 'path' | 'query' | 'body'; type: string; required?: boolean; description: string }>;
  requestExample?: string;
  responseExample: string;
  curlExample: string;
  nodeExample: string;
  pythonExample: string;
}

export const SCOPE_REFERENCE = [
  { scope: 'events:read', description: 'List and inspect organizer events & public metadata' },
  { scope: 'events:write', description: 'Create, update, and configure events' },
  { scope: 'tickets:read', description: 'Read ticket tiers, prices & remaining inventory' },
  { scope: 'tickets:write', description: 'Create & manage ticket types' },
  { scope: 'seating:read', description: 'Inspect live seat capacity, holds & section stats (SSE supported)' },
  { scope: 'seating:write', description: 'Hold seats, release holds, and assign seats atomically' },
  { scope: 'attendees:read', description: 'List and retrieve attendee registrations' },
  { scope: 'attendees:write', description: 'Create, update, or cancel individual attendees' },
  { scope: 'attendees:import', description: 'Bulk CSV/JSON attendee import up to 1,000 rows per batch' },
  { scope: 'credentials:read', description: 'Retrieve signed QR check-in payload & door passcode' },
  { scope: 'checkins:read', description: 'Preview eligibility via QR/passcode & list checked-in attendees' },
  { scope: 'checkins:write', description: 'Record atomic idempotent attendee check-in (exempt from monthly quota)' },
  { scope: 'analytics:read', description: 'Read 360° comprehensive, attendance/no-show & seating analytics' },
  { scope: 'analytics:export', description: 'Export comprehensive event analytics as CSV or JSON' },
  { scope: 'collections:read', description: 'Read collections and collection event feeds' },
  { scope: 'embed:write', description: 'Customize embedConfig and mint signed embed sessions' },
  { scope: 'webhooks:read', description: 'List webhook endpoints & delivery history' },
  { scope: 'webhooks:write', description: 'Create, update, test, and replay webhook deliveries' },
  { scope: 'organizations:read', description: 'Read organization profile details' },
  { scope: 'sdk:events', description: 'Publishable key permission for Event Page Web SDK' },
  { scope: 'sdk:collections', description: 'Publishable key permission for Collection Web SDK' },
];

export const WEBHOOK_EVENTS_DOC = [
  { event: 'event.created', description: 'Triggered when an organizer creates an event via API or dashboard.' },
  { event: 'event.updated', description: 'Triggered when event metadata or embed_config changes.' },
  { event: 'attendee.registered', description: 'Triggered when an attendee registers via API or Web SDK modal.' },
  { event: 'attendee.imported', description: 'Triggered after a bulk CSV/JSON attendee import completes.' },
  { event: 'attendee.cancelled', description: 'Triggered when an attendee registration is cancelled.' },
  { event: 'ticket.purchased', description: 'Triggered after payment confirmation settles a paid ticket.' },
  { event: 'checkin.recorded', description: 'Triggered on first successful door check-in (QR or passcode).' },
  { event: 'checkin.duplicate_attempt', description: 'Triggered when a duplicate scan returns 409 already_checked_in.' },
  { event: 'seat.held', description: 'Triggered when seats are atomically held during checkout.' },
  { event: 'seat.assigned', description: 'Triggered when a seat is confirmed for a registration.' },
  { event: 'seat.released', description: 'Triggered when a seat hold is explicitly released.' },
  { event: 'webhook.test', description: 'Synthetic ping dispatched from Developer Settings or POST /v1/webhooks/:id/test.' },
];

export const ERROR_CODES_DOC = [
  { status: 401, code: 'authentication_required', description: 'No Bearer secret key or publishable SDK key provided.' },
  { status: 401, code: 'invalid_api_key', description: 'Provided key hash did not match any active credential.' },
  { status: 401, code: 'expired_api_key', description: 'Key expiry timestamp or rolling grace period elapsed.' },
  { status: 401, code: 'revoked_api_key', description: 'Key was explicitly revoked in Developer Settings.' },
  { status: 403, code: 'insufficient_scope', description: 'Key lacks the required scope for this endpoint.' },
  { status: 403, code: 'ip_not_allowed', description: 'Caller IP is outside the Secret Key CIDR whitelist.' },
  { status: 403, code: 'origin_not_allowed', description: 'Browser Origin is not listed on the Publishable Key.' },
  { status: 429, code: 'rate_limit_exceeded', description: 'Per-minute token limit reached; inspect Retry-After.' },
  { status: 429, code: 'monthly_quota_exceeded', description: 'Monthly API call budget exceeded (door check-ins exempt).' },
  { status: 409, code: 'idempotency_conflict', description: 'Idempotency-Key reused with a different request body.' },
  { status: 400, code: 'validation_error', description: 'Schema validation failed; inspect invalid_params[].' },
  { status: 404, code: 'resource_not_found', description: 'Requested event, collection, attendee, or webhook does not exist.' },
  { status: 409, code: 'already_checked_in', description: 'Attendee credential was already redeemed (returns original timestamp).' },
  { status: 400, code: 'webhook_ssrf_blocked', description: 'Webhook target resolved to loopback, RFC1918, or metadata IP.' },
  { status: 502, code: 'upstream_unavailable', description: 'Downstream microservice timed out or restarted.' },
];

export const REST_ENDPOINTS: ApiEndpointDoc[] = [
  {
    id: 'api-analytics',
    method: 'GET',
    path: '/v1/events/{eventId}/analytics/comprehensive',
    title: '360° Comprehensive Event Analytics',
    scope: 'analytics:read',
    summary:
      'Returns full platform-wide metrics in a single call: registrations, check-ins, no-show counts & rates, ticket sell-through, gross/net revenue, coupons, refunds, seat capacity per section, waitlist, blasts/emails, vendors/speakers/promoters, budget variance, and Web SDK conversion funnel.',
    params: [
      { name: 'eventId', location: 'path', type: 'string', required: true, description: 'Event ObjectId' },
    ],
    responseExample: JSON.stringify(
      {
        data: {
          event_id: '6745abc123def45678901234',
          registrations: { total: 420, attending: 112, checked_in: 298, no_show_count: 112, no_show_rate: 27.3, check_in_rate: 72.7 },
          tickets: { total_sold: 410, total_capacity: 500, sell_through_rate: 82.0, gross_revenue: 6150000, net_revenue: 5842500, currency: 'NGN' },
          seating: { enabled: true, total_seats: 500, assigned_seats: 380, held_seats: 14, available_seats: 106, fill_rate: 76.0 },
          sdk_embed: { views: 1940, modal_opens: 610, registrations_completed: 148, conversion_rate: 24.3 },
        },
      },
      null,
      2,
    ),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X GET "https://api.rondwell.com/v1/events/EVENT_ID/analytics/comprehensive" \\\n  -H "Authorization: Bearer rw_live_your_secret_key"`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `const res = await fetch('https://api.rondwell.com/v1/events/EVENT_ID/analytics/comprehensive', {\n  headers: { Authorization: 'Bearer ' + process.env.RONDWELL_SECRET_KEY },\n});\nconst { data } = await res.json();`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `import requests\nr = requests.get(\n  'https://api.rondwell.com/v1/events/EVENT_ID/analytics/comprehensive',\n  headers={'Authorization': f'Bearer {SECRET_KEY}'},\n)\nprint(r.json()['data'])`,
  },
  {
    id: 'api-seating-capacity',
    method: 'GET',
    path: '/v1/events/{eventId}/seating/capacity',
    title: 'Real-Time Seat Capacity & Section Fill Rates',
    scope: 'seating:read or sdk:events',
    summary:
      'Returns live seat counts across available, held (unexpired checkout locks), occupied, and blocked seats plus a per-section breakdown. Pair with GET /seating/stream for Server-Sent Events.',
    params: [
      { name: 'eventId', location: 'path', type: 'string', required: true, description: 'Event ObjectId' },
    ],
    responseExample: JSON.stringify(
      {
        data: {
          event_id: '6745abc123def45678901234',
          total_seats: 500,
          available_seats: 120,
          held_seats: 12,
          occupied_seats: 360,
          blocked_seats: 8,
          fill_rate_pct: 73.2,
          sections: [{ section: 'VIP Front', total: 100, available: 8, held: 2, occupied: 90, blocked: 0, fill_rate_pct: 90.0 }],
        },
      },
      null,
      2,
    ),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X GET "https://api.rondwell.com/v1/events/EVENT_ID/seating/capacity" \\\n  -H "Authorization: Bearer rw_live_your_secret_key"`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `const res = await fetch('https://api.rondwell.com/v1/events/EVENT_ID/seating/capacity', {\n  headers: { Authorization: 'Bearer ' + process.env.RONDWELL_SECRET_KEY },\n});`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `r = requests.get('https://api.rondwell.com/v1/events/EVENT_ID/seating/capacity', headers={'Authorization': f'Bearer {SECRET_KEY}'})`,
  },
  {
    id: 'api-seating-holds',
    method: 'POST',
    path: '/v1/events/{eventId}/seating/holds',
    title: 'Hold Seats Atomically',
    scope: 'seating:write',
    summary: 'Atomically locks up to 10 seats for a checkout window (default 10 minutes). Returns hold_tokens required at assignment.',
    params: [
      { name: 'seat_ids', location: 'body', type: 'string[]', required: true, description: '1 to 10 seatIds' },
      { name: 'hold_seconds', location: 'body', type: 'integer', description: 'Hold duration in seconds (60-1800)' },
    ],
    requestExample: JSON.stringify({ seat_ids: ['seat_vip_a1', 'seat_vip_a2'], hold_seconds: 600 }, null, 2),
    responseExample: JSON.stringify({ data: { holds: [{ seat_id: 'seat_vip_a1', seat_number: 'VIP-A1', hold_token: 'ht_99a1' }], expires_at: '2026-11-28T12:10:00.000Z' } }, null, 2),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X POST "https://api.rondwell.com/v1/events/EVENT_ID/seating/holds" \\\n  -H "Authorization: Bearer rw_live_your_secret_key" \\\n  -H "Idempotency-Key: idem-hold-123" \\\n  -H "Content-Type: application/json" \\\n  -d '{"seat_ids":["seat_vip_a1"],"hold_seconds":600}'`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `await fetch('https://api.rondwell.com/v1/events/EVENT_ID/seating/holds', {\n  method: 'POST',\n  headers: { Authorization: 'Bearer ' + SECRET_KEY, 'Idempotency-Key': 'hold-1', 'Content-Type': 'application/json' },\n  body: JSON.stringify({ seat_ids: ['seat_vip_a1'] }),\n});`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `requests.post('https://api.rondwell.com/v1/events/EVENT_ID/seating/holds', json={'seat_ids': ['seat_vip_a1']}, headers={'Authorization': f'Bearer {SECRET_KEY}'})`,
  },
  {
    id: 'api-attendees-import',
    method: 'POST',
    path: '/v1/events/{eventId}/attendees/import',
    title: 'Bulk Import Attendees (JSON or CSV)',
    scope: 'attendees:import',
    summary: 'Imports up to 1,000 external attendees in a single idempotent request and triggers attendee.imported webhooks.',
    params: [
      { name: 'attendees', location: 'body', type: 'array', description: 'Array of { email, first_name, last_name, ticket_type_id }' },
      { name: 'csv', location: 'body', type: 'string', description: 'Alternative raw CSV string with email header' },
    ],
    requestExample: JSON.stringify({ attendees: [{ email: 'ada@acme.com', first_name: 'Ada', last_name: 'Lovelace' }] }, null, 2),
    responseExample: JSON.stringify({ data: { imported: 1 } }, null, 2),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X POST "https://api.rondwell.com/v1/events/EVENT_ID/attendees/import" \\\n  -H "Authorization: Bearer rw_live_your_secret_key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"attendees":[{"email":"ada@acme.com","first_name":"Ada","last_name":"Lovelace"}]}'`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `await fetch('https://api.rondwell.com/v1/events/EVENT_ID/attendees/import', {\n  method: 'POST',\n  headers: { Authorization: 'Bearer ' + SECRET_KEY, 'Content-Type': 'application/json' },\n  body: JSON.stringify({ attendees: [{ email: 'ada@acme.com', first_name: 'Ada' }] }),\n});`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `requests.post('https://api.rondwell.com/v1/events/EVENT_ID/attendees/import', json={'attendees': [{'email': 'ada@acme.com'}]}, headers={'Authorization': f'Bearer {SECRET_KEY}'})`,
  },
  {
    id: 'api-checkins-record',
    method: 'POST',
    path: '/v1/events/{eventId}/checkins',
    title: 'Record Door Check-In (Idempotent)',
    scope: 'checkins:write',
    summary: 'Atomically checks in an attendee using QR token or door passcode. Exempt from monthly API quotas; returns 409 already_checked_in on duplicate scans.',
    params: [
      { name: 'method', location: 'body', type: 'QR_CODE | PASSCODE', required: true, description: 'Credential verification mode' },
      { name: 'qr_token', location: 'body', type: 'string', description: 'Required when method=QR_CODE' },
      { name: 'passcode', location: 'body', type: 'string', description: 'Required when method=PASSCODE' },
    ],
    requestExample: JSON.stringify({ method: 'PASSCODE', passcode: 'RW-84219' }, null, 2),
    responseExample: JSON.stringify({ data: { message: 'Check-in successful', attendee: { attendee_status: 'CHECKED_IN' } } }, null, 2),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X POST "https://api.rondwell.com/v1/events/EVENT_ID/checkins" \\\n  -H "Authorization: Bearer rw_live_your_secret_key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"method":"PASSCODE","passcode":"RW-84219"}'`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `await fetch('https://api.rondwell.com/v1/events/EVENT_ID/checkins', {\n  method: 'POST',\n  headers: { Authorization: 'Bearer ' + SECRET_KEY, 'Content-Type': 'application/json' },\n  body: JSON.stringify({ method: 'PASSCODE', passcode: 'RW-84219' }),\n});`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `requests.post('https://api.rondwell.com/v1/events/EVENT_ID/checkins', json={'method': 'PASSCODE', 'passcode': 'RW-84219'}, headers={'Authorization': f'Bearer {SECRET_KEY}'})`,
  },
  {
    id: 'api-collections-events',
    method: 'GET',
    path: '/v1/collections/{collectionIdOrSlug}/events',
    title: 'List Collection Events (Collection SDK Feed)',
    scope: 'collections:read or sdk:collections',
    summary: 'Fetches a collection, its event tags, and all events under that collection for custom storefronts and Collection SDK widgets.',
    params: [
      { name: 'collectionIdOrSlug', location: 'path', type: 'string', required: true, description: 'Collection ID or canonical slug' },
    ],
    responseExample: JSON.stringify({ collection: { name: 'Lagos Tech Week' }, count: 4, data: [{ title: 'AI Founders Summit', event_type: 'PHYSICAL' }] }, null, 2),
    // csp-ignore-next-line — copyable API documentation snippet
    curlExample: `curl -X GET "https://api.rondwell.com/v1/collections/lagos-tech-week/events" \\\n  -H "X-Rondwell-Publishable-Key: rw_live_pub_your_sdk_key"`,
    // csp-ignore-next-line — copyable API documentation snippet
    nodeExample: `await fetch('https://api.rondwell.com/v1/collections/lagos-tech-week/events', {\n  headers: { 'X-Rondwell-Publishable-Key': 'rw_live_pub_...' },\n});`,
    // csp-ignore-next-line — copyable API documentation snippet
    pythonExample: `requests.get('https://api.rondwell.com/v1/collections/lagos-tech-week/events', headers={'X-Rondwell-Publishable-Key': 'rw_live_pub_...'})`,
  },
];
