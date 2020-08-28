/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

////  Utility classes and interfaces for readability  ////

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

/*
 * Interface for the approval records to be stored in health official asset
 */
export interface Approvals {
  [key: string]: Array<string>
}


////  Wrapper classes for assets in the World State  ////

/**
 * Representation of a positive patient in WS
 */
@Object()
export class Patient {
    @Property()
    public approvalID: string;
    public approvalDay: string;
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
    public approvals: Approvals;
    public name: string;
    public email: string;
    public hospital: string;
    public publicKey: string;
}
