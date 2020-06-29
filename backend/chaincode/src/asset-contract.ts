/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Asset, MedicalProf } from './asset';

@Info({title: 'AssetContract', description: 'My Smart Contract' })
export class AssetContract extends Contract {

    @Transaction()
    public async initiateState(ctx: Context): Promise<void> {
        for (let index = 0; index < 7; index++) {
            const element = "string" + index.toString();
            await this.createAsset(ctx, index.toString(), element);
        }
        const medProf = new MedicalProf();
        medProf.hospital = "Apollo";
        const buffer = Buffer.from(JSON.stringify(medProf));
        await ctx.stub.putState("8", buffer);
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
