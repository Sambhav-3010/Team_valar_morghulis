import "dotenv/config";
import express from "express";
import jiraRoutes from "./jira_routes";

const app = express();

app.use("/jira", jiraRoutes);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
