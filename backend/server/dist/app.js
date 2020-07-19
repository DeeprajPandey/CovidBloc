"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cron_1 = require("cron");
const helmet_1 = __importDefault(require("helmet"));
const seedrandom_1 = __importDefault(require("seedrandom"));
const twilio_1 = __importDefault(require("twilio"));
const fabric = __importStar(require("./services/fabric"));
// import mongoose from "mongoose";
// import healthRoutes from "./routes/HealthOfficial";
// import HealthOfficialModel from "./models/HealthOfficial";
dotenv.config();
const env_variables = Boolean(process.env.TW_SID && process.env.TW_AUTH && process.env.TW_NUM &&
    process.env.ADMIN_NUMS && process.env.PORT // && process.env.DB_URI
);
if (!env_variables) {
    console.error("Environment variables not found. Shutting down...");
    process.exit(1);
}
/**
 * Set up Cronjob to delete keys >14 days old
 */
var deleteJob = new cron_1.CronJob('00 01 00 * * 1-6', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Deleting keys older than 14 days.");
        yield deleteKeys();
    }
    catch (err) {
        // IMP: assuming this env var is set
        // @ts-ignore
        const admins = process.env.ADMIN_NUMS.split(' ');
        for (let i = 0; i < admins.length; i++) {
            const msg = `ALERT: Cronjob failed to delete keys. Check error\n${err}`;
            yield sendSMS(admins[i], msg);
            console.log("Admin alerted.");
        }
    }
}), null, true, 'GMT');
deleteJob.start();
/**
 * Environment Variables
 */
const PORT = normalisePort(process.env.PORT || '6000');
const TWIL_SID = process.env.TW_SID || null;
const TWIL_AUTH = process.env.TW_AUTH || null;
const TWIL_NUM = process.env.TW_NUM || null;
/**
 * Health Official Database
 */
// @ts-ignore
// mongoose.connect(process.env.DB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false
// })
//   .then(() => {
//     console.log("Connected to DB");
//   })
//   .catch((err) => {
//     console.log("Connection to DB failed: ", err);
//     process.exit();
//   });
const app = express_1.default();
/**
 * Middleware Configuration
 */
app.use(helmet_1.default());
app.use(cors_1.default());
app.use(express_1.default.json());
// Health Official Registration Routes
// app.use("/officials", healthRoutes);
/**
 * Fabric Routes
 */
// TODO: Remove this to host webapp
// Temp use: invoke readAsset
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Admin not registered.");
        }
        const key = JSON.stringify(req.query.key);
        // @ts-ignore
        const contractResponse = yield fabric.invoke('readAsset', [req.query.key], true, networkObj);
        networkObj.gateway.disconnect();
        // if ("err" in contractResponse) {
        //   console.log(contractResponse);
        //   throw new Error(contractResponse.err);
        // }
        res.status(200).send(JSON.stringify(contractResponse));
    }
    catch (e) {
        res.status(418).send("I'm a teapot.");
    }
}));
/**
 * POST: Register a new official
 * Chaincode generates a medID and returns it on successful addition
 */
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let authorisedOfficials = new Map();
    authorisedOfficials.set('m1@apollo.com', '3425');
    authorisedOfficials.set('doc232@max.com', '2367');
    authorisedOfficials.set('hosp123@fortis.in', '3821');
    try {
        const validBody = Boolean(req.body.approveCtr === "0" &&
            req.body.name &&
            req.body.email &&
            req.body.hospital);
        if (!validBody) {
            throw new Error("Invalid request");
        }
        let email = req.body.email;
        // // Attempt to read this user from the database
        // const dbObj = await HealthOfficialModel.findOne({ email: email }, { lean: true });
        // if (!dbObj) { // returns empty object if not in DB
        //   throw new Error("You are not an authorised medical official");
        // }
        // // @ts-ignore
        // const STAT = dbObj.t_status;
        // switch (STAT) {
        //   case "REGISTERED":
        //     res.status(400).send("You are already registered");
        //     break;
        //   case "PENDING":
        //     // TODO: check if it has been ten minutes since code generation and resend
        //     const currentTime = Math.round((new Date()).getTime() / 1000);
        //     // @ts-ignore
        //     const diff = (currentTime - parseInt(dbObj.t_timestamp))/60;
        //     if (diff > 5) {
        //       otpGen(dbObj);
        //       res.status(400).send("Your code has expired and new code has been sent to your email.");
        //       return;
        //     }
        //     // if it hasn't been 5 minutes, check if it's the correct OTP
        //     // ensure the received otp is a string
        //     // @ts-ignore
        //     if (req.body.otp !== dbObj.t_otp) {
        //       res.status(400).send("Incorrect code entered. Please retry.");
        //       return;
        //     }
        //     // res.status(200).send("New OTP sent, please verify your email")
        //     otpGen(dbObj);
        //     res.status(200).send("You have already requested an OTP. Please check your email for the code.")
        //     break;
        //   case "UNREGISTERED":
        //     // Generate otp, send email, and update this collection in DB
        //     otpGen(dbObj);
        //     res.status(200).send("Please check your inbox for an OTP. The code expires in 5 minutes.");
        //     return;
        //   default:
        //     throw new Error("Invalid status. Contact admin.");
        // }
        const responseObj = yield fabric.registerUser(email, true);
        if (responseObj.err !== null) {
            console.error(responseObj.err);
            throw new Error("CA failure");
        }
        const networkObj = yield fabric.connectAsUser(email);
        if (networkObj.err !== null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("CA failure");
        }
        const medObj = Object.assign({}, req.body);
        medObj.medID = "-1"; // need all the properties as chaincode expects HealthOfficial
        const contractResponse = yield fabric.invoke('addHealthOfficial', [JSON.stringify(medObj)], false, networkObj);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            console.error(contractResponse.err);
            // Transaction error
            throw new Error("Something went wrong, please try again.");
        }
        // TODO: Send the medID on email
        const recvID = contractResponse["msg"].split()[0];
        res.status(200).send(`${recvID} registered`);
    }
    catch (e) {
        res.status(401).send(e.message);
        return;
    }
}));
// async function otpGen(dbObj: any): Promise<void> {
//   try {
//     const OTP = Math.floor(Math.random() * 90000) + 10000;
//     console.log(`OTP: ${OTP}`);
//     // @ts-ignore
//     dbObj.t_status = "PENDING";
//     // @ts-ignore
//     dbObj.t_otp = OTP.toString();
//     // TODO: Send email
//     // if email fails
//     // throw new Error("Invalid email ID");
//     // If the email was sent, set the timestamp
//     const createdTime = Math.round((new Date()).getTime() / 1000);
//     console.log(createdTime);
//     // @ts-ignore
//     dbObj.t_timestamp = createdTime.toString();
//     // @ts-ignore
//     const response = await HealthOfficialModel.findOneAndUpdate({ email: dbObj.email }, dbObj);
//   } catch (err) {
//     console.error(`otpGen::${err.message}`);
//   }
// }
// GET: Get an official's profile
app.get("/healthofficial", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validParams = Boolean(req.query.i &&
            req.query.e);
        if (!validParams) {
            throw new Error("Invalid request");
        }
        // @ts-ignore
        const networkObj = yield fabric.connectAsUser(req.query.e);
        if (networkObj.err !== null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Invalid request");
        }
        // @ts-ignore
        const contractResponse = yield fabric.invoke('getMedProfile', [req.query.i], true, networkObj);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            console.error(contractResponse.err);
            // Transaction error
            throw new Error("Something went wrong, please try again");
        }
        res.status(200).send(contractResponse);
    }
    catch (e) {
        res.status(404).send(e.message);
        return;
    }
}));
// POST: Generate an approval for patient
app.post("/generateapproval", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.email &&
            req.body.medID &&
            req.body.patientContact);
        if (!validBody) {
            throw new Error("Invalid request");
        }
        let approvalID = -1;
        const networkObj = yield fabric.connectAsUser(req.body.email);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Invalid request");
        }
        while (true) {
            approvalID = generateApprovalID();
            const valid = yield fabric.invoke('validApprovalID', [req.body.medID, approvalID.toString()], true, networkObj);
            if (valid) {
                break;
            }
        }
        const contractResponse = yield fabric.invoke('addPatientApprovalRecord', [req.body.medID, approvalID.toString()], false, networkObj);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            console.error(contractResponse.err);
            // Transaction error
            throw new Error("Something went wrong, please try again.");
        }
        // Send sms to patient with approvalID and medID
        const msgText = `Please enter these details on the app to send your daily keys from the last 14 days to the server.\n\n`
            + `Approval ID: ${approvalID}\nMedical ID: ${req.body.medID}`;
        yield sendSMS(req.body.patientContact, msgText);
        res.status(200).send("Keys uploaded.");
    }
    catch (e) {
        res.status(400).send(e.message);
        return;
    }
}));
// POST: upload keys of a new diagnosis
app.post("/pushkeys", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.approvalID &&
            req.body.medID &&
            req.body.ival &&
            req.body.dailyKeys.length > 0);
        const validKeys = yield keyValidity(req.body.dailyKeys);
        if (!validBody || !validKeys) {
            throw new Error("Invalid request.");
        }
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Admin not registered.");
        }
        const validateResponse = yield fabric.invoke('validatePatient', [req.body.medID, req.body.approvalID], true, networkObj);
        if ("err" in validateResponse) {
            throw new Error(validateResponse.err);
        }
        const contractResponse = yield fabric.invoke('addPatient', [JSON.stringify(req.body)], false, networkObj);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            throw new Error(contractResponse.err);
        }
        res.status(200).send(contractResponse.msg);
    }
    catch (e) {
        res.status(400).send(e.message);
    }
}));
// Get diagnosis keys. Network will send keys app doesn't have based on currentIVal
app.post("/keys", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.currentIval &&
            (req.body.firstCall === true || req.body.firstCall === false));
        if (!validBody) {
            throw new Error("Invalid request");
        }
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Admin not registered.");
        }
        const contractResponse = yield fabric.invoke('getKeys', [req.body.currentIval, req.body.firstCall.toString()], true, networkObj);
        //console.log(contractResponse["data"]);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            console.error(contractResponse.err);
            // Transaction error
            throw new Error("Something went wrong, please try again.");
        }
        res.status(200).send(contractResponse["data"]);
    }
    catch (e) {
        res.status(400).send(e.message);
        return;
    }
}));
/**
 * Server
 */
const server = app.listen(PORT, () => {
    console.info((`Listening on port ${PORT}`));
});
/**
 * Utility Functions
 */
function deleteKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Couldn't connect to network using Admin identity.");
        }
        let currentTime = Math.round((new Date()).getTime() / 1000); //current unix timestamp
        let currentIVal = Math.floor((Math.floor(currentTime / 600)) / 144) * 144;
        const contractResponse = yield fabric.invoke('deleteKeys', [currentIVal.toString()], false, networkObj);
        networkObj.gateway.disconnect();
        if ("err" in contractResponse) {
            console.error(contractResponse.err);
            // Transaction error
            throw new Error(`Failed to run contract function deleteKeys.\n${contractResponse.err}`);
        }
    });
}
function generateApprovalID() {
    const prng = seedrandom_1.default.tychei(new Date().valueOf().toString());
    let approvalID = prng.int32();
    if (approvalID < 0) {
        approvalID = approvalID * -1;
    }
    return approvalID;
}
function sendSMS(to, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!TWIL_SID || !TWIL_AUTH || !TWIL_NUM) {
            throw new Error("Twilio credentials not set");
        }
        const client = twilio_1.default(TWIL_SID, TWIL_AUTH);
        yield client.messages.create({
            body: msg,
            from: TWIL_NUM,
            to: to
        })
            .then(message => console.log(message.sid))
            .catch((e) => {
            console.error(e);
            throw new Error("Couldn't send SMS");
        });
    });
}
function normalisePort(val) {
    const num = parseInt(val, 10);
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
function keyValidity(keyArray) {
    return __awaiter(this, void 0, void 0, function* () {
        ;
        const Invalid = class {
            constructor(msg) {
                this.errorMsg = msg;
            }
        };
        const isInvalid = (errorOrT) => {
            return errorOrT.errorMsg !== undefined;
        };
        ;
        const properKey = (key) => {
            const valid = Boolean(key.hexkey !== "" &&
                typeof key.i === "number");
            return valid ? key : new Invalid("Invalid key");
        };
        yield asyncForEach(keyArray, (element) => __awaiter(this, void 0, void 0, function* () {
            const result = properKey(element);
            if (isInvalid(result)) {
                return false;
            }
        }));
        return true;
    });
}
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        for (let index = 0; index < array.length; index++) {
            yield callback(array[index], index, array);
        }
    });
}
//# sourceMappingURL=app.js.map