const express = require("express");
const app = express();
const logger = require("morgan");
const bodyParser = require("body-parser");
const routes = require("./Routes/index");
const cors = require("cors");

const DEFAULT_ORIGINS = "https://litter-chi.vercel.app,http://localhost:3000";
const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(",");

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: "10mb" })); // Para poder recibir solicitudes Http en formato Json y poder convertirlo a js
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

app.use(logger("dev")); //Middleware para que apararezca los métodos que se van usando

app.use("/", routes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Boca Papa" });
});

module.exports = app;
