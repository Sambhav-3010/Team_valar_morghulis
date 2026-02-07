import express from "express";
import {
    connectJira,
    jiraCallback,
    fetchJiraAnalytics
} from "./jira_service";

const router = express.Router();

router.get("/connect", connectJira);
router.get("/callback", jiraCallback);
router.get("/analytics", fetchJiraAnalytics);

export default router;
