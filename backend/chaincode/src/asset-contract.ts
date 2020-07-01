/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Meta, DailyKey } from './asset';
import { HealthOfficer, Patient, Approval } from './asset';
const ClientIdentity = require('fabric-shim').ClientIdentity; 

@Info({title: 'AssetContract', description: 'My Smart Contract' })
export class AssetContract extends Contract {

    /**
     * Add a set of diagnosed keys to WS.
     * IMP: Call only after validating patient.
     * 
     * @param ctx Transactional context
     * @param patientObj Approval ID and daily keys of user diagnosed +ve
     */
    @Transaction()
    public async addPatient(ctx: Context, patientObj: Patient): Promise<void> {
        console.log("Reading meta");
        const lastPatientID = (await this.readAsset(ctx, "meta")).patientCtr;
        const newKey = "p" + (lastPatientID + 1).toString();
        console.log("creating patient");
        await this.createAsset(ctx, newKey, JSON.stringify(patientObj));

        const updatedMeta = new Meta();
        updatedMeta.patientCtr = lastPatientID + 1;
        console.log("Updating meta");
        await this.updateAsset(ctx, "meta", JSON.stringify(updatedMeta));
        console.log("done");
    }

    @Transaction()
    public async addHealthOfficer(ctx: Context, medObj: HealthOfficer): Promise<void> {
        const registered = await this.assetExists(ctx, medObj.medID);
        if (!registered) {
            await this.createAsset(ctx, medObj.medID, JSON.stringify(medObj));
        }
    }

    @Transaction()
    public async initiateState(ctx: Context): Promise<void> {
        // const temp = new Meta();
        // temp.patientCtr = 0;
        // await this.createAsset(ctx, "meta", JSON.stringify(temp));

        const patientFromServer = {
            approvalID: "1231312",
            medID: "m123",
            dailyKeys: [
                {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360},
                {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360}
            ]
        };

        //await this.validatePatient(ctx,"123","1231312")
        //await this.addPatient(ctx, patientFromServer);
        await this.getMedProfile(ctx,"123");
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
            throw new Error(`The asset ${assetId} does not exist`);
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

    /**
     * Query a HealthOfficer Asset from the WS.
     * 
     * @param ctx Transactional context
     * @param medID Unique ID of the health officer 
     */
    @Transaction()
    public async getMedProfile(ctx: Context, medID:string){
        const cid = new ClientIdentity(ctx.stub);
        const userID = cid.getID(); 
        const medKey= "m" + medID;
        const medObj = await this.readAsset(ctx,medKey);
        if(medObj!=null){ // && medObj.email==userID){
            return medObj;
        }
        else{
            return null;
        }
    }

    /**
     * Validating before adding +ve patient details to the WS.
     * 
     * @param ctx Transactional context
     * @param medID Unique ID of the health officer 
     * @param checkID ApprovalID of the patient 
     */
    @Transaction()
    public async validatePatient(ctx: Context, medID:string, checkID:string){
        const medKey = "m" + medID;
        const medObj= await this.readAsset(ctx,medKey);
        if(medObj!=null){
            for (let i = 1; i <= medObj.approvalCtr; i++) {
                const assetKey= medKey+":"+i.toString();
                const approvalObj = await this.readAsset(ctx,assetKey);
                if(approvalObj!=null && approvalObj.approvalID==checkID && approvalObj.patientID==null){
                    return "Validate Patient Successful";
                }
            }
            throw new Error(`ApprovalID ${checkID} is invalid`);
        }

        else{
            throw new Error(`MedicalID ${medID} is invalid`);
        }
    }

    /**
     * Downloading all the +ve patient keys from the WS.
     * 
     * @param ctx Transactional context
     */
    @Transaction()
    public async getKeys(ctx:Context){
        const allResults= [];
        const key = "meta";
        const metaObj = await this.readAsset(ctx,key);
        for (let i=1;i<=metaObj.num_positives;i++){
            const patientKey = "p"+i.toString();
            const patientObj = await this.readAsset(ctx,patientKey);
            if(patientObj!=null){
                allResults.push(patientObj.dailyKeys);  //if key also needs to sent then {patientKey,patientObj}
            }
        }
        return JSON.stringify(allResults);
    }

}
