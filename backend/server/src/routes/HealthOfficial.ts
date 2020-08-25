import { Request, Response, Router } from "express";
import HealthOfficialModel from "../models/HealthOfficial";

const healthRoutes = Router();

healthRoutes.post('/one', async (req: Request, res: Response) => {
  try {
    const officials = await HealthOfficialModel.findOne({ name: "Mahavir Jhawar" }, "email");
    res.send(officials);
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * Will only be used by admin to add new health officers
 */
healthRoutes.post('/', async (req: Request, res: Response) => {
  const official = new HealthOfficialModel(req.body);

  try {
    await official.save();
    res.send(official);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default healthRoutes;