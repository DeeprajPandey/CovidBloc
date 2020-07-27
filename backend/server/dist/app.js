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
//@ts-nocheck
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cron_1 = require("cron");
const helmet_1 = __importDefault(require("helmet"));
const connect_history_api_fallback_1 = __importDefault(require("connect-history-api-fallback"));
const mongoose_1 = __importDefault(require("mongoose"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const passport_1 = __importDefault(require("passport"));
const seedrandom_1 = __importDefault(require("seedrandom"));
const twilio_1 = __importDefault(require("twilio"));
const fabric = __importStar(require("./services/fabric"));
const utils = __importStar(require("./services/jwt"));
const HealthOfficial_1 = __importDefault(require("./models/HealthOfficial"));
require('./services/passport.config')(passport_1.default);
dotenv.config();
const env_variables = Boolean(process.env.TW_SID && process.env.TW_AUTH && process.env.TW_NUM &&
    process.env.ADMIN_NUMS && process.env.DB_URI && process.env.PORT);
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
const staticRoot = '../../health-dashboard/dist';
/**
 * Health Official Database
 */
mongoose_1.default.connect(process.env.DB_URI, {
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
const app = express_1.default();
app.use(passport_1.default.initialize());
/**
 * Middleware Configuration
 */
app.use(helmet_1.default());
app.use(cors_1.default());
app.use(express_1.default.static(staticRoot));
app.use(connect_history_api_fallback_1.default({
    index: '/'
}));
app.use(express_1.default.json());
/**
 * Fabric Routes
 */
app.get("/", (req, res, next) => {
    res.sendFile("index.html", { root: staticRoot });
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
app.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.email);
        if (!validBody) {
            res.status(401).send("⚠️ Invalid request");
            return;
        }
        let email = req.body.email;
        const dbObj = yield HealthOfficial_1.default.findOne({ email: email });
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
        const contractResponse = yield fabric.invoke('addHealthOfficial', [JSON.stringify(medObj)], false, networkObj);
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
            yield sendEmail(dbObj.email, "Your Medical ID", text, html);
        }
        catch (e) {
            throw new Error("Couldn't send medID to the specified email.");
        }
        // Update DB to store the medID
        dbObj.medID = recvID;
        dbObj.t_status = "REGISTERED";
        const response = yield HealthOfficial_1.default.findOneAndUpdate({ email: dbObj.email }, dbObj);
        res.status(200).send("success");
        // res.status(200).send(`${recvID} registered`);
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Server error");
        return;
    }
}));
app.post("/requestotp", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.email &&
            req.body.medID);
        if (!validBody) {
            res.status(401).send("⚠️ Invalid request");
            return;
        }
        // Attempt to read this user from the database
        const dbObj = yield HealthOfficial_1.default.findOne({ email: req.body.email });
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
        yield otpGen(dbObj);
        res.status(200).send("Please check your email for the OTP.");
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Server error");
    }
}));
app.post("/login", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.email &&
            req.body.otp);
        if (!validBody) {
            res.status(401).send("⚠️ Invalid request");
            return;
        }
        // Attempt to read this user from the database
        const dbObj = yield HealthOfficial_1.default.findOne({ email: req.body.email });
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
            yield otpGen(dbObj);
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
        }
        else if (req.body.otp === dbObj.t_otp) { // correct otp
            const networkObj = yield fabric.connectAsUser(req.body.email);
            if (networkObj.err !== null || !("gateway" in networkObj)) {
                console.error(networkObj.err);
                throw new Error("Invalid request");
            }
            const contractResponse = yield fabric.invoke('getMedProfile', [dbObj.medID], true, networkObj);
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
            yield HealthOfficial_1.default.findOneAndUpdate({ email: dbObj.email }, dbObj);
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Server error");
    }
}));
// GET: Get an official's profile
app.get("/healthofficial", passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.i &&
            req.body.e);
        if (!validBody) {
            res.status(401).send("⚠️ Invalid request");
            return;
        }
        const networkObj = yield fabric.connectAsUser(req.body.e);
        if (networkObj.err !== null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Invalid request");
        }
        const contractResponse = yield fabric.invoke('getMedProfile', [req.body.i], true, networkObj);
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
app.post("/trial", passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send("Hi");
}));
// POST: Generate an approval for patient
app.post("/generateapproval", passport_1.default.authenticate('jwt', { session: false }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validBody = Boolean(req.body.email &&
            req.body.medID &&
            req.body.patientContact);
        if (!validBody) {
            res.status(401).send("⚠️ Invalid request");
            return;
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
        res.status(200).send("Approval record generated. Waiting for user keys.");
    }
    catch (e) {
        console.error(e);
        res.status(500).send("Server error");
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
        const validBody = Boolean(req.body.currentIval);
        if (!validBody) {
            throw new Error("Invalid request");
        }
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Admin not registered.");
        }
        const contractResponse = yield fabric.invoke('getKeys', [req.body.currentIval], true, networkObj);
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
function otpGen(dbObj) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const OTP = Math.floor(Math.random() * 90000) + 10000;
            console.log(`OTP: ${OTP}`);
            dbObj.t_authstat = "INITIATED";
            dbObj.t_otp = OTP.toString();
            const text = `Hey there,\nYour login code is ${OTP}\n\nEnter this code on the login page.`;
            const html = `<b>Hey there!</b><br>Your login code is ${OTP}<br><br>Enter this code on the login page.`;
            try {
                yield sendEmail(dbObj.email, "Your Login OTP", text, html);
            }
            catch (e) {
                throw new Error("Couldn't send email.");
            }
            // If the email was sent, set the timestamp
            const createdTime = Math.floor(Date.now() / 1000);
            console.log(createdTime);
            dbObj.t_timestamp = createdTime.toString();
            const response = yield HealthOfficial_1.default.findOneAndUpdate({ email: dbObj.email }, dbObj);
        }
        catch (err) {
            console.error(`otpGen::${err.message}`);
        }
    });
}
function sendEmail(toEmail, sub, msgText, msgHtml) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let transporter = nodemailer_1.default.createTransport({
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
                }
                else {
                    console.log('Server is ready for emails.');
                }
            });
            let mailOptions = {
                from: `"Development Team" <${process.env.EM_USR}>`,
                to: toEmail,
                subject: sub,
                text: msgText,
                html: msgHtml
            };
            let info = yield transporter.sendMail(mailOptions);
            console.log(`Email sent: ${info.messageId}`);
        }
        catch (e) {
            console.error(e);
        }
    });
}
function deleteKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        const networkObj = yield fabric.connectAsUser(fabric.ADMIN);
        if (networkObj.err != null || !("gateway" in networkObj)) {
            console.error(networkObj.err);
            throw new Error("Couldn't connect to network using Admin identity.");
        }
        let currentTime = Math.floor(Date.now() / 1000); //current unix timestamp
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