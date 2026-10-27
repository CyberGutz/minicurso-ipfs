import * as ipfs from './ipfs.js';

class Drive {
  peerId = $state(null);
  files = $state([]);
  loading = $state(true);
  uploading = $state([]); // nomes de arquivos em envio
  downloading = $state([]); // CIDs em download
  retrieving = $state([]); // { cid, name } sendo buscados na rede por CID
  #controllers = new Map(); // cid -> AbortController, para cancelar a busca
  error = $state('');

  get totalSize() {
    return this.files.reduce((sum, f) => sum + f.size, 0);
  }

  async init() {
    try {
      const [peerId, files] = await Promise.all([ipfs.getPeerId(), ipfs.listFiles()]);
      this.peerId = peerId;
      this.files = files;
    } catch (e) {
      this.error = 'Não foi possível conectar ao seu nó IPFS. Verifique a conexão e recarregue a página.';
    } finally {
      this.loading = false;
    }
  }

  async add(fileList) {
    for (const file of Array.from(fileList)) {
      this.uploading.push(file.name);
      try {
        const entry = await ipfs.addFile(file);
        // Mesmo conteúdo gera o mesmo CID: não duplica o card.
        if (!this.files.some((f) => f.cid === entry.cid)) this.files.unshift(entry);
      } catch (e) {
        this.error = `Não foi possível adicionar “${file.name}”. Tente novamente.`;
      } finally {
        this.uploading.splice(this.uploading.indexOf(file.name), 1);
      }
    }
  }

  /** Valida o que o usuário digitou. Devolve o CID canônico ou uma mensagem de erro. */
  checkCid(input) {
    let cid;
    try {
      cid = ipfs.normalizeCID(input);
    } catch {
      return { error: 'Esse CID não parece válido. Confira se copiou o texto inteiro.' };
    }
    if (this.files.some((f) => f.cid === cid)) return { error: 'Este arquivo já está no seu drive.' };
    if (this.retrieving.some((r) => r.cid === cid)) return { error: 'Este CID já está sendo buscado.' };
    return { cid };
  }

  /** Busca um arquivo do IPFS pelo CID (já validado com checkCid) e o adiciona ao drive. */
  async addByCid(cid, name = '') {
    const label = name.trim() || `${cid.slice(0, 8)}…${cid.slice(-6)}`;
    const controller = new AbortController();
    this.#controllers.set(cid, controller);
    this.retrieving.push({ cid, name: name.trim() });
    try {
      const entry = await ipfs.addByCid(cid, name, controller.signal);
      if (!this.files.some((f) => f.cid === entry.cid)) this.files.unshift(entry);
    } catch (e) {
      if (controller.signal.aborted) return; // cancelado pelo usuário, não é erro
      this.error =
        e instanceof ipfs.NotAFileError
          ? `“${label}” não é um arquivo (pode ser uma pasta). Por enquanto só dá para adicionar arquivos.`
          : `Não foi possível buscar “${label}”. Confira o CID e se algum nó da rede está disponibilizando esse conteúdo.`;
    } finally {
      this.#controllers.delete(cid);
      this.retrieving = this.retrieving.filter((r) => r.cid !== cid);
    }
  }

  cancelRetrieval(cid) {
    this.#controllers.get(cid)?.abort();
  }

  /** Tira o arquivo do drive. O conteúdo permanece no IPFS (ver ipfs.removeFile). */
  async remove(file) {
    try {
      await ipfs.removeFile(file.cid);
      this.files = this.files.filter((f) => f.cid !== file.cid);
    } catch (e) {
      this.error = `Não foi possível remover “${file.name}”. Tente novamente.`;
    }
  }

  async download(file) {
    if (this.downloading.includes(file.cid)) return;
    this.downloading.push(file.cid);
    try {
      const blob = await ipfs.getFile(file.cid);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      this.error = `Não foi possível baixar “${file.name}”. Tente novamente.`;
    } finally {
      this.downloading.splice(this.downloading.indexOf(file.cid), 1);
    }
  }
}

export const drive = new Drive();
