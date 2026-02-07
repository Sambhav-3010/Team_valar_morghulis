import "dotenv/config";
import express from "express";
import connectDB from "./config/db";
import jiraRoutes from "./jira_routes";

connectDB();

const app = express();

app.use("/jira", jiraRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
