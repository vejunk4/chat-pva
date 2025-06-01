import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 4000;
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();
const prisma = new PrismaClient();

app.prepare().then(() => {
  const httpServer = createServer(handler);
  const io = new Server(httpServer, {
    cors: { origin: "*" }
  });

  const onlineUsers = new Map();

  io.on("connection", async (socket) => {
    const messages = await prisma.message.findMany({
      orderBy: { createdAt: "asc" },
      include: { user: true }
    });
    socket.emit("chatHistory", messages);

    socket.on("setUser", (user) => {
      if (user && user.id && user.name) {
        onlineUsers.set(socket.id, user);
        io.emit("onlineUsers", Array.from(onlineUsers.values()));
      }
    });

    socket.on("sendMessage", async ({ content, userId }) => {
      if (!content || !userId) return;
      const message = await prisma.message.create({
        data: {
          content,
          user: { connect: { id: userId } }
        },
        include: { user: true }
      });
      io.emit("receiveMessage", message);
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.id);
      io.emit("onlineUsers", Array.from(onlineUsers.values()));
    });

    socket.on("clearChat", async () => {
      await prisma.message.deleteMany({});
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: "asc" },
        include: { user: true }
      });
      io.emit("chatHistory", messages);
    });
  });

  httpServer.listen(port, () => {
    console.log(`Server is running on http://${hostname}:${port}`);
  });
});