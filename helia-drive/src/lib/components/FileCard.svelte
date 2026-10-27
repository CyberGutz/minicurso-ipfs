<script>
  import { extensionOf, formatBytes, formatDate, kindClass, shortCid } from '$lib/format.js';

  let { file, downloading = false, ondownload, onremove } = $props();
  let copied = $state(false);
  let confirming = $state(false);

  async function copyCid() {
    try {
      await navigator.clipboard.writeText(file.cid);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      /* sem permissão de clipboard */
    }
  }
</script>

<article class="flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition-colors hover:border-node">
  <div class="grid h-28 place-items-center {kindClass(file.name)}" aria-hidden="true">
    <span class="font-display text-4xl font-bold lowercase">.{extensionOf(file.name)}</span>
  </div>

  <div class="flex flex-1 flex-col gap-3 p-4">
    <div class="min-w-0">
      <h3 class="truncate font-medium" title={file.name}>{file.name}</h3>
      <p class="mt-0.5 flex justify-between text-sm text-ink-soft">
        <span>{formatBytes(file.size)}</span>
        <span>{formatDate(file.addedAt)}</span>
      </p>
    </div>

    <button
      type="button"
      onclick={copyCid}
      title="Copiar CID completo"
      class="cursor-pointer truncate rounded-lg bg-paper px-2.5 py-1.5 text-left font-mono text-xs text-ink-soft transition-colors hover:text-ink"
    >
      {copied ? 'CID copiado' : shortCid(file.cid)}
    </button>

    {#if confirming}
      <div class="mt-auto flex flex-col gap-2" role="group" aria-label="Confirmar remoção de {file.name}">
        <p class="text-xs text-ink-soft">
          Remover do seu drive? O arquivo continua no IPFS e pode ser readicionado pelo CID.
        </p>
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => {
              confirming = false;
              onremove();
            }}
            class="flex-1 cursor-pointer rounded-full bg-red-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800"
          >
            Remover
          </button>
          <button
            type="button"
            onclick={() => (confirming = false)}
            class="flex-1 cursor-pointer rounded-full border border-ink px-3 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-white"
          >
            Cancelar
          </button>
        </div>
      </div>
    {:else}
      <div class="mt-auto flex gap-2">
        <button
          type="button"
          onclick={ondownload}
          disabled={downloading}
          aria-label="Baixar {file.name}"
          class="flex-1 cursor-pointer rounded-full border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-white disabled:cursor-wait disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:text-ink"
        >
          {downloading ? 'Baixando…' : 'Baixar'}
        </button>
        <button
          type="button"
          onclick={() => (confirming = true)}
          aria-label="Remover {file.name} do drive"
          title="Remover do drive (o arquivo continua no IPFS)"
          class="cursor-pointer rounded-full px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-800"
        >
          Remover
        </button>
      </div>
    {/if}
  </div>
</article>
