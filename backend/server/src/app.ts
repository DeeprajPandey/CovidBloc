//@ts-nocheck
import * as dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { CronJob } from 'cron';
import helmet from 'helmet';
import history from 'connect-history-api-fallback';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import passport from 'passport';
import seedrandom from 'seedrandom';
import twilio from 'twilio';

import * as fabric from './services/fabric';
import { NetworkObject, GenericResponse } from './services/fabric.interface';
import * as utils from './services/jwt';
import HealthOfficialModel from './models/HealthOfficial';
import healthRoutes from './routes/HealthOfficial';

require('./services/passport.config')(passport);

dotenv.config();

const env_variables = Boolean(
  process.env.TW_SID && process.env.TW_AUTH && process.env.TW_NUM &&
  process.env.ADMIN_NUMS && process.env.DB_URI && process.env.PORT
);
if (!env_variables) {
  console.error("Environment variables not found. Shutting down...");
  process.exit(1);
}

/**
 * Set up Cronjob to delete keys >14 days old
 */
var deleteJob = new CronJob(
  '00 01 00 * * 1-6',
  async () => {
    try {
      console.log("Deleting keys older than 14 days.");
      await deleteKeys();
    } catch (err) {
      // IMP: assuming this env var is set
      const admins = process.env.ADMIN_NUMS.split(' ');
      for (let i = 0; i < admins.length; i++) {
        const msg = `ALERT: Cronjob failed to delete keys. Check error\n${err}`;
        await sendSMS(admins[i], msg);
        console.log("Admin alerted.");
      }
    }
  },
  null,
  true,
  'GMT'
);
deleteJob.start();

/**
 * Environment Variables
 */
const PORT = normalisePort(process.env.PORT || '6000');
const TWIL_SID = process.env.TW_SID || null;
const TWIL_AUTH = process.env.TW_AUTH || null;
const TWIL_NUM = process.env.TW_NUM || null;
const staticRoot = '../../health-dashboard/dist';

/**
 * Health Official Database
 */
mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
})
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log("Connection to DB failed: ", err);
    process.exit();
  });

const app = express();

app.use(passport.initialize());

/**
 * Middleware Configuration
 */

app.use(helmet());
app.use(cors());
app.use(express.static(staticRoot));

app.use(history({
  index: '/'
}));

app.use(express.json());
/**
 * Fabric Routes
 */
app.get("/", (req, res, next) => {
  res.sendFile("index.html", { root: staticRoot })
});

app.use("/official", healthRoutes);

app.post("/trial", passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
  res.status(200).send("Bug report filed");
});

// Temp use: invoke readAsset
// app.get("/", async (req: Request, res: Response) => {
//   try {
//     const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(fabric.ADMIN);
//     if (networkObj.err != null || !("gateway" in networkObj)) {
//       console.error(networkObj.err);
//       throw new Error("Admin not registered.");
//     }
//     const key = JSON.stringify(req.query.key);

//     const contractResponse = await fabric.invoke('readAsset', [req.query.key], true, networkObj);
//     networkObj.gateway.disconnect();

//     // if ("err" in contractResponse) {
//     //   console.log(contractResponse);
//     //   throw new Error(contractResponse.err);
//     // }
//     res.status(200).send(JSON.stringify(contractResponse));
//   } catch (e) {
//     res.status(418).send("I'm a teapot.");
//   }
// });

/**
 * POST: Register a new official
 * Chaincode generates a medID and returns it on successful addition
 */
