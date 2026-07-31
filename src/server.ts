import app from "./app.js";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log("");
  console.log("🍞 ══════════════════════════════════");
  console.log("🚀  Bakery Services aktif!");
  console.log(`📡  Port    : ${PORT}`);
  console.log(`🌍  Env     : ${process.env.NODE_ENV}`);
  console.log(`❤️   Health  : http://localhost:${PORT}/health`);
  console.log("");
  console.log(`🔐  Auth    : http://localhost:${PORT}/api/v1/auth`);
  console.log(`👤  Users   : http://localhost:${PORT}/api/v1/users`);
  console.log(`📦  Products: http://localhost:${PORT}/api/v1/products`);
  console.log(`🛒  Orders  : http://localhost:${PORT}/api/v1/orders`);
  console.log(`🛡️   Admin   : http://localhost:${PORT}/api/v1/admin`);
  console.log("🍞 ══════════════════════════════════");
  console.log("");
});
