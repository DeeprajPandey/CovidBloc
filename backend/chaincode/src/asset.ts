/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {

    @Property()
    public value: string;

}

@Object()
export class Meta {
    
    @Property()
    public patientCtr: number = 0;

}

// export interface DailyKey {
//     hexkey: string;
//     i: number;
// }

@Object()
export class Patient {

    @Property()
    public approvalID: string;
    public medID: string;
    public dailyKeys: Array<{hexkey: string, i: number}>;
}

@Object()
export class HealthOfficer {

    @Property()
    public name: string;
    public email: string;
    public hospital: string;
    public approvalCtr: number = -1;

}

@Object()
export class Approval{

    @Property()
    public approvalID: string;
    public patientID: string;
    
}
