import * as dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import seedrandom from "seedrandom";
import twilio from 'twilio';
import * as fabric from "./services/fabric";
import { NetworkObject, GenericResponse } from "./services/fabric.interface";

dotenv.config();

/**
 * Variable
 */
const PORT = normalisePort(process.env.PORT || '6401');
const TWIL_SID = process.env.TW_SID || null;
const TWIL_AUTH = process.env.TW_AUTH || null;

const app = express();

/**
 * Middleware Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes

// GET: Hello
app.get("/", async (req: Request, res: Response) => {
  try {
    //sendSMS('someNum', 'try@sms', '31625647527');
    let num = generateApprovalID();
    const msg: string = `Random number: ${num}`;
    res.status(200).send(msg);
  } catch (e) {
    res.status(418).send("I'm a teapot.");
  }
});

// POST: Register a new official
app.post("/healthofficial", async (req: Request, res: Response) => {
  let medicalOfficial = new Map<string, string>();
  medicalOfficial.set('m1@apollo.com', '3425');
  medicalOfficial.set('doc232@max.com', '2367');
  medicalOfficial.set('hosp123@fortis.in', '3821');

  try {
    let medObj = req.body;
    let medEmail = medObj.medEmail;
    delete medObj.medEmail;

    if (medicalOfficial.has(medEmail) && medicalOfficial.get(medEmail) == medObj.medID) {
      const responeObj: GenericResponse = await fabric.registerUser(medEmail, true);
      if (responeObj.err != null) {
        console.error(responeObj.err);
      }
      else {
        const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(medEmail);
        if (networkObj.err != null || !("gateway" in networkObj)) {
          console.error(networkObj.err);
          throw new Error("Medical official not registered.");
        }
        const contractResponse = await fabric.invoke('addHealthOfficer', [medEmail, JSON.stringify(medObj)], false, networkObj);
        if ("err" in contractResponse) {
          console.error(contractResponse.err);
          // Transaction error
          throw new Error("Something went wrong, please try again.");
        }
      }
    }
  } catch (e) {
    res.status(404).send(e.message);
    return;
  }
});

// GET: Get an official's profile
app.get("/healthofficial/:id", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.params.id
    );
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(req.params.id);
    if (networkObj.err != null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Medical official not registered.");
    }
    const contractResponse = await fabric.invoke('getMedProfile', [req.params.id], true, networkObj);
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
    return contractResponse;
  } catch (e) {
    res.status(404).send(e.message);
    return;
  }
});

// POST: Generate an approval for patient
app.post("/generateapproval", async (req: Request, res: Response) => {
  try {
<<<<<<< HEAD
    let medEmail = req.body.medEmail;
    let approvalID = generateApprovalID();
=======
    const validBody = Boolean(
      req.body.medEmail &&
      req.body.medID &&
      req.body.patientContact
    );
    if (!validBody) {
      throw new Error("Invalid request");
    }
    const medEmail = req.body.medEmail;
    const approvalID = generateApprovalID();
>>>>>>> f7b7eccd6a4edc4c9974e43fe2098995ae45624a
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(medEmail);
    if (networkObj.err != null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Medical official not registered");
    }
    const contractResponse = await fabric.invoke('addPatientApprovalRecord', [medEmail, approvalID.toString()], false, networkObj);
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
<<<<<<< HEAD
    //send email to patient with approvalID and medEmail
=======
    // Send sms to patient with approvalID and medEmail
>>>>>>> f7b7eccd6a4edc4c9974e43fe2098995ae45624a
    await sendSMS(req.body.patientContact, medEmail, approvalID.toString());
    res.status(200).send("Keys uploaded.");
  } catch (e) {
    res.status(400).send(e.message);
    return;
  }
});

// POST: upload keys of a new diagnosis
app.post("/pushkeys", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.approvalID &&
      req.body.medEmail &&
      req.body.ival &&
      req.body.dailyKeys.length > 0
    );
    const validKeys = await keyValidity(req.body.dailyKeys);
    if (!validBody || !validKeys) {
      throw new Error("Invalid request.");
    }

    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(fabric.ADMIN);
    if (networkObj.err != null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Admin not registered.");
    }
    const validateResponse = await fabric.invoke('validatePatient', [req.body.medEmail, req.body.approvalID], false, networkObj);
    if ("err" in validateResponse) {
      throw new Error(validateResponse.err);
    }
    const contractResponse = await fabric.invoke('addPatient', [JSON.stringify(req.body)], false, networkObj);
    if ("err" in contractResponse) {
      throw new Error(contractResponse.err);
    }
    res.status(200).send(contractResponse.msg);
  } catch (e) {
    res.status(400).send(e.message);
  }
});

// Get diagnosis keys. Network will send keys app doesn't have based on currentIVal
app.post("/keys", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.currentIval
    );
    if (!validBody) {
      throw new Error("Invalid request");
    }
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(fabric.ADMIN);
    if (networkObj.err != null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Admin not registered.");
    }
    const contractResponse = await fabric.invoke('getKeys', [req.body.currentIval], true, networkObj);
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
    res.status(200).send(contractResponse);
  } catch (e) {
    res.status(400).send(e.message);
    return;
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

function generateApprovalID() {
  const prng = seedrandom.tychei(new Date().valueOf().toString());
  let approvalID = prng.int32();
  if (approvalID < 0) {
    approvalID = approvalID * -1;
  }

  return approvalID;
}

async function sendSMS(to: string, from: string, approvalID: string): Promise<void> {

  const accountSid = 'ACb2efca540cecefc4ab3862199d7bbca9';
  const authToken = '0a95945c043ce4db6a3dd60a5cc95431';
  const msg = "Please enter these details on the app to send your last 14 days' daily keys to the server.\n\n";
  const client = twilio(accountSid, authToken);
  await client.messages.create({
    body: `${msg}Approval ID: ${approvalID}\n Medical ID: ${from}`,
    from: '+12058914938',
    to: to
  })
    .then(message => console.log(message.sid));
}

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

/**
 * 
 * @param keyArray Array of DailyKey objects
 */
async function keyValidity(keyArray: any[]) {
  interface Invalid {
    errorMsg: string
  };
  const Invalid = class implements Invalid {
    public errorMsg: string;
    public constructor(msg: string) {
      this.errorMsg = msg;
    }
  }

  type InvalidOr<T> = Invalid | T;
  type Validate<T> = (t: T) => InvalidOr<T>;

  type IsInvalidTypeGuard<T> = (errorOrT: InvalidOr<T>) => errorOrT is Invalid;
  const isInvalid: IsInvalidTypeGuard<{}> = (errorOrT): errorOrT is Invalid => {
    return (errorOrT as Invalid).errorMsg !== undefined;
  };

  interface DailyKey {
    hexkey: string;
    i: number;
  };

  const properKey: Validate<DailyKey> = (key) => {
    const valid = Boolean(
      key.hexkey !== "" &&
      typeof key.i === "number"
    );
    return valid ? key : new Invalid("Invalid key");
  };

  await asyncForEach(keyArray, async (element: any) => {
    const result: InvalidOr<DailyKey> = properKey(element);
    if (isInvalid(result)) {
      return false;
    }
  });
  return true;
}

async function asyncForEach(array: any[], callback: any) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}
