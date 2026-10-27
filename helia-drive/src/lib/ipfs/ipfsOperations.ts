import { CID } from "multiformats";
import { startHelia } from "./heliaInstance";

// Sem provedor na rede, fs.cat() ficaria esperando para sempre.
const TIMEOUT_MS = 60_000;

// CID.parse já reconhece CIDv0 ("Qm...") e CIDv1 em base32 ("bafy...").
export const parseCID = (cidString: string) => CID.parse(cidString.trim());

/**
 * Aceita o CID puro, "ipfs://<cid>" ou "/ipfs/<cid>" e devolve a forma canônica
 * (CIDv0 continua "Qm...", CIDv1 vira base32). Lança erro se não for um CID válido.
 */
export function normalizeCID(entrada: string): string {
  const limpo = entrada
    .trim()
    .replace(/^ipfs:\/\//i, "")
    .replace(/^\/ipfs\//i, "")
    .replace(/\/+$/, "");
  return CID.parse(limpo).toString();
}

/** O CID existe, mas não é um arquivo (pasta, bloco dag-cbor etc.). */
export class NotAFileError extends Error {
  constructor() {
    super("O CID não aponta para um arquivo");
    this.name = "NotAFileError";
  }
}

export async function getPeerId(): Promise<string> {
  const { helia } = await startHelia();
  return helia.libp2p.peerId.toString();
}

/** Adiciona o arquivo ao IPFS, fixa (pin) e devolve o CID. */
export async function addFileToIpfs(file: File): Promise<string> {
  const { helia, fs } = await startHelia();

  // Carrega o arquivo todo na memória. Para arquivos muito grandes,
  // troque por fs.addByteStream(file.stream()).
  const cid = await fs.addBytes(new Uint8Array(await file.arrayBuffer()));
  await helia.pins.add(cid);

  void provideCID(cid.toString()); // sem await: não trava a UI
  return cid.toString();
}

/** Lê o conteúdo do CID e devolve como Blob, pronto para download. */
export async function fetchBlob(cidString: string, tipoMime = "", timeoutMs = TIMEOUT_MS): Promise<Blob> {
  const { fs } = await startHelia();
  const chunks: Uint8Array[] = [];

  for await (const chunk of fs.cat(parseCID(cidString), { signal: AbortSignal.timeout(timeoutMs) })) {
    chunks.push(chunk);
  }
  return new Blob(chunks as BlobPart[], { type: tipoMime });
}

/**
 * Traz para o nó um arquivo que já existe no IPFS, a partir do CID, e o fixa (pin).
 * Devolve o CID canônico e o tamanho do arquivo.
 *
 * Se o conteúdo já estiver no blockstore (ex.: arquivo removido do drive antes),
 * nada é baixado: a operação termina na hora.
 */
export async function importFromCID(
  cidString: string,
  signal?: AbortSignal
): Promise<{ cid: string; size: number }> {
  const { helia, fs } = await startHelia();
  const cid = parseCID(cidString);

  // 1) Só o bloco raiz, com timeout: se ninguém na rede o fornece, falhamos
  //    cedo em vez de deixar o usuário esperando indefinidamente.
  const sinalRaiz = AbortSignal.any([AbortSignal.timeout(TIMEOUT_MS), ...(signal ? [signal] : [])]);
  await helia.blockstore.get(cid, { signal: sinalRaiz });

  // 2) Com a raiz em mãos, descobrimos o tipo e o tamanho.
  const info = await fs.stat(cid, { signal });
  if (!["file", "raw", "identity"].includes(info.type)) throw new NotAFileError();

  // 3) O pin baixa o restante dos blocos. Sem timeout de propósito: um arquivo
  //    grande pode demorar, e o usuário pode cancelar pela interface.
  await helia.pins.add(cid, { signal });

  void provideCID(cid.toString()); // sem await: não trava a UI
  return { cid: cid.toString(), size: Number(info.fileSize) };
}

/**
 * Fixa um CID que já está no blockstore (por exemplo, depois de um fs.cat).
 * Não precisa reler nem readicionar os bytes: o CID original é o que vale.
 */
export async function pinCID(cidString: string): Promise<void> {
  const { helia } = await startHelia();
  const cid = parseCID(cidString);
  if (!(await helia.pins.isPinned(cid))) await helia.pins.add(cid);
}

export async function provideCID(cidString: string): Promise<void> {
  const { helia } = await startHelia();
  try {
    await helia.routing.provide(parseCID(cidString));
  } catch (err) {
    console.error(`Falha ao anunciar ${cidString}: ${err}`);
  }
}
