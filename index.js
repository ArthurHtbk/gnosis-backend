import express from "express";
import dotenv from "dotenv";
import pkg from "@prisma/client";

dotenv.config();
const { PrismaClient } = pkg;

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// endpoint test : retourne tous les users
app.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
