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
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoke = exports.connectAsUser = exports.registerUser = exports.ADMIN = void 0;
const fabric_network_1 = require("fabric-network");
const path = __importStar(require("path"));
exports.ADMIN = 'admin';
// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'Org1Wallet');
const wallet = new fabric_network_1.FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);
const connectionProfile = path.resolve(__dirname, '../..', 'connection.json');
/**
 * Generates a new identity (user)
 * The medical param will set the attributes accordingly for permissions.
 * @param newuser new user's email(medical) or random string (diagnosed keys)
 * @param medical boolean value specifying if it's a medical professional
 *
 * @returns GenericResponse With only err set to null or a string (if no errors)
 */
exports.registerUser = (newuser, medical) => __awaiter(void 0, void 0, void 0, function* () {
    let responseObj = {
        err: null
    };
    if (!validUsername(newuser)) {
        throw new Error("Invalid username/email.");
    }
    try {
        // Check if admin exists
        const adminExists = yield wallet.exists(exports.ADMIN);
        if (!adminExists) {
            throw new Error("Admin doesn't exist");
        }
        // Check if user has registered
        const userExists = yield wallet.exists(newuser);
        if (userExists) {
            throw new Error(`Identity ${newuser} exists.`);
        }
        else {
            const gateway = new fabric_network_1.Gateway();
            const connectionOptions = { wallet, identity: exports.ADMIN, discovery: { enabled: true, asLocalhost: true } };
            yield gateway.connect(connectionProfile, connectionOptions);
            // Get CA object to interact and craete new identity
            const ca = gateway.getClient().getCertificateAuthority();
            const adminIdentity = gateway.getCurrentIdentity();
            // Array of KeyValueAttribute objects to assign when registering with CA
            let attributes = [{
                    name: "health-official",
                    value: "false",
                    ecert: true
                }];
            if (medical) {
                attributes[0]["value"] = "true";
            }
            // Register, enroll, and import new identity to wallet
            const secret = yield ca.register({
                affiliation: "org1",
                enrollmentID: newuser,
                role: 'client',
                attrs: attributes
            }, adminIdentity);
            const enrollment = yield ca.enroll({ enrollmentID: newuser, enrollmentSecret: secret, attr_reqs: [{ name: "health-official", optional: false }] });
            const userIdentity = fabric_network_1.X509WalletMixin.createIdentity("Org1MSP", enrollment.certificate, enrollment.key.toBytes());
            yield wallet.import(newuser, userIdentity);
            console.info(`fabric.registerUser::${newuser} registered, enrolled, identity imported to wallet.`);
        }
    }
    catch (e) {
        console.error(e);
        responseObj.err = "fabric.registerUser::" + e.message;
    }
    finally {
        return responseObj;
    }
});
/**let responseObj: GenericResponse = { err: null };
 * Connect to the network as specified user
 * @param username email id (health official) or random string (diagnosed keys)
 * @returns NetworkObject with gateway and contract
 */
exports.connectAsUser = (username) => __awaiter(void 0, void 0, void 0, function* () {
    let errResp = { err: null };
    try {
        // Check if the user exists
        const userExists = yield wallet.exists(username);
        if (!userExists) {
            throw new Error(`Identity ${username} not found.`);
        }
        // Create new gateway to connect to peer
        const gateway = new fabric_network_1.Gateway();
        const connectionOptions = { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } };
        yield gateway.connect(connectionProfile, connectionOptions);
        // Get the network (channel) our contract is deployed to
        const network = yield gateway.getNetwork('mychannel');
        // Get the contract from the network.
        const contract = network.getContract('ctof-chaincode');
        const responseObj = { gateway: gateway, contract: contract, err: null };
        console.info(`fabric.connectAsUser::${username} connected to network...`);
        return responseObj;
    }
    catch (e) {
        errResp.err = "fabric.connectAsUser::" + e.message;
        return errResp;
    }
});
/**
 *
 * @param action Name of chaincode function to be invoked
 * @param args Array of args the function takes
 * @param isQuery True(evaluate) / False(submit) transaction
 * @param networkObj The object returned from connectAsUser
 */
exports.invoke = (action, args, isQuery, networkObj) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result;
        if (isQuery) {
            if (args.length === 0) {
                result = yield networkObj.contract.evaluateTransaction(action);
            }
            else {
                result = yield networkObj.contract.evaluateTransaction(action, ...args);
            }
        }
        else {
            if (args.length === 0) {
                result = yield networkObj.contract.submitTransaction(action);
            }
            else {
                result = yield networkObj.contract.submitTransaction(action, ...args);
            }
        }
        // networkObj.gateway.disconnect();
        const respObj = yield JSON.parse(result);
        return respObj;
    }
    catch (e) {
        const errResp = { err: `fabric.invoke(${action})::${e.message}` };
        return errResp;
    }
});
// Utility function to check for special characters needed in the contract
// can't have colon(:)
function validUsername(username) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!username || username.includes(':')) {
            return false;
        }
        return true;
    });
}
//# sourceMappingURL=fabric.js.map