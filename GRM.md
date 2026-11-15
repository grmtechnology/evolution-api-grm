# Evolution API 2.3.7 — versão GRM

Cópia da Evolution API 2.3.7 (Apache 2.0, ver LICENSE) usada pelo GRM Food
para o WhatsApp conectado por QR Code. Única mudança:

- Botões (`/message/sendButtons`) saem como `interactiveMessage` com o nó
  `biz` (native_flow), sem o envelope `viewOnceMessage`. Sem isso o servidor
  do WhatsApp aceitava a mensagem, mas ela não chegava ao celular. É a mesma
  correção da Evolution 2.4.0 (`buildInteractiveBizNode`).
- Sem título, o texto do botão vai sem os asteriscos soltos.

Imagem: `ghcr.io/grmtechnology/evolution-api-grm:2.3.7-grm2` (e `latest`).

## 2.3.7-grm2 (14/11/2026) — WhatsApp "conectado, mas surdo"

O Baileys 7.0.0-rc.9 não confirmava o nó `<status>` solto (stories de
contatos, formato novo do WhatsApp desde set/2026). O servidor então segurava
as mensagens novas por horas e derrubava o stream a cada ~50 min
(`Stream Errored (ack)`, `class="status"`). `Docker/scripts/grm-patch-baileys.cjs`
remenda o `messages-recv.js` na montagem da imagem (adaptado de
WhiskeySockets/Baileys#2883 e evolution-api#2785, ainda não lançadas) e
protege a fila offline contra travar após um erro. A montagem falha se o
código esperado não estiver lá. Ao atualizar o Baileys, revisar/remover.

Voltar atrás: usar a imagem `2.3.7-grm1` na Railway.

## 2.3.7-grm3 (15/11/2026) — limpeza automática do banco

A Evolution guarda toda mensagem para sempre (154 mil em nov/2026, 63% com
mais de 30 dias); o disco da Railway já encheu uma vez e derrubou o WhatsApp de
todos. `Docker/scripts/grm-cleanup.cjs` roda em segundo plano (10 min após
subir e depois a cada 6 h) e apaga mensagens com mais de
`GRM_MESSAGE_RETENTION_DAYS` dias (padrão 30, mínimo 7), em lotes de 2000.
O GRM Food e o GRM Business guardam a própria cópia das conversas. Falha só
vai para o log (`[grm-cleanup]`); nunca derruba a Evolution.

Voltar atrás: reverter este commit na branch `grm`.

## 2.3.7-grm4 (15/11/2026) — relatório de espaço

Depois de cada limpeza, `grm-cleanup.cjs` manda o espaço ocupado no disco
(todos os bancos + WAL) para `https://food.grmtechnology.com.br/api/monitoring/evolution-usage`
com a chave global (`AUTHENTICATION_API_KEY`). O GRM Food avisa a equipe ao
passar de 70% do volume e quando o relatório para de chegar por 13 h.
`GRM_USAGE_REPORT_URL=off` desliga.
