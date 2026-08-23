<!--
  H-05 — the invitation token now arrives as a PATH SEGMENT.

  It used to be `?token=…`, which put a 30-day credential into every proxy,
  CDN and analytics access log the mail client and browser touched, and leaked
  it onward through the `Referer` header of any request this page made.

  This route mirrors `/admin-invitation/[token]`, which already did it right.
  The page body is unchanged — it reads the token from `$page.params` instead
  of the query string. `/invitation?token=…` is kept alive by the sibling
  `+page.svelte` so links already sitting in inboxes keep working.
-->
<script lang="ts">
	import { page } from '$app/stores';
	import InvitationPage from '../InvitationView.svelte';

	$: token = ($page.params as any).token as string;
</script>

<InvitationPage {token} />
