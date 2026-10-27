<script>
  import { drive } from '$lib/drive.svelte.js';

  let { open = $bindable(false) } = $props();

  let dialog;
  let cid = $state('');
  let name = $state('');
  let error = $state('');

  // Sincroniza a prop `open` com o <dialog> nativo (foco preso, Esc e backdrop de graça).
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });

  function reset() {
    open = false;
    cid = '';
    name = '';
    error = '';
  }

  function submit(e) {
    e.preventDefault();
    const check = drive.checkCid(cid);
    if (check.error) {
      error = check.error;
      return;
    }
    // Sem await: a busca segue em segundo plano, com um card de progresso na lista.
    drive.addByCid(check.cid, name);
    reset();
  }
</script>

<dialog
  bind:this={dialog}
  onclose={reset}
  onclick={(e) => e.target === dialog && dialog.close()}
  aria-labelledby="add-cid-title"
  class="m-auto w-[min(32rem,calc(100%-2rem))] rounded-3xl border border-line bg-white p-0 text-ink backdrop:bg-ink/40"
>
  <form onsubmit={submit} class="flex flex-col gap-5 p-6 sm:p-8">
    <div>
      <h2 id="add-cid-title" class="font-display text-2xl font-bold tracking-tight">Adicionar por CID</h2>
      <p class="mt-1 text-sm text-ink-soft">
        Traz para o seu drive um arquivo que já está no IPFS. O conteúdo é baixado da rede e fixado no seu nó.
      </p>
    </div>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium">CID</span>
      <input
        bind:value={cid}
        oninput={() => (error = '')}
        required
        spellcheck="false"
        autocomplete="off"
        placeholder="bafy… ou Qm…"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'add-cid-error' : undefined}
        class="rounded-xl border border-line bg-paper px-3.5 py-2.5 font-mono text-sm placeholder:text-ink-soft/60 aria-invalid:border-red-400"
      />
      {#if error}
        <span id="add-cid-error" role="alert" class="text-sm text-red-800">{error}</span>
      {/if}
    </label>

    <label class="flex flex-col gap-1.5">
      <span class="text-sm font-medium">Nome do arquivo <span class="font-normal text-ink-soft">(opcional)</span></span>
      <input
        bind:value={name}
        autocomplete="off"
        placeholder="relatorio.pdf"
        class="rounded-xl border border-line bg-paper px-3.5 py-2.5 text-sm placeholder:text-ink-soft/60"
      />
      <span class="text-xs text-ink-soft">O CID não guarda o nome. Se deixar em branco, usamos o próprio CID.</span>
    </label>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        onclick={() => dialog.close()}
        class="cursor-pointer rounded-full border border-ink px-5 py-2.5 text-sm font-medium transition-colors hover:bg-ink hover:text-white"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="cursor-pointer rounded-full bg-node px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-node-deep"
      >
        Adicionar
      </button>
    </div>
  </form>
</dialog>
