import express from "express";
import cors from "cors";
import coverpageRoutes from "./routes/coverpage.js";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use("/coverpage", coverpageRoutes);

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
