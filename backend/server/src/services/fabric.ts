import { FileSystemWallet, Gateway, X509WalletMixin, Contract } from 'fabric-network';
import { GenericResponse, NetworkObject } from './fabric.interface';
import * as path from 'path';

const ADMIN = 'org1Admin';

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'Org1Wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const connectionProfile = path.resolve(__dirname, '..', 'connection.json');

/**
 * Generates a new identity (user)
 * The medical param will set the attributes accordingly for permissions.
 * @param newuser new user's email(medical) or random string (diagnosed keys)
 * @param medical boolean value specifying if it's a medical professional
 * 
 * @returns GenericResponse With only err set to null or a string (if no errors)
 */
export const registerUser = async (newuser: string, medical: boolean): Promise<GenericResponse> => {
  let responseObj: GenericResponse = {
    err: null
  };

  if (!validUsername(newuser)) {
    responseObj.err = "Invalid username/email.";
    return responseObj;
  }

  try {
    // Check if admin exists
    const adminExists = await wallet.exists(ADMIN);
    if (!adminExists) {
      const errorMsg: string = "fabric.registerUser::Admin doesn't exist";
      console.info(errorMsg);
      responseObj.err = errorMsg;
      return responseObj;
    }

    // Check if user has registered
    const userExists: boolean = await wallet.exists(newuser);
    if (userExists) {
      const errorMsg = `fabric.registerUser::Identity ${newuser} exists.`;
      console.info(errorMsg);
      responseObj.err = errorMsg;
    } else {
      const gateway = new Gateway();
      const connectionOptions = { wallet, identity: ADMIN, discovery: { enabled: true, asLocalhost: true } };
      await gateway.connect(connectionProfile, connectionOptions);

      // Get CA object to interact and craete new identity
      const ca = gateway.getClient().getCertificateAuthority();
      const adminIdentity = gateway.getCurrentIdentity();

      // Array of KeyValueAttribute objects to assign when registering with CA
      let attributes: any[] = [{
        name: "health-official",
        value: "false", // not health-official by default
        ecert: true
      }];

      if (medical) {
        attributes[0]["value"] = "true";
      }
      // Register, enroll, and import new identity to wallet
      const secret = await ca.register({
        affiliation: "org1.health",
        enrollmentID: newuser,
        role: 'client',
        attrs: attributes
      }, adminIdentity);

      const enrollment = await ca.enroll({ enrollmentID: newuser, enrollmentSecret: secret, attr_reqs: [{ name: "health-official", optional: false }] });
      const userIdentity = X509WalletMixin.createIdentity("Org1MSP", enrollment.certificate, enrollment.key.toBytes());
      await wallet.import(newuser, userIdentity);

      console.info(`fabric.registerUser::${newuser} registered, enrolled, identity imported to wallet.`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    return responseObj;
  }
};

/**
 * Connect to the network as specified user
 * @param username email id (health official) or random string (diagnosed keys)
 * @returns NetworkObject with gateway and contract
 */
export const connectAsUser = async (username: string): Promise<NetworkObject | GenericResponse> => {
  let errResp: GenericResponse = { err: null };
  try {
    // Check if the user exists
    const userExists = await wallet.exists(username);
    if (!userExists) {
      const errorMsg = `fabric.connectAsUser::Identity ${username} not found.`;
      console.info(errorMsg);
      errResp.err = errorMsg;
      return errResp;
    }

    // Create new gateway to connect to peer
    const gateway = new Gateway();
    const connectionOptions = { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } };
    await gateway.connect(connectionProfile, connectionOptions);

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('ctof-chaincode');

    const responseObj: NetworkObject = { gateway: gateway, contract: contract, err: null };
    console.info(`fabric.connectAsUser::${username} connect to network...`);

    return responseObj;
  } catch (e) {
    const errorMsg = "${user} failed to connect to network";
    console.error(`fabric.connectAsUser::${errorMsg}.`);
    errResp.err = errorMsg;
    return errResp;
  }
};

// Utility function to check for special characters needed in the contract
// can't have colon(:)
async function validUsername(username: string): Promise<boolean> {
  if (!username || username.includes(':')) {
    return false;
  }
  return true;
}