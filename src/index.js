const app = require("./app");
const connectDB = require("./Database/DB_connection");

const PORT = process.env.PORT || 3001;

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is required");
}

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server raised in port: http://localhost:${PORT}`);
  });
});
