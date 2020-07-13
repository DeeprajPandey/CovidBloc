/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

////  Utility classes and interfaces for readability  ////

/**
 * // TODO: remove after migration
 * Default asset.
 */
@Object()
export class Asset {
    @Property()
    public value: string;
}

/**
 * Stores the current total positive patients.
 * Use to get upper limit of "p" IDs.
 */
@Object()
export class Meta {
    @Property()
    public patientCtr: string = "0";
    public healthOfficialCtr: string = "1024";
}

/**
 * Interface for TempExpKey we get from user.
 */
export interface DailyKey {
    hexkey: string;
    i: string;
}


////  Wrapper classes for assets in the World State  ////

/**
 * Representation of a positive patient in WS
 */
@Object()
export class Patient {
    @Property()
    public approvalID: string;
    public medID: string;
    public ival : string;
    public dailyKeys: Array<DailyKey>;
}

/**
 * Registered Medical Professionals who can authorise adding dailyKeys.
 * Restricted on the server.
 */
@Object()
export class HealthOfficial {
    @Property()
    public medID: string;
    public approveCtr: string = "0";
    public name: string;
    public email: string;
    public hospital: string;
}

/**
 * Represent an approval by binding the patient ID and approval ID.
 * Key for this asset is "medID:approvalCtr".
 */
@Object()
export class Approval {
    @Property()
    public approvalID: string;
    public patientID: string = null;
}
