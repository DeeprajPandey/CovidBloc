/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Object, Property } from 'fabric-contract-api';

@Object()
export class Asset {

    @Property()
    public value: string;

}

export class MedicalProf {
    @Property()
    public hospital: string;
}
