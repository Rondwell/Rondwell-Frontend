<script lang="ts">
	export let organizerName: string;
	export let organizerAvatar: string;
	export let organizerSocial: boolean;
	export let socialLinks: Record<string, string> = {};
</script>

<div class="flex items-center justify-between">
   <div class="flex items-center gap-[9px] justify-center">
     <img src={organizerAvatar} alt={`${organizerName}-avatar`} class="size-[27px] rounded-full outline outline-[#0D151C]/8" on:error={(e) => { (e.currentTarget as HTMLImageElement).src = '/you-rondwell.png'; }} />
     <h2 class="leading-6 text-[#0D151C] text-base font-normal">{organizerName}</h2>
   </div>
   {#if organizerSocial}
   <div class="flex items-center justify-center gap-0.5">
    {#if socialLinks.instagram}
    <a href="https://instagram.com/{socialLinks.instagram}" target="_blank" rel="noopener" aria-label="Instagram" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 8.64C0 5.616 0 4.104.588 2.948A4.5 4.5 0 012.949.589C4.104 0 5.614 0 8.64 0h.72c3.024 0 4.536 0 5.693.588a4.5 4.5 0 012.359 2.36C18 4.104 18 5.614 18 8.64v.72c0 3.024 0 4.536-.588 5.693a4.5 4.5 0 01-2.36 2.359C13.896 18 12.386 18 9.36 18h-.72c-3.024 0-4.536 0-5.693-.588A4.5 4.5 0 01.589 15.052C0 13.896 0 12.386 0 9.36V8.64z" fill="#0D151C" fill-opacity=".36"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9 13.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zm0-1.8a2.7 2.7 0 100-5.4 2.7 2.7 0 000 5.4z" fill="white"/><circle cx="13.7" cy="4.27" r="1.35" fill="white"/></svg>
    </a>
    {/if}
    {#if socialLinks.x}
    <a href="https://x.com/{socialLinks.x}" target="_blank" rel="noopener" aria-label="X" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
       <svg width="17" height="17" viewBox="0 0 17 17" fill="none"><path d="M17 17L10.352 7.092l.011.01L16.357 0h-2.003l-4.883 5.78L5.594 0H.34l6.207 9.25L0 17h2.003l5.429-6.43L11.747 17H17zM4.8 1.546l9.328 13.908H12.54L3.205 1.546H4.8z" fill="#0D151C" fill-opacity=".36"/></svg>
    </a>
    {/if}
    {#if socialLinks.youtube}
    <a href="https://youtube.com/@{socialLinks.youtube}" target="_blank" rel="noopener" aria-label="YouTube" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
       <svg width="18" height="14" viewBox="0 0 18 14" fill="none"><path d="M17.624 2.18A2.26 2.26 0 0016.035.58C14.628.17 9 .17 9 .17S3.372.17 1.965.58A2.26 2.26 0 00.376 2.18C0 3.59 0 6.54 0 6.54s0 2.95.376 4.36a2.26 2.26 0 001.589 1.6C3.372 12.91 9 12.91 9 12.91s5.628 0 7.035-.41a2.26 2.26 0 001.589-1.6C18 9.49 18 6.54 18 6.54s0-2.95-.376-4.36zM7.2 9.35V3.73L11.88 6.54 7.2 9.35z" fill="#0D151C" fill-opacity=".36"/></svg>
    </a>
    {/if}
    {#if socialLinks.linkedin}
    <a href="https://linkedin.com/in/{socialLinks.linkedin}" target="_blank" rel="noopener" aria-label="LinkedIn" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
       <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M14.82 0H1.18C.53 0 0 .516 0 1.154v13.692C0 15.484.53 16 1.18 16h13.64c.652 0 1.18-.516 1.18-1.154V1.154C16 .516 15.472 0 14.82 0zM4.746 13.634H2.372V5.998h2.374v7.636zM3.56 4.955a1.376 1.376 0 110-2.752 1.376 1.376 0 010 2.752zm10.076 8.679h-2.372V9.922c0-.886-.016-2.025-1.234-2.025-1.234 0-1.423.964-1.423 1.96v3.777H6.234V5.998h2.278v1.043h.032c.317-.6 1.092-1.233 2.247-1.233 2.404 0 2.847 1.582 2.847 3.64v4.186z" fill="#0D151C" fill-opacity=".36"/></svg>
    </a>
    {/if}
    {#if socialLinks.tiktok}
    <a href="https://tiktok.com/@{socialLinks.tiktok}" target="_blank" rel="noopener" aria-label="TikTok" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
       <svg width="14" height="16" viewBox="0 0 14 16" fill="none"><path d="M10.08 0h1.44c.16 1.28.96 2.4 2.16 2.88v2.24c-1.12-.08-2.16-.48-3.04-1.12v4.96c0 2.48-2 4.48-4.48 4.48A4.48 4.48 0 011.68 11.2a4.48 4.48 0 014.48-4.48v2.4a2.08 2.08 0 00-2.08 2.08 2.08 2.08 0 002.08 2.08c1.12 0 2.08-.96 2.08-2.08V0h1.84z" fill="#0D151C" fill-opacity=".36"/></svg>
    </a>
    {/if}
    {#if socialLinks.website}
    <a href={socialLinks.website.startsWith('http') ? socialLinks.website : `https://${socialLinks.website}`} target="_blank" rel="noopener" aria-label="Website" class="size-7.5 inline-flex justify-center items-center opacity-50 hover:opacity-100 transition-opacity">
       <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#0D151C" stroke-opacity=".36" stroke-width="1.2"/><path d="M1 8h14M8 1a11 11 0 013 7 11 11 0 01-3 7 11 11 0 01-3-7 11 11 0 013-7z" stroke="#0D151C" stroke-opacity=".36" stroke-width="1.2"/></svg>
    </a>
    {/if}
   </div>
   {/if}
</div>
