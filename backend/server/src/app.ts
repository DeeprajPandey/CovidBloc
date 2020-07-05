import * as dotenv from "dotenv";
import express, {Request, Response} from "express";
import cors from "cors";
import helmet from "helmet";

import * as fabric from "./services/fabric";

dotenv.config();

/**
 * Variables
 */

 const PORT = normalisePort(process.env.PORT || '6401');

const app = express();

/**
 * Middleware Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes

// GET: Hello
app.get("/", async(req: Request, res: Response) => {
  try {
    const msg: string = "Houston to Base, the server's up."
    res.status(200).send(msg);
  } catch (e) {
    res.status(418).send("I'm a teapot.");
  }
});

// POST: Register a new official
app.post("/healthofficial", async (req: Request, res: Response) => {
  try {
    throw new Error("Not implemented");
  } catch (e) {
    res.status(404).send(e.message);
  }
});

// GET: Get an official's profile
app.get("/healthofficial/:id", async (req: Request, res: Response) => {
  try {
    throw new Error("Not implemented");
  } catch (e) {
    res.status(404).send(e.message);
  }
});

// POST: Generate an approval for patient
app.post("/generateapproval", async (req: Request, res: Response) => {
  try {
    throw new Error("Not implemented");
  } catch (e) {
    res.status(404).send(e.message);
  }
});

// POST: upload keys of a new diagnosis
app.post("/keys", async (req: Request, res: Response) => {
  try {
    throw new Error("Not implemented");
  } catch (e) {
    res.status(404).send(e.message);
  }
});

// GET: Get diagnosis keys
app.get("/keys", async (req: Request, res: Response) => {
  try {
    throw new Error("Not implemented");
  } catch (e) {
    res.status(404).send(e.message);
  }
});

/**
 * Server
 */
const server = app.listen(PORT, () => {
  console.info((`Listening on port ${PORT}`));
});

/**
 * Utility Functions
 */

 function normalisePort(val: string) {
  const num = parseInt(val as string, 10);

  if (isNaN(num)) {
    // named pipe
    return val;
  }
  if (num >= 0) {
    // port number
    return num;
  }
  return false;
}