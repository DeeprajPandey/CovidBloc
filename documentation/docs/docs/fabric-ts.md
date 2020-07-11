# Typescript API

## Usage

```ts
import { NetworkObject, GenericResponse } from "./services/fabric.interface";
import * as fabric from "./services/fabric";
```

## Methods

## Variables

### ADMIN

- Type: `string`
- Value: `admin`

The administrator registered with Fabric Certificate Authority with permissions to issue new identities. Connect to the networ as this user explicitly to push new set of daily keys since there is no identity for diagnosed patients and the app does not collect any identifiable information.

_Internally, this is the user that enrols amd registers health officials when they sign up on the app._