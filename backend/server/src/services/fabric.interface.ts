import { Gateway, Contract } from 'fabric-network';

export interface GenericResponse {
  err: string | null;
}

export interface NetworkObject extends GenericResponse {
  gateway: Gateway | null,
  contract: Contract | null
};