import express from "express";

import * as caseController from "../controllers/caseController.js";
import verifyUser from "../middleware/verifyUser.js";
import requireAdmin from "../middleware/requireAdmin.js";
import requireCaseViewer from "../middleware/requireCaseViewer.js"; // NEW: Admin & Lawyer full list access

const router = express.Router();

// All cases (restricted to Admin & Lawyer)
router.get("/cases", verifyUser, requireCaseViewer, caseController.getCases);
router.get("/cases/user/:user_id", caseController.getCasesByUserId); // Fetch cases of a specific lawyer
router.post("/cases", verifyUser, caseController.createCase);
router.put("/cases/:case_id", verifyUser, caseController.updateCase);
router.delete("/cases/:case_id", verifyUser, caseController.deleteCase);
router.get("/cases/search", verifyUser, caseController.searchCases);
router.get("/cases/:case_id", verifyUser, caseController.getCaseById);

export default router;
