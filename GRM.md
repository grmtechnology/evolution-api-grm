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
