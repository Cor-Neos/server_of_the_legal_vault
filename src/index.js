import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import branchRoutes from "./routes/branchRoute.js";
import clientRoutes from "./routes/clientRoute.js";
import taskRoutes from "./routes/taskRoute.js";
import caseRoutes from "./routes/caseRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";

const app = express();
const port = 3000;

app.use(express.json());
app.use(cookieParser());  

app.use(
  cors({
    origin: [
      "http://localhost:4000",
      "http://localhost:8081",
      "http://192.168.100.30:8081",
      "http://10.229.178.126:8081" 
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use("/api", branchRoutes);
app.use("/api", userRoutes);
app.use("/api", clientRoutes);
app.use("/api", authRoutes); // authentication api
app.use("/api", caseRoutes);
app.use("/api", paymentRoutes);

app.use("/api/", taskRoutes);
// Serve upload directory (ensure single path). Adjust if actual path differs.
app.use("/uploads", express.static("C:/Users/Noel Batoctoy/caps/uploads/profile_pictures"));

app.listen(port, "0.0.0.0", () => {
  console.log(`Listening on port ${port}`);
});

// Testing to get the IP address of the user
app.get("/api/ip", (req, res) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || // for reverse proxies
    req.socket?.remoteAddress ||
    null;

  res.json({ ip });
});
