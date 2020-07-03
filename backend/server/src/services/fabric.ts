import { FileSystemWallet, Gateway } from 'fabric-network';
import { NetworkObject } from './fabric.interface';
import * as path from 'path';

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'Org1Wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

const connectionProfile = path.resolve(__dirname, '..', 'connection.json');

// Returns the network object after connecting as `user`
export const connectAsUser = async (username: string): Promise<NetworkObject> => {
  let responseObj: NetworkObject = {
    gateway: null,
    contract: null,
    err: null
  };
  try {
    // Check if the user exists
    const userExists = await wallet.exists(username);
    if (!userExists) {
      const errorMsg = `fabric.connectAsUser::Identity ${username} not found.`;
      console.info(errorMsg);
      responseObj.err = errorMsg;
      return responseObj;
    }

    // Create new gateway to connect to peer
    const gateway = new Gateway();
    const connectionOptions = { wallet, identity: username, discovery: { enabled: true, asLocalhost: true }};
    await gateway.connect(connectionProfile, connectionOptions);

    // Get the network (channel) our contract is deployed to
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('ctof-chaincode');

    responseObj.gateway = gateway;
    responseObj.contract = contract;
    console.info(`fabric.connectAsUser::${username} connect to network...`);

    return responseObj;
  } catch (e) {
    const errorMsg = "${user} failed to connect to network";
    console.error(`fabric.connectAsUser::${errorMsg}.`);
    responseObj.err = errorMsg;
    return responseObj;
  }
};