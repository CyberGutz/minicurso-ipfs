/**
 * Adaptador entre a interface e o Helia (src/lib/ipfs/*).
 * Como o CID não guarda nome/data, mantemos um índice no localStorage.
 *
 * @typedef {{ cid: string, name: string, size: number, type: string, addedAt: number }} DriveFile
 */
import { addFileToIpfs, fetchBlob, getPeerId as helioPeerId, importFromCID } from './ipfs/ipfsOperations';

export { normalizeCID, NotAFileError } from './ipfs/ipfsOperations';

const KEY = 'orbita:files';

function writeIndex(index) {
  localStorage.setItem(KEY, JSON.stringify(index));
}

function readIndex() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** @returns {Promise<string>} */
export const getPeerId = () => helioPeerId();

/** @returns {Promise<DriveFile[]>} */
export async function listFiles() {
  return Object.values(readIndex()).sort((a, b) => b.addedAt - a.addedAt);
}

/** @param {File} file @returns {Promise<DriveFile>} */
export async function addFile(file) {
  const cid = await addFileToIpfs(file);
  const entry = { cid, name: file.name, size: file.size, type: file.type, addedAt: Date.now() };
  writeIndex({ ...readIndex(), [cid]: entry });
  return entry;
}

/**
 * Traz para o drive um arquivo que já existe no IPFS, a partir do CID.
 * O CID não carrega nome nem tipo; se o nome vier vazio, usamos o próprio CID.
 * @param {string} cid CID já normalizado
 * @param {string} name
 * @param {AbortSignal} [signal]
 * @returns {Promise<DriveFile>}
 */
export async function addByCid(cid, name, signal) {
  const { cid: canonical, size } = await importFromCID(cid, signal);
  const entry = { cid: canonical, name: name.trim() || canonical, size, type: '', addedAt: Date.now() };
  writeIndex({ ...readIndex(), [canonical]: entry });
  return entry;
}

/**
 * Remove o arquivo apenas do drive (índice local). O conteúdo continua no IPFS:
 * o pin e os blocos permanecem no nó, então o CID segue disponível para a rede
 * e o arquivo pode ser readicionado depois, na hora, pelo CID.
 * @param {string} cid
 */
export async function removeFile(cid) {
  const index = readIndex();
  delete index[cid];
  writeIndex(index);
}

/** @param {string} cid @returns {Promise<Blob>} */
export async function getFile(cid) {
  return fetchBlob(cid, readIndex()[cid]?.type ?? '');
}
