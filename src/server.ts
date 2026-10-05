import { server } from "./app.js";
import { createAdminIfNotExists } from "./utils/createAdmin.js";
import { connectRedis } from "./config/redis.js";

await createAdminIfNotExists();

const PORT = 3000;
const startServer = async () => {
  await connectRedis();
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
startServer();