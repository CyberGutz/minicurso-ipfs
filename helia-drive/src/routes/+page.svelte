<script>
  import { onMount } from 'svelte';
  import { drive } from '$lib/drive.svelte.js';
  import { formatBytes, shortCid } from '$lib/format.js';
  import PeerBadge from '$lib/components/PeerBadge.svelte';
  import FileCard from '$lib/components/FileCard.svelte';
  import AddCidDialog from '$lib/components/AddCidDialog.svelte';

  let input;
  let dragging = $state(false);
  let cidDialogOpen = $state(false);
  let depth = 0;

  onMount(() => drive.init());

  function pick(e) {
    if (e.currentTarget.files?.length) drive.add(e.currentTarget.files);
    e.currentTarget.value = '';
  }

  function drop(e) {
    e.preventDefault();
    depth = 0;
    dragging = false;
    if (e.dataTransfer?.files.length) drive.add(e.dataTransfer.files);
  }
</script>

<svelte:window
  ondragenter={(e) => {
    e.preventDefault();
    depth++;
    dragging = true;
  }}
  ondragover={(e) => e.preventDefault()}
  ondragleave={() => {
    if (--depth <= 0) dragging = false;
  }}
  ondrop={drop}
/>

<div class="mx-auto flex min-h-dvh max-w-6xl flex-col gap-10 px-5 py-6 sm:px-8">
  <header class="flex flex-wrap items-center justify-between gap-4">
    <a href="/" class="font-display text-2xl font-bold tracking-tight">Helia Drive</a>
    <PeerBadge peerId={drive.peerId} />
  </header>

  <main class="flex flex-1 flex-col gap-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-display text-4xl font-bold tracking-tight sm:text-5xl">Meus arquivos</h1>
        {#if !drive.loading}
          <p class="mt-2 text-ink-soft">
            {drive.files.length}
            {drive.files.length === 1 ? 'arquivo' : 'arquivos'}, {formatBytes(drive.totalSize)} no total
          </p>
        {/if}
      </div>

      <input bind:this={input} type="file" multiple class="hidden" onchange={pick} />
      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          onclick={() => (cidDialogOpen = true)}
          class="cursor-pointer rounded-full border border-ink px-6 py-3 font-medium transition-colors hover:bg-ink hover:text-white"
        >
          Adicionar por CID
        </button>
        <button
          type="button"
          onclick={() => input.click()}
          class="cursor-pointer rounded-full bg-node px-6 py-3 font-medium text-white transition-colors hover:bg-node-deep"
        >
          Adicionar arquivo
        </button>
      </div>
    </div>

    {#if drive.error}
      <div role="alert" class="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
        <p>{drive.error}</p>
        <button type="button" class="cursor-pointer font-medium underline" onclick={() => (drive.error = '')}>Fechar</button>
      </div>
    {/if}

    {#if drive.loading}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4" aria-busy="true">
        {#each Array(4) as _}
          <div class="h-64 rounded-2xl border border-line bg-white motion-safe:animate-pulse"></div>
        {/each}
      </div>
    {:else if drive.files.length === 0 && drive.uploading.length === 0 && drive.retrieving.length === 0}
      <section class="grid flex-1 place-items-center rounded-3xl border-2 border-dashed border-line py-20 text-center">
        <div class="max-w-sm px-6">
          <h2 class="font-display text-2xl font-bold">Nenhum arquivo por aqui ainda</h2>
          <p class="mt-2 text-ink-soft">Arraste arquivos para esta página, escolha no seu computador ou traga um já existente no IPFS pelo CID. Eles ficam disponíveis na rede IPFS.</p>
          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onclick={() => (cidDialogOpen = true)}
              class="cursor-pointer rounded-full border border-ink px-6 py-3 font-medium transition-colors hover:bg-ink hover:text-white"
            >
              Adicionar por CID
            </button>
            <button
              type="button"
              onclick={() => input.click()}
              class="cursor-pointer rounded-full bg-node px-6 py-3 font-medium text-white transition-colors hover:bg-node-deep"
            >
              Adicionar arquivo
            </button>
          </div>
        </div>
      </section>
    {:else}
      <section class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-4" aria-label="Lista de arquivos">
        {#each drive.uploading as name}
          <div class="flex h-64 flex-col justify-end gap-1 rounded-2xl border border-dashed border-node bg-white p-4 motion-safe:animate-pulse">
            <p class="truncate font-medium" title={name}>{name}</p>
            <p class="text-sm text-ink-soft">Enviando…</p>
          </div>
        {/each}
        {#each drive.retrieving as item (item.cid)}
          <div class="flex h-64 flex-col justify-end gap-3 rounded-2xl border border-dashed border-node bg-white p-4">
            <div class="min-w-0 motion-safe:animate-pulse">
              <p class="truncate font-medium" title={item.name || item.cid}>{item.name || shortCid(item.cid)}</p>
              <p class="text-sm text-ink-soft">Buscando na rede IPFS…</p>
            </div>
            <button
              type="button"
              onclick={() => drive.cancelRetrieval(item.cid)}
              class="cursor-pointer rounded-full border border-ink px-4 py-2 text-sm font-medium transition-colors hover:bg-ink hover:text-white"
            >
              Cancelar
            </button>
          </div>
        {/each}
        {#each drive.files as file (file.cid)}
          <FileCard
            {file}
            downloading={drive.downloading.includes(file.cid)}
            ondownload={() => drive.download(file)}
            onremove={() => drive.remove(file)}
          />
        {/each}
      </section>
    {/if}
  </main>
</div>

<AddCidDialog bind:open={cidDialogOpen} />

{#if dragging}
  <div class="pointer-events-none fixed inset-3 z-50 grid place-items-center rounded-3xl border-2 border-dashed border-node bg-white/90 backdrop-blur-sm">
    <p class="font-display text-3xl font-bold">Solte para adicionar</p>
  </div>
{/if}
