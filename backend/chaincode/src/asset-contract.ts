/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Meta, DailyKey } from './asset';
import { HealthOfficer, Patient, Approval } from './asset';

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
        const lastPatientID = (await this.readAsset(ctx, 'meta')).patientCtr;
        const newKey = "p" + (lastPatientID + 1).toString();
        await this.createAsset(ctx, newKey, JSON.stringify(patientObj));

        const updatedMeta = new Meta();
        updatedMeta.patientCtr = lastPatientID + 1;
        await this.updateAsset(ctx, 'meta', JSON.stringify(updatedMeta));
    }

    @Transaction()
    public async initiateState(ctx: Context): Promise<void> {
        const meta_buffer = Buffer.from(JSON.stringify(new Meta()));
        await ctx.stub.putState("meta", meta_buffer);

        const medProf = new HealthOfficer();
        medProf.name = "New Name";
        medProf.hospital = "Apollo";
        const medBuff = Buffer.from(JSON.stringify(medProf));
        await ctx.stub.putState("m123", medBuff);

        const patientFromServer = {
            approvalID: "1231312",
            medID: "m123",
            dailyKeys: [
                {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360},
                {hexkey: "33917c36d48744ef3fbc4985188ea9e2", i: 2655360}
            ]
        };
        await this.addPatient(ctx, patientFromServer);
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

}
