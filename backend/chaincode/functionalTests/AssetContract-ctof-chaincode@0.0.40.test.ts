/*
* Use this file for functional testing of your smart contract.
* Fill out the arguments and return values for a function and
* use the CodeLens links above the transaction blocks to
* invoke/submit transactions.
* All transactions defined in your smart contract are used here
* to generate tests, including those functions that would
* normally only be used on instantiate and upgrade operations.
* This basic test file can also be used as the basis for building
* further functional tests to run as part of a continuous
* integration pipeline, or for debugging locally deployed smart
* contracts by invoking/submitting individual transactions.
*/
/*
* Generating this test file will also trigger an npm install
* in the smart contract project directory. This installs any
* package dependencies, including fabric-network, which are
* required for this test file to be run locally.
*/

import * as assert from 'assert';
import * as fabricNetwork from 'fabric-network';
import { SmartContractUtil } from './ts-smart-contract-util';

import * as os from 'os';
import * as path from 'path';

describe('AssetContract-ctof-chaincode@0.0.40' , () => {

    const homedir: string = os.homedir();
    const walletPath: string = path.join(homedir, '.fabric-vscode', 'environments', '1 Org Local Fabric', 'wallets', 'Org1');
    const gateway: fabricNetwork.Gateway = new fabricNetwork.Gateway();
    const fabricWallet: fabricNetwork.FileSystemWallet = new fabricNetwork.FileSystemWallet(walletPath);
    const identityName: string = 'org1Admin';
    let connectionProfile: any;

    before(async () => {
        connectionProfile = await SmartContractUtil.getConnectionProfile();
    });

    beforeEach(async () => {
        const discoveryAsLocalhost: boolean = SmartContractUtil.hasLocalhostURLs(connectionProfile);
        const discoveryEnabled: boolean = true;

        const options: fabricNetwork.GatewayOptions = {
            discovery: {
                asLocalhost: discoveryAsLocalhost,
                enabled: discoveryEnabled,
            },
            identity: identityName,
            wallet: fabricWallet,
        };

        await gateway.connect(connectionProfile, options);
    });

    afterEach(async () => {
        gateway.disconnect();
    });

    describe('addPatient', () => {
        it('should submit addPatient transaction', async () => {
            // TODO: populate transaction parameters
            const patientObj: any = {};
            const args: string[] = [ JSON.stringify(patientObj)];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'addPatient', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('addHealthOfficer', () => {
        it('should submit addHealthOfficer transaction', async () => {
            // TODO: populate transaction parameters
            const medEmail: string = 'EXAMPLE';
            const medObj: any = {};
            const args: string[] = [ medEmail, JSON.stringify(medObj)];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'addHealthOfficer', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('addPatientApprovalRecord', () => {
        it('should submit addPatientApprovalRecord transaction', async () => {
            // TODO: populate transaction parameters
            const medEmail: string = 'EXAMPLE';
            const newApprovalID: string = 'EXAMPLE';
            const args: string[] = [ medEmail, newApprovalID];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'addPatientApprovalRecord', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('initiateState', () => {
        it('should submit initiateState transaction', async () => {
            // TODO: Update with parameters of transaction
            const args: string[] = [];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'initiateState', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('assetExists', () => {
        it('should submit assetExists transaction', async () => {
            // TODO: populate transaction parameters
            const assetId: string = 'EXAMPLE';
            const args: string[] = [ assetId];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'assetExists', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), true);
        }).timeout(10000);
    });

    describe('createAsset', () => {
        it('should submit createAsset transaction', async () => {
            // TODO: populate transaction parameters
            const assetId: string = 'EXAMPLE';
            const value: string = 'EXAMPLE';
            const args: string[] = [ assetId, value];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'createAsset', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('readAsset', () => {
        it('should submit readAsset transaction', async () => {
            // TODO: populate transaction parameters
            const assetId: string = 'EXAMPLE';
            const args: string[] = [ assetId];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'readAsset', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('updateAsset', () => {
        it('should submit updateAsset transaction', async () => {
            // TODO: populate transaction parameters
            const assetId: string = 'EXAMPLE';
            const newValue: string = 'EXAMPLE';
            const args: string[] = [ assetId, newValue];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'updateAsset', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('deleteAsset', () => {
        it('should submit deleteAsset transaction', async () => {
            // TODO: populate transaction parameters
            const assetId: string = 'EXAMPLE';
            const args: string[] = [ assetId];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'deleteAsset', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('getMedProfile', () => {
        it('should submit getMedProfile transaction', async () => {
            // TODO: populate transaction parameters
            const medEmail: string = 'EXAMPLE';
            const args: string[] = [ medEmail];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'getMedProfile', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

    describe('getKeys', () => {
        it('should submit getKeys transaction', async () => {
            // TODO: Update with parameters of transaction
            const args: string[] = [];

            const response: Buffer = await SmartContractUtil.submitTransaction('AssetContract', 'getKeys', args, gateway);
            // submitTransaction returns buffer of transcation return value
            // TODO: Update with return value of transaction
            assert.equal(true, true);
            // assert.equal(JSON.parse(response.toString()), undefined);
        }).timeout(10000);
    });

});
