# Evolution API 2.3.7 — versão GRM

Cópia da Evolution API 2.3.7 (Apache 2.0, ver LICENSE) usada pelo GRM Food
para o WhatsApp conectado por QR Code. Única mudança:

- Botões (`/message/sendButtons`) saem como `interactiveMessage` com o nó
  `biz` (native_flow), sem o envelope `viewOnceMessage`. Sem isso o servidor
  do WhatsApp aceitava a mensagem, mas ela não chegava ao celular. É a mesma
  correção da Evolution 2.4.0 (`buildInteractiveBizNode`).
- Sem título, o texto do botão vai sem os asteriscos soltos.

Imagem: `ghcr.io/grmtechnology/evolution-api-grm:2.3.7-grm1`.
