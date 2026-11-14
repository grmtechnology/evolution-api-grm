// GRM: remendo do Baileys 7.0.0-rc.9 (WhatsApp "conectado, mas surdo").
//
// Desde set/2026 o WhatsApp manda parte dos status (stories) dos contatos como
// um nó <status> solto. O rc.9 não confirma (ack) esse nó, e o servidor segura
// as mensagens novas da sessão e derruba o stream a cada ~50 min com
// <stream:error><ack class="status"/>. As mensagens chegam horas depois.
// Correção adaptada de WhiskeySockets/Baileys#2883 e
// evolution-foundation/evolution-api#2785 (ainda não lançadas).
//
// Também protege a fila de mensagens "offline": no rc.9 um erro em qualquer
// item deixava isProcessing=true e a fila travava até a conexão cair.
//
// Roda na montagem da imagem; se o código esperado não estiver lá, a montagem
// falha (nada de imagem sem a correção).
const fs = require("node:fs");
const path = require("node:path");

const file = path.join(
  process.cwd(),
  "node_modules/baileys/lib/Socket/messages-recv.js"
);
const version = require(path.join(
  process.cwd(),
  "node_modules/baileys/package.json"
)).version;

if (version !== "7.0.0-rc.9") {
  throw new Error(`grm-patch-baileys: esperava baileys 7.0.0-rc.9, achei ${version}`);
}

let src = fs.readFileSync(file, "utf8");

if (src.includes("GRM_STATUS_ACK")) {
  console.log("grm-patch-baileys: já aplicado");
  process.exit(0);
}

function replaceOnce(before, after) {
  const count = src.split(before).length - 1;
  if (count !== 1) {
    throw new Error(
      `grm-patch-baileys: trecho encontrado ${count}x (esperado 1):\n${before}`
    );
  }
  src = src.replace(before, after);
}

// 1) Handler que só confirma o <status> (não decodifica: a Evolution ignora
//    stories e um status decodificado poderia virar conversa para o robô).
replaceOnce(
  "    const makeOfflineNodeProcessor = () => {",
  `    // GRM_STATUS_ACK: confirma o <status> solto (Baileys#2883).
    const handleStatus = async (node) => {
        try {
            await sendMessageAck(node);
        }
        catch (error) {
            onUnexpectedError(error, 'acking status stanza');
        }
    };
    const makeOfflineNodeProcessor = () => {`
);

// 2) <status> reenviado depois de reconectar vem marcado offline: entra na fila.
replaceOnce(
  "            ['notification', handleNotification]\n        ]);",
  "            ['notification', handleNotification],\n            ['status', handleStatus]\n        ]);"
);

// 3) Um erro num item não trava mais a fila offline para sempre.
replaceOnce(
  "                    await nodeProcessor(node);\n",
  `                    try {
                        await nodeProcessor(node);
                    }
                    catch (error) {
                        onUnexpectedError(error, 'processing offline node');
                    }
`
);

// 4) <status> ao vivo.
replaceOnce(
  "    ws.on('CB:ack,class:message', (node) => {",
  `    ws.on('CB:status', async (node) => {
        await processNode('status', node, 'acking status stanza', handleStatus).catch(error => onUnexpectedError(error, 'acking status stanza'));
    });
    ws.on('CB:ack,class:message', (node) => {`
);

fs.writeFileSync(file, src);
console.log("grm-patch-baileys: aplicado em", file);