app.post("/register", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.email
    );
    if (!validBody) {
      res.status(401).send("⚠️ Invalid request");
      return;
    }

    let email = req.body.email;

    const dbObj = await HealthOfficialModel.findOne({ email: email });
    if (!dbObj) { // returns empty object if not in DB
      res.status(401).send("unauthorised");
      return;
      // throw new Error("You are not an authorised medical official");
    }
    if (dbObj.t_status === "REGISTERED") {
      res.status(400).send("registered");
      return;
      // throw new Error("You have an account. Please log in.");
    }

    // Register this user on the chaincode only if unregistered
    const responseObj: GenericResponse = await fabric.registerUser(email, true);
    if (responseObj.err !== null) {
      console.error(responseObj.err);
      throw new Error("CA failure");
    }
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(email);
    if (networkObj.err !== null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("CA failure");
    }
    // Extract the asset obj from database entry
    const medObj = Object.assign({}, dbObj._doc);
    // Delete the temp properties
    delete medObj._id;
    delete medObj.__v;
    delete medObj.t_status;
    delete medObj.t_authstat;
    delete medObj.t_otp;
    delete medObj.t_timestamp;
    medObj.approveCtr = "0";

    const contractResponse = await fabric.invoke('addHealthOfficial', [JSON.stringify(medObj)], false, networkObj);
    networkObj.gateway.disconnect();

    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
    const recvID = contractResponse["msg"].split(" ")[0];

    // Send the medID on email
    const text = `Hey there, Please store the ID somewhere safe as you will need it to log
    into the portal later. ${recvID}`;
    const html = `<b>Hey there! </b><br><br>Please store the ID somewhere safe as you will need it to log
    into the portal later.<br>Medical ID: ${recvID}`;
    try {
      await sendEmail(dbObj.email, "Your Medical ID", text, html);
    } catch (e) {
      throw new Error("Couldn't send medID to the specified email.");
    }

    // Update DB to store the medID
    dbObj.medID = recvID;
    dbObj.t_status = "REGISTERED";
    const response = await HealthOfficialModel.findOneAndUpdate({ email: dbObj.email }, dbObj);

    res.status(200).send("success");
    // res.status(200).send(`${recvID} registered`);
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
    return;
  }
});

app.post("/requestotp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validBody = Boolean(
      req.body.email &&
      req.body.medID
    );
    if (!validBody) {
      res.status(401).send("⚠️ Invalid request");
      return;
    }
    // Attempt to read this user from the database
    const dbObj = await HealthOfficialModel.findOne({ email: req.body.email });
    if (!dbObj) { // returns empty object if not in DB
      res.status(401).send("unauthorised");
      return;
      // throw new Error("Incorrect credentials.");
    }
    if (dbObj.t_status === "UNREGISTERED") {
      res.status(400).send("unregistered");
      return;
      // throw new Error("Please register first.");
    }
    if (dbObj.medID !== req.body.medID) { // if medID doesn't match
      res.status(401).send("unauthorised");
      return;
      // throw new Error("Incorrect credentials.");
    }
    if (dbObj.t_authstat === "INITIATED") { // otp requested, show modal on frontend
      res.status(400).send("otpinit");
      return;
      // throw new Error("You have requested for a code already. Please log in.");
    }

    // If everything checks out, generate OTP
    await otpGen(dbObj);
    res.status(200).send("Please check your email for the OTP.");
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

