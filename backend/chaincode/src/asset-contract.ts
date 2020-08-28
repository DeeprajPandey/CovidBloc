/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Meta } from './asset';
import { HealthOfficial, Patient } from './asset';
import jsrsasign from 'jsrsasign';
const ClientIdentity = require('fabric-shim').ClientIdentity;

@Info({ title: 'AssetContract', description: 'CovidBloc Contract' })
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
    let currMeta = await this.readAsset(ctx, "meta") as Meta;
    if (currMeta === null) {
      responseObj["err"] = "Meta does not exist";
      return responseObj;
      //throw new Error(`Meta does not exist`);
    }
    const lastPatientID = parseInt(currMeta.patientCtr);
    const newPKey = "p" + (lastPatientID + 1).toString();

    const healthOfficial = await this.readAsset(ctx, `m${patientObj.medID}`) as HealthOfficial;

    if (!healthOfficial) {
      responseObj["err"] = "Invalid medical official"
      return responseObj;
    }

    console.log("Creating patient");
    await this.createAsset(ctx, newPKey, JSON.stringify(patientObj));

    // If we have apIDs for this day
    if (Object.keys(healthOfficial.approvals).includes(patientObj.approvalDay)) {
      // push new apID (this works because we have validated that apID is valid)
      healthOfficial.approvals[patientObj.approvalDay].push(patientObj.approvalID);
    } else {
      // create a new record for this day and add this apID (this is an array)
      healthOfficial.approvals[patientObj.approvalDay] = [patientObj.approvalID];
    }
    await this.updateAsset(ctx, `m${patientObj.medID}`, JSON.stringify(healthOfficial));

    currMeta.patientCtr = (lastPatientID + 1).toString();
    console.log("Updating meta");
    await this.updateAsset(ctx, "meta", JSON.stringify(currMeta));

    responseObj["msg"] = "Patient added successfully";
    return responseObj;
  }

  @Transaction()
  public async addHealthOfficial(ctx: Context, medObj: HealthOfficial): Promise<any> {
    let responseObj = {};
    let currMeta = await this.readAsset(ctx, "meta") as Meta;
    if (currMeta === null) {
      responseObj["err"] = "Meta does not exist";
      return responseObj;
      //throw new Error(`Meta does not exist`);
    }
    const lastMedID = parseInt(currMeta.healthOfficialCtr);
    const newMedID = (lastMedID + 1).toString();

    medObj.medID = newMedID;
    await this.createAsset(ctx, `m${newMedID}`, JSON.stringify(medObj));

    currMeta.healthOfficialCtr = newMedID;
    await this.updateAsset(ctx, "meta", JSON.stringify(currMeta));

    responseObj["msg"] = `${newMedID} registered successfully`;
    return responseObj;
  }

  /**
   * Query a HealthOfficial Asset from the WS.
   * 
   * @param ctx Transactional context
   * @param medID Unique ID of the health officer 
   */
  @Transaction(false)
  public async getMedProfile(ctx: Context, medID: string): Promise<any> {
    let responseObj = {};
    const cid = new ClientIdentity(ctx.stub);
    const username = cid.getID();
    const attrCheck: boolean = cid.assertAttributeValue('health-official', 'true');

    let medObj = await this.readAsset(ctx, `m${medID}`);
    if (attrCheck) {
      if (medObj !== null && username.includes(medObj.email)) {
        delete medObj.publicKey;
        delete medObj.approvals;
        responseObj["data"] = medObj;
      }
      else {
        //throw new Error(`Email ID ${medID} is invalid`);
        responseObj["err"] = "Invalid email";
      }
    } else {
      responseObj["err"] = "Invalid permissions";
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
  @Transaction(false)
  public async validatePatient(ctx: Context, medID: string, checkID: string, signature: string, apTime: string): Promise<any> {
    let responseObj = {};
    const medObj = await this.readAsset(ctx, `m${medID}`);
    if (medObj != null) {
      let allTimestamps = Object.keys(medObj.approvals);
      const twoWeekThreshold = (Math.floor(Math.floor(Math.floor(Date.now() / 1000) / 600) / 144) * 144) - (14 * 144);

      // check if the approval came within last 14 days
      if (parseInt(apTime) < twoWeekThreshold) {
        // @ts-ignore
        responseObj["err"] = "Old request";
      } else {
        if (allTimestamps.includes(apTime)) {
          if (medObj.approvals[apTime].includes(checkID)) {
            // @ts-ignore
            responseObj["err"] = "Approval exists";
          }
        }
        if (!Object.keys(responseObj).includes("err")) {
          const pubKeyPEM = medObj.publicKey;

          let sig = new jsrsasign.KJUR.crypto.Signature({ alg: "SHA512withRSA" });
          sig.init(pubKeyPEM);
          sig.updateString(checkID + medID + apTime);
          const isValid = sig.verify(signature);

          if (isValid) {
            // @ts-ignore
            responseObj["msg"] = "Validate patient Successful";
          } else {
            // @ts-ignore
            responseObj["err"] = "Invalid signature";
          }
        }
      }
    } else {
      //throw new Error(`Email ID ${medID} is invalid`);
      responseObj["err"] = "Invalid medical ID";
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
    const metaObj = await this.readAsset(ctx, "meta");
    if (!metaObj) {
      responseObj["err"] = "Meta doesn't exist";
      return responseObj;
    }
    for (let i = parseInt(metaObj.patientCtr); i > 0; i--) {
      const patientKey = "p" + i.toString();
      const patientObj = await this.readAsset(ctx, patientKey);
      if (patientObj !== null) {
        if (patientObj.ival === currentIval) { //we will call this function when tempkey is gen(so new i val)- need patients who have been added in the last 24hrs
          allResults.push(patientObj.dailyKeys);  //if key also needs to sent then {patientKey,patientObj}
        }
      }
    }
    // Flatten the array (we know max level is 1, so reduce works)
    responseObj["data"] = allResults.reduce((acc, val) => acc.concat(val), []);
    return responseObj;
  }

  /**
  * Deleting old keys from the WS and corresponding approval asset.
  * 
  * @param ctx Transactional context
  * @param currentIval: i value of current time
  */
  @Transaction()
  public async deleteKeys(ctx: Context, currentIval: string) {
    let responseObj = {};
    const metaObj = await this.readAsset(ctx, "meta");
    if (!metaObj) {
      responseObj["err"] = "Meta doesn't exist";
      return responseObj;
    }
    // set-like behaviour b/c JS set doesn't work as expected for objs
    let theDeletionSet = {};

    const threshold = parseInt(currentIval) - (144 * 14);
    for (let i = 1; i <= parseInt(metaObj.patientCtr); i++) {
      const patientKey = "p" + i.toString();
      const patientObj = await this.readAsset(ctx, patientKey);

      if (patientObj !== null && parseInt(patientObj.ival) < threshold) {
        const apDay = patientObj.approvalDay;
        const medID = patientObj.medID;
        await this.deleteAsset(ctx, patientKey);

        // Store the medID and apDay to update this patient's medical official's record
        if (theDeletionSet.hasOwnProperty(medID)) {
          theDeletionSet[medID].push(apDay);
        } else {
          theDeletionSet[medID] = [apDay];
        }
      }

      // deletionSet = {medID: [apDay1, apDay2, ...]}
      for (const [mID, dayArray] of Object.entries(theDeletionSet)) {
        let mObj = await this.readAsset(ctx, `m${mID}`);
        // @ts-ignore
        dayArray.forEach((apDay: string) => {
          // remove all approvalIDs for this day's entry
          delete mObj.approvals[apDay];
        });
        // update the medObj
        await this.updateAsset(ctx, `m${mID}`, mObj);
      }
    }

    responseObj["msg"] = "Old keys deleted";
    return responseObj;
  }

  @Transaction()
  public async initState(ctx: Context): Promise<void> {
    let temp = {
      patientCtr: "0",
      healthOfficialCtr: "1024"
    };
    await this.createAsset(ctx, "meta", JSON.stringify(temp));
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
