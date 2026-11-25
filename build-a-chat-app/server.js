
import http from "http";
import fs from "fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

// 1. Cria o servidor HTTP e entrega a página do chat
const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end("Error loading chat page");
      return;
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(data);
  });
});

// 2. Cria o servidor WebSocket vinculado ao servidor HTTP
const wss = new WebSocketServer({ server });

// Função para enviar uma mensagem a todos os clientes conectados
function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// 3. Trata cada nova conexão
wss.on("connection", (socket, req) => {
  // 4. Obtém o nome do usuário pela URL
  const username = new URL(
    req.url,
    "http://localhost"
  ).searchParams.get("username");

  // Avisa todos que o usuário entrou
  broadcast({
    type: "system",
    text: `${username} joined`,
  });

  // 5. Recebe e distribui mensagens do chat
  socket.on("message", (data) => {
    const { username, text } = JSON.parse(data);

    broadcast({
      type: "chat",
      username,
      text,
    });
  });

  // 6. Avisa quando o usuário sai
  socket.on("close", () => {
    broadcast({
      type: "system",
      text: `${username} left`,
    });
  });
});

// 7. Inicia o servidor
server.listen(PORT, () => {
  console.log("Chat server running at http://localhost:3001");
});
