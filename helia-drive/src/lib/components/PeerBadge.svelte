<script>
  let { peerId = null } = $props();
  let copied = $state(false);

  const short = $derived(peerId ? `${peerId.slice(0, 8)}…${peerId.slice(-8)}` : '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(peerId);
      copied = true;
      setTimeout(() => (copied = false), 1800);
    } catch {
      /* sem permissão de clipboard */
    }
  }
</script>

<div class="flex items-center gap-3 rounded-full border border-line bg-white py-1.5 pr-1.5 pl-4">
  <span class="relative flex size-2.5" aria-hidden="true">
    {#if peerId}
      <span class="absolute inline-flex size-full rounded-full bg-node opacity-60 motion-safe:animate-ping"></span>
      <span class="relative inline-flex size-2.5 rounded-full bg-node"></span>
    {:else}
      <span class="relative inline-flex size-2.5 rounded-full bg-amber-400"></span>
    {/if}
  </span>

  <div class="min-w-0 leading-tight">
    <p class="text-xs text-ink-soft">Seu Peer ID</p>
    {#if peerId}
      <p class="font-mono text-sm font-medium" title={peerId}>{short}</p>
    {:else}
      <p class="text-sm text-ink-soft">Conectando ao nó…</p>
    {/if}
  </div>

  <button
    type="button"
    onclick={copy}
    disabled={!peerId}
    aria-live="polite"
    class="ml-1 cursor-pointer rounded-full bg-paper px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-line disabled:cursor-not-allowed disabled:opacity-50"
  >
    {copied ? 'Copiado' : 'Copiar'}
  </button>
</div>
