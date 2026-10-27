import { createHelia, type Helia } from "helia";
import { unixfs, type UnixFS } from "@helia/unixfs";
import { IDBBlockstore } from "blockstore-idb";
import { IDBDatastore } from "datastore-idb";

export interface HeliaInstance {
  helia: Helia;
  fs: UnixFS;
}

async function init(): Promise<HeliaInstance> {
  const blockstore = new IDBBlockstore("heliadrive-blocks");
  await blockstore.open();

  // Atenção: o nome do datastore guarda a chave do nó (Peer ID).
  const datastore = new IDBDatastore("heliadrive-data");
  await datastore.open();

  const helia = await createHelia({ blockstore, datastore }).start();
  return { helia, fs: unixfs(helia) };
}

// Guarda a *promise*, não o resultado: se duas partes da UI chamarem
// startHelia() ao mesmo tempo, as duas esperam a mesma inicialização
// (antes, cada uma criaria um nó e abriria os mesmos bancos IndexedDB).
let starting: Promise<HeliaInstance> | null = null;

export function startHelia(): Promise<HeliaInstance> {
  starting ??= init().catch((erro) => {
    starting = null; // permite tentar de novo depois de uma falha
    console.error("Erro ao iniciar a instância Helia: ", erro);
    throw erro;
  });
  return starting;
}
