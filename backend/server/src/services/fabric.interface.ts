import { Gateway, Contract } from 'fabric-network';

export interface NetworkObject {
  gateway: Gateway | null,
  contract: Contract | null,
  err: string | null
};