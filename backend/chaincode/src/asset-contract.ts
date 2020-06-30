/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset, Meta, DailyKey } from './asset';
import { HealthOfficer, Patient, Approval } from './asset';

@Info({title: 'AssetContract', description: 'My Smart Contract' })
export class AssetContract extends Contract {

    @Transaction()
    public async addPatient(patientObj: Patient): Promise<void> {

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

        const newPatient = new Patient();
        newPatient.approvalID = "1231312";
        newPatient.medID = "m123";
        newPatient.dailyKeys = [
            {'hexkey': "33917c36d48744ef3fbc4985188ea9e2", 'i': 2655360},
            {'hexkey': "33917c36d48744ef3fbc4985188ea9e2", 'i': 2655360}
        ];
        const pBuff = Buffer.from(JSON.stringify(newPatient));
        await ctx. stub.putState('p1', pBuff);

    }

    @Transaction(false)
    @Returns('boolean')
    public async assetExists(ctx: Context, assetId: string): Promise<boolean> {
        const buffer = await ctx.stub.getState(assetId);
        return (!!buffer && buffer.length > 0);
    }

    @Transaction()
    public async createAsset(ctx: Context, assetId: string, value: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (exists) {
            throw new Error(`The asset ${assetId} already exists`);
        }
        const asset = new Asset();
        asset.value = value;
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction(false)
    @Returns('Asset')
    public async readAsset(ctx: Context, assetId: string): Promise<Asset> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const buffer = await ctx.stub.getState(assetId);
        const asset = JSON.parse(buffer.toString()) as Asset;
        return asset;
    }

    @Transaction()
    public async updateAsset(ctx: Context, assetId: string, newValue: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        const asset = new Asset();
        asset.value = newValue;
        const buffer = Buffer.from(JSON.stringify(asset));
        await ctx.stub.putState(assetId, buffer);
    }

    @Transaction()
    public async deleteAsset(ctx: Context, assetId: string): Promise<void> {
        const exists = await this.assetExists(ctx, assetId);
        if (!exists) {
            throw new Error(`The asset ${assetId} does not exist`);
        }
        await ctx.stub.deleteState(assetId);
    }

}