app.post("/login", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validBody = Boolean(
      req.body.email &&
      req.body.otp
    );
    if (!validBody) {
      res.status(401).send("⚠️ Invalid request");
      return;
    }

    // Attempt to read this user from the database
    const dbObj = await HealthOfficialModel.findOne({ email: req.body.email });
    if (!dbObj) { // returns empty object if not in DB
      res.status(401).send("unauthorised");
      return;
      // throw new Error("You are not an authorised medical official");
    }
    if (dbObj.t_status === "UNREGISTERED") {
      res.status(400).send("unregistered");
      return;
    }
    if (dbObj.t_authstat === "NA") { // otp not requested
      res.status(400).send("nootp");
      return;
      // throw new Error("Please request for an OTP first.");
    }

    // If user didn't enter code within 5 mins, send new code
    const currentTime = Math.floor(Date.now() / 1000);
    const diff = (currentTime - parseInt(dbObj.t_timestamp)) / 60;
    if (diff > 5) {
      await otpGen(dbObj);
      res.status(400).send("timeout");
      return;
      // throw new Error("Your code has expired and a new code has been sent to your email.");
    }

    // if within timeslot, check if the correct code was entered
    // ensure frontend sends a string and not number
    if (req.body.otp !== dbObj.t_otp) {
      res.status(400).send("incorrect");
      return;
      // throw new Error("Incorrect code entered. Please retry.");
    } else if (req.body.otp === dbObj.t_otp) { // correct otp
      const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(req.body.email);
      if (networkObj.err !== null || !("gateway" in networkObj)) {
        console.error(networkObj.err);
        throw new Error("Invalid request");
      }
      const contractResponse = await fabric.invoke('getMedProfile', [dbObj.medID], true, networkObj);
      networkObj.gateway.disconnect();
      if ("err" in contractResponse) {
        console.error(contractResponse.err);
        // Transaction error
        throw new Error("Something went wrong, please try again");
      }
      const tokenObj = utils.issueJWT(dbObj);
      res.status(200).json({ token: tokenObj.token, expiresIn: tokenObj.expires, user: contractResponse.data });

      // Reset auth status so request OTP suceeds on next login
      dbObj.t_authstat = "NA";
      await HealthOfficialModel.findOneAndUpdate({ email: dbObj.email }, dbObj);
    }
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
  }
});

// GET: Get an official's profile
app.post("/healthofficial", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.i &&
      req.body.e
    );
    if (!validBody) {
      res.status(401).send("⚠️ Invalid request");
      return;
    }
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(req.body.e);
    if (networkObj.err !== null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Invalid request");
    }
    const contractResponse = await fabric.invoke('getMedProfile', [req.body.i], true, networkObj);
    networkObj.gateway.disconnect();
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again");
    }
    res.status(200).send(contractResponse);
  } catch (e) {
    res.status(404).send(e.message);
    return;
  }
});

// POST: Generate an approval for patient
app.post("/generateapproval", passport.authenticate('jwt', { session: false }), async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.email &&
      req.body.medID
    );
    if (!validBody) {
      res.status(401).send("⚠️ Invalid request");
      return;
    }

    let approvalID = -1;
    const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(req.body.email);
    if (networkObj.err != null || !("gateway" in networkObj)) {
      console.error(networkObj.err);
      throw new Error("Invalid request");
    }
    while (true) {
      approvalID = generateApprovalID();
      const valid = await fabric.invoke('validApprovalID', [req.body.medID, approvalID.toString()], true, networkObj);
      if (valid) {
        break;
      }
    }
    const contractResponse = await fabric.invoke('addPatientApprovalRecord', [req.body.medID, approvalID.toString()], false, networkObj);
    networkObj.gateway.disconnect();
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
    let sms_success = false;
    let err_msg = "";
    // Send sms to patient with approvalID and medID
    if (req.body.patientContact) {
      const msgText = `Please enter these details on the app to send your daily keys from the last 14 days to the server.\n\n`
        + `Approval ID: ${approvalID}\nMedical ID: ${req.body.medID}`;
      try {
        await sendSMS(req.body.patientContact, msgText);
        sms_success = true;
      } catch (err) {
        sms_success = false;
        err_msg = "Approval ID generated but SMS failed. Please enter the code on the patient's app.";
      }
    }

    // Send the approval ID to display on the dashboard
    res.status(200).json({ apID: approvalID, smsErr: err_msg });
  } catch (e) {
    console.error(e);
    res.status(500).send("Server error");
    return;
  }
});

