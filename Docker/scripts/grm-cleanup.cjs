/*
GRM: limpeza automática do banco da Evolution (15/11/2026).

A Evolution guarda toda mensagem de todo número conectado, para sempre
(inclusive o histórico inteiro que chega ao ler o QR Code). Em nov/2026 o
banco já tinha 154 mil mensagens; o disco da Railway (1 GB) já encheu uma vez
e derrubou o WhatsApp de todo mundo.

O GRM Food e o GRM Business guardam a própria cópia das conversas; aqui só
precisamos das recentes (mídia, sincronização). A cada 6 horas apaga as
mensagens com mais de GRM_MESSAGE_RETENTION_DAYS dias (padrão 30, mínimo 7),
em lotes pequenos para não travar o banco. As atualizações e mídias ligadas a
elas saem junto (onDelete: Cascade). Roda em segundo plano: se falhar, só
registra no log e tenta de novo na próxima rodada; nunca derruba a Evolution.
*/

const { Client } = require('pg');

const DAYS = Math.max(7, Number(process.env.GRM_MESSAGE_RETENTION_DAYS) || 30);
const EVERY_MS = 6 * 60 * 60 * 1000;
const FIRST_RUN_MS = 10 * 60 * 1000;
const BATCH = 2000;
const MAX_BATCHES = 200;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanup() {
  const url = process.env.DATABASE_CONNECTION_URI;
  if (!url || !/^postgres/i.test(url)) return;

  const client = new Client({ connectionString: url });
  const cutoff = Math.floor(Date.now() / 1000) - DAYS * 24 * 60 * 60;

  try {
    await client.connect();
    let deleted = 0;

    for (let i = 0; i < MAX_BATCHES; i += 1) {
      const result = await client.query(
        'delete from "Message" where id in (select id from "Message" where "messageTimestamp" < $1 limit $2)',
        [cutoff, BATCH],
      );
      deleted += result.rowCount || 0;
      if ((result.rowCount || 0) < BATCH) break;
      await sleep(500);
    }

    const size = await client.query('select pg_size_pretty(pg_database_size(current_database())) as size');
    console.log(`[grm-cleanup] ${deleted} mensagens com mais de ${DAYS} dias apagadas; banco: ${size.rows[0].size}`);
  } catch (error) {
    console.error('[grm-cleanup] falhou (tenta de novo na próxima rodada):', error && error.message);
  } finally {
    await client.end().catch(() => undefined);
  }
}

setTimeout(function loop() {
  cleanup().finally(() => setTimeout(loop, EVERY_MS));
}, FIRST_RUN_MS);
