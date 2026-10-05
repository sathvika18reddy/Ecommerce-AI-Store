import express from "express";
import cors from "cors";
import { registerPaymentHandlers } from "./sockets/paymentSocket.js";
import userRoutes from "./routes/routes.js";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app)
app.use(express.json());
app.use(express.static("public"));

app.use(
  cors({
    origin: ["http://localhost:3001", "http://10.108.37.246:3001"], // ✅ NOT *
    credentials: true,              // ✅ allow cookies
  })
);

app.use("/", userRoutes);

export const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3001", "http://10.108.37.246:3001"],
    credentials: true,
  },
});

// ✅ connection listener
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  registerPaymentHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

export {server};