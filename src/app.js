const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");
const routes = require("./Routes/index");
const cors = require("cors");

app.use(cors());
app.use(express.json({ limit: "10mb" })); // Para poder recibir solicitudes Http en formato Json y poder convertirlo a js
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); //Autorizo recibir solicitudes de este dominio
  res.header("Access-Control-Allow-Credentials", true); //Autorizo recibir solicitudes que incluyan el encabezado con credenciales
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  ); //Autorizo recibir solicitudes con dichos hedears
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, DELETE, PATCH"
  ); //Autorizo las solicitudes tipo GET, POST, OPTIONS, PUT y DELETE.
  next(); // para pasar el control al siguiente middleware
});

app.use(logger("dev")); //Middleware para que apararezca los métodos que se van usando

app.use("/", routes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Boca Papa" });
});

module.exports = app;