// POST: upload keys of a new diagnosis
app.post("/pushkeys", async (req: Request, res: Response) => {
  try {
    const validBody = Boolean(
      req.body.approvalID &&
      req.body.medID &&
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
    const validateResponse = await fabric.invoke('validatePatient', [req.body.medID, req.body.approvalID], true, networkObj);
    if ("err" in validateResponse) {
      throw new Error(validateResponse.err);
    }
    const contractResponse = await fabric.invoke('addPatient', [JSON.stringify(req.body)], false, networkObj);
    networkObj.gateway.disconnect();
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
    networkObj.gateway.disconnect();
    if ("err" in contractResponse) {
      console.error(contractResponse.err);
      // Transaction error
      throw new Error("Something went wrong, please try again.");
    }
    res.status(200).send(contractResponse["data"]);
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
async function otpGen(dbObj: any): Promise<void> {
  try {
    const OTP = Math.floor(Math.random() * 90000) + 10000;
    console.log(`OTP: ${OTP}`);
    dbObj.t_authstat = "INITIATED";
    dbObj.t_otp = OTP.toString();

    const firstName = dbObj.name.split(" ")[0];
    const text = `Hey ${firstName},\nYour login OTP is ${OTP}\n\Please note, the code is valid for only 5 minutes.
    \nIf you did not attempt to log in, please ignore this email.`;
    const html = `<b>Hey ${firstName}!</b><br>Your login OTP is ${OTP}<br><br>Please note, te code is valid for only 5 minutes.
    \nIf you did not attempt to log in, please ignore this email.`;
    try {
      await sendEmail(dbObj.email, "Your Login Code", text, html);
    } catch (e) {
      throw new Error("Couldn't send email.");
    }

    // If the email was sent, set the timestamp
    const createdTime = Math.floor(Date.now() / 1000);
    console.log(createdTime);
    dbObj.t_timestamp = createdTime.toString();
    const response = await HealthOfficialModel.findOneAndUpdate({ email: dbObj.email }, dbObj);
  } catch (err) {
    console.error(`otpGen::${err.message}`);
  }
}


async function sendEmail(toEmail: string, sub: string, msgText: string, msgHtml: string): Promise<void> {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      // host: "smtp.mailtrap.io",
      // port: 2525,
      auth: {
        user: process.env.EM_USR,
        pass: process.env.EM_PASS
      }
    });
    transporter.verify(function (error, success) {
      if (error) {
        console.log(error);
      } else {
        console.log('Server is ready for emails.');
      }
    });

    let mailOptions = {
      from: `"CovidBloc Development Team" <${process.env.EM_USR}>`,
      to: toEmail,
      subject: sub,
      text: msgText,
      html: msgHtml
    };

    let info = await transporter.sendMail(mailOptions);
    console.log(`Email sent: ${info.messageId}`);
  } catch (e) {
    console.error(e);
  }
}

async function deleteKeys() {
  const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(fabric.ADMIN);
  if (networkObj.err != null || !("gateway" in networkObj)) {
    console.error(networkObj.err);
    throw new Error("Couldn't connect to network using Admin identity.");
  }
  let currentTime = Math.floor(Date.now() / 1000); //current unix timestamp
  let currentIVal = Math.floor((Math.floor(currentTime / 600)) / 144) * 144;

  const contractResponse = await fabric.invoke('deleteKeys', [currentIVal.toString()], false, networkObj);
  networkObj.gateway.disconnect();
  if ("err" in contractResponse) {
    console.error(contractResponse.err);
    // Transaction error
    throw new Error(`Failed to run contract function deleteKeys.\n${contractResponse.err}`);
  }
}

function generateApprovalID() {
  const prng = seedrandom.tychei(new Date().valueOf().toString());
  let approvalID = prng.int32();
  if (approvalID < 0) {
    approvalID = approvalID * -1;
  }

  return approvalID;
}

async function sendSMS(to: string, msg: string): Promise<void> {
  if (!TWIL_SID || !TWIL_AUTH || !TWIL_NUM) {
    throw new Error("Twilio credentials not set");
  }
  const client = twilio(TWIL_SID, TWIL_AUTH);
  await client.messages.create({
    body: msg,
    from: TWIL_NUM,
    to: to
  })
    .then(message => console.log(message.sid))
    .catch((e) => {
      console.error(e);
      throw new Error("Couldn't send SMS");
    });
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
