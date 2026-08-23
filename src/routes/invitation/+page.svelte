<!--
  H-05 — LEGACY entry point: `/invitation?token=…`.

  The token used to travel here as a query parameter, which logged a 30-day
  credential into every proxy and CDN on the path and leaked it through
  `Referer`. New invitation emails link to `/invitation/[token]` instead.

  This route stays so links already in inboxes keep working. Retire it once the
  legacy token TTL has elapsed — the Deploy-gate on H-05.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import InvitationView from './InvitationView.svelte';

	$: token = $page.url.searchParams.get('token') ?? '';
</script>

<InvitationView {token} />
