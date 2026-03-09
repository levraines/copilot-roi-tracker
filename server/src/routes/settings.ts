import { Router, Request, Response } from "express";
import { getSettings, updateSettings } from "../settings";

const router = Router();

// GET /api/settings
router.get("/", (_req: Request, res: Response) => {
  res.json(getSettings());
});

// PUT /api/settings
router.put("/", (req: Request, res: Response) => {
  const updated = updateSettings(req.body);
  res.json(updated);
});

export default router;
