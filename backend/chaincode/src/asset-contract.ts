/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Meta, DailyKey } from './asset';
import { HealthOfficer, Patient, Approval } from './asset';
const ClientIdentity = require('fabric-shim').ClientIdentity;

@Info({ title: 'AssetContract', description: 'My Smart Contract' })
export class AssetContract extends Contract {

    /**
     * Add a set of diagnosed keys to WS.
     * IMP: Call only after validating patient.
     * 
     * @param ctx Transactional context
     * @param patientObj Approval ID and daily keys of user diagnosed +ve
     */
    @Transaction()
    public async addPatient(ctx: Context, patientObj: Patient): Promise<any> {
        let responseObj = {};
        console.log("Reading meta");
        let currMeta = await this.readAsset(ctx, "meta") as Meta;
        if (currMeta == null) {
            responseObj["err"] = "Meta does not exist";
            //throw new Error(`Meta does not exist`);
        }
        const lastPatientID = currMeta.patientCtr;
        const newPKey = "p" + (lastPatientID + 1).toString();

        const healthOfficial = await this.readAsset(ctx, patientObj.medEmail) as HealthOfficer;

        if (!healthOfficial) {
            // TODO: return to server as invalid medical official (medEmail)
            responseObj["err"] = "Invalid medical official"
            return responseObj;
        }
        // Check from the most recent approval number
        for (let apNum = healthOfficial.approveCtr; apNum > 0; apNum--) {
            const apKey = patientObj.medEmail + ":" + apNum.toString();
            let apObj = await this.readAsset(ctx, apKey) as Approval;

            // Found valid approval from health official
            if (apObj.patientID == null && apObj.approvalID == patientObj.approvalID) {
                // Update approval to add patient key
                apObj.patientID = newPKey;
                await this.updateAsset(ctx, apKey, JSON.stringify(apObj));

                console.log("Creating patient");
                await this.createAsset(ctx, newPKey, JSON.stringify(patientObj));

                currMeta.patientCtr = lastPatientID + 1;
                console.log("Updating meta");
                await this.updateAsset(ctx, "meta", JSON.stringify(currMeta));
                console.log("done");

                responseObj["msg"] = "Patient Added Successfully";
                break;
            }
        }
        return responseObj;
    }

    @Transaction()

    public async addHealthOfficer(ctx: Context, medEmail: string, medObj: HealthOfficer): Promise<any> {
        let responseObj = {};
        const registered = await this.assetExists(ctx, medEmail);
        if (!registered) {
            await this.createAsset(ctx, medEmail, JSON.stringify(medObj));
            responseObj["msg"] = "Registered successfully";
        } else {
            responseObj["err"] = "User has registered";
        }
        return responseObj;
    }

    /**
     * Adds a record of a health official approving a patient
     * approvalNum = approveCtr + 1
     * 
     * @param medID Health Official's ID
     * @param approvalNum The approval ID for this official
     */
    @Transaction()
    public async addPatientApprovalRecord(ctx: Context, medEmail: string, newApprovalID: string): Promise<any> {
        let responseObj = {}
        let official = await this.readAsset(ctx, medEmail) as HealthOfficer;
        if (!official) {
            // throw new Error("Doc doesnt exist");
            // TODO: Return to server gracefully
            responseObj["err"] = "Health official with this email doesnt exist";
            return responseObj;
        }
        const apNum = official.approveCtr + 1;
        official.approveCtr = apNum;

        // Update health official record with new ctr
        await this.updateAsset(ctx, medEmail, JSON.stringify(official));

        const key = medEmail + ":" + apNum.toString();
        let apObj = new Approval();
        apObj.approvalID = newApprovalID;
        apObj.patientID = null; // patient hasn't uploaded keys yet

        await this.createAsset(ctx, key, JSON.stringify(apObj));
        responseObj["msg"] = "Approval asset created successfully";
        return responseObj;
    }

    /**
     * Query a HealthOfficer Asset from the WS.
     * 
     * @param ctx Transactional context
     * @param medID Unique ID of the health officer 
     */
    @Transaction(false)
    public async getMedProfile(ctx: Context, medEmail: string): Promise<any> {
        let responseObj = {};
        const cid = new ClientIdentity(ctx.stub);
        const attrCheck: boolean = cid.assertAttributeValue('health-official', 'true');
        if (attrCheck) {
            const medObj = await this.readAsset(ctx, medEmail);
            if (medObj != null) {
                responseObj["data"] = medObj;
            }
            else {
                //throw new Error(`Email ID ${medEmail} is invalid`);
                responseObj["err"] = "Invalid Email Address";
            }
        } else {
            responseObj["err"] = "Not allowed to query this profile";
        }

        return responseObj;
    }

