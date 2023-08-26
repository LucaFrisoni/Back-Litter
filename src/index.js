const app = require("./app");
const connectDB = require("./Database/DB_connection");

const PORT = 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server raised in port: http://localhost:${PORT}`);
  });
});