    /**
     * Validating before adding +ve patient details to the WS.
     * 
     * @param ctx Transactional context
     * @param medID Unique ID of the health officer 
     * @param checkID ApprovalID of the patient 
     */
    public async validatePatient(ctx: Context, medEmail: string, checkID: string): Promise<any> {
        let responseObj = {};
        const medObj = await this.readAsset(ctx, medEmail);
        if (medObj != null) {
            for (let i = medObj.approvalCtr; i > 0; i--) {
                const assetKey = medEmail + ":" + i.toString();
                const approvalObj = await this.readAsset(ctx, assetKey);
                if (approvalObj != null && approvalObj.approvalID == checkID && approvalObj.patientID == null) {
                    responseObj["msg"] = "Validate patient successful";
                    return responseObj;
                    //return "Validate Patient Successful";
                }
            }
            //throw new Error(`ApprovalID ${checkID} is invalid`);
            responseObj["err"] = "Invalid approval ID/email ID of the health offcial";
        }

        else {
            //throw new Error(`Email ID ${medEmail} is invalid`);
            responseObj["err"] = "No medical facility with this email exists";
        }

        return responseObj;
    }

    /**
     * Downloading all the +ve patient keys from the WS.
     * 
     * @param ctx Transactional context
     */
    @Transaction(false)
    public async getKeys(ctx: Context, currentIval: string): Promise<any> {
        let responseObj = {};
        const allResults = [];
        const key = "meta";
        const metaObj = await this.readAsset(ctx, key);
        for (let i = metaObj.patientCtr; i > 0; i--) {
            const patientKey = "p" + i.toString();
            const patientObj = await this.readAsset(ctx, patientKey);
            if (patientObj != null) {
                if (patientObj.ival == (parseInt(currentIval) - 144).toString()) { //we will call this function when tempkey is gen(so new i val)- need patients who have been added in the last 24hrs
                    allResults.push(patientObj.dailyKeys);  //if key also needs to sent then {patientKey,patientObj}
                }
                else if (parseInt(currentIval) == -1) {       //for first time users
                    allResults.push(patientObj.dailyKeys);
                }
            }
            else {
                responseObj["err"] = "Error downloading keys";
                return responseObj;
            }
        }
        responseObj["data"] = JSON.stringify(allResults);
        return responseObj;
    }

    /**
    * Deleting old keys from the WS.
    * 
    * @param ctx Transactional context
    * @param currentIval: i value of current time
    */
    @Transaction()
    public async deleteKeys(ctx: Context, currentIval: string) {
        let responseObj = {};
        const key = "meta";
        const metaObj = await this.readAsset(ctx, key);
        const threshold = parseInt(currentIval) - (144 * 14);
        for (let i = 1; i <= metaObj.patientCtr; i++) {
            const patientKey = "p" + i.toString();
            const patientObj = await this.readAsset(ctx, patientKey);
            if (patientObj != null && patientObj.ival == threshold.toString()) {
                await this.deleteAsset(ctx, patientKey);
            }

        }

        responseObj["msg"] = "Old keys deleted";
        return responseObj;
    }

    @Transaction()
    public async initiateState(ctx: Context): Promise<void> {
        let temp = new Meta();
        temp.patientCtr = 0;
        let str = JSON.stringify(temp);
        await this.createAsset(ctx, "meta", str);

        const meta = await this.readAsset(ctx, "meta");
        if (!meta) {
            throw new Error("Meta not there!");
        }
        // const patientFromServer = {
        //     approvalID: "1231312",
        //     medID: "m123",
        //     dailyKeys: [
        //         {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360},
        //         {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360}
        //     ]
        // };

        //const medObj = {name: "M1",hospital : "Apollo",medID: "123",approveCtr: 0};
        // await this.addHealthOfficer(ctx,medObj);

        // //await this.validatePatient(ctx,"123","1231312")
        // await this.addPatient(ctx, patientFromServer);
        // await this.getMedProfile(ctx,"123");
        //await this.getKeys(ctx);
    }

    @Transaction(false)
    @Returns('boolean')
    public async assetExists(ctx: Context, assetId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(assetId);
        return (!!buffer && buffer.length > 0);
    }

    /**
     * Creates a new asset in the WS. Type is specified in the generic arg.
     * 
     * @param ctx Transactional context
     * @param assetId Asset key in WS
     * @param value String-ified asset
     */
    @Transaction()
    public async createAsset(ctx: Context, assetId: string, value: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset ${assetId} already exists`);
        }

        const buffer = Buffer.from(value);
        await ctx.stub.putState(assetId, buffer);
        console.log('Added');
        return;
    }

    /**
     * Returns the asset object of a given key. Uses Generics, so needs
     * the type as argument as well.
     * 
     * @param ctx Transactional context
     * @param assetId Asset key in WS
     */
    @Transaction(false)
    @Returns('any')
    public async readAsset(ctx: Context, assetId: string): Promise<any> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            // throw new Error(`The asset ${assetId} does not exist`);
            return null;
        }
        const buffer = await ctx.stub.getState(assetId);
        const asset = JSON.parse(buffer.toString());
        return asset;
    }

    /**
     * Update an asset with a new value. Type is passed as generic argument.
     * 
     * @param ctx Transactional context
     * @param assetId Asset key in WS
     * @param newValue String-ified asset
     */
    @Transaction()
    public async updateAsset(ctx: Context, assetId: string, newValue: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }

        const buffer = Buffer.from(newValue);
        await ctx.stub.putState(assetId, buffer);
    }

    /**
     * Delete an asset from the WS.
     * 
     * @param ctx Transactional context
     * @param assetId Asset key
     */
    @Transaction()
    public async deleteAsset(ctx: Context, assetId: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        await ctx.stub.deleteState(assetId);
    }

}
