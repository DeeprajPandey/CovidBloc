# Typescript API

## Usage

```ts
import { NetworkObject, GenericResponse } from "./services/fabric.interface";
import * as fabric from "./services/fabric";
```

## Methods

### registerUser(username, isMedicalOfficial): Promise\<GenericResponse>

Register, enroll, and import the identity of a new `username` into the wallet.

Add attribute `'health-official: true'` if `isMedicalOfficial` is true for Attribute Based Access Control.

Currently, we use this to register only medical professionals but the interface has been left open ended by design in case someone wants to register a representation of diagnosed keys with the CA (instead of adding the keys as admin).

```ts
const responseObj: GenericResponse = await fabric.registerUser("new.user@hospital.com", true);
```

### connectAsUser(username): Promise\<NetworkObject>

Connect to the network as `username` (wallet should have identity for `username`) and return the gateway and contract objects that can be used to invoke contract functions.

```ts
const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser("registered.user@example.com");
```

### invoke(action, args[], isQuery, networkObj): Promise\<Generic Response | any>

Invoke the function `action` using the contract object in `networkObj` with the string arguments passed as `args`.

If `isQuery` is set to `false`, it will submit a transaction that will go throught the Ordering Service. If set to `true` it will simply evaluate the transaction.

The function either returns a Generic Response with an error or the object returned from the contract `action` that was invoked.

::: warning ⚠️ Note
Disconnect the gateway in networkObj after `invoke()` returns.
:::

This function used to disconnect from the gateway but that didn't allow for multiple calls to `invoke` using the same gateway. Now, it's up to the caller to call `disconnect()`.

```ts
const contractResponse = await fabric.invoke('readAsset', ["meta"], true, networkObj);
networkObj.gateway.disconnect();
```

## Variables

### ADMIN

- Type: `string`
- Value: `admin`

The administrator registered with Fabric Certificate Authority with permissions to issue new identities. Connect to the network explicitly as this user to push new set of daily keys since there is no identity for diagnosed patients and the app does not collect any identifiable information.

_Internally, this is the user that enrols amd registers health officials when they sign up on the app._

::: details Typical Usecase
```ts{1}
const networkObj: GenericResponse | NetworkObject = await fabric.connectAsUser(fabric.ADMIN);

const contractResponse = await fabric.invoke('addPatient', [JSON.stringify(req.body)], false, networkObj);
networkObj.gateway.disconnect();
```
:::

## Interfaces

The module uses two interfaces as response objects from the methods.

### GenericResponse

- `err`: `string | null`

Stores the error message when an exception is caught.

### NetworkObject

- `gateway`: `Gateway`
- `contract`: `Contract`
- `err`: `string | null`

Stores the gateway made with the specified user's wallet identity and the corresponding contract object.

## Errors

Every time we catch an error (custom or standard alike), the function returns an object with an `err` property set to a string which has the function name prepended to the error message. When using this module, put the calls in try...catch blocks and send meaningful responses to the client app gracefully.

## Internal Methods

### validUsername(username): Promise\<boolean>

Utility function for `username` coherence check.

We cannot have `:` in usernames as it's a delimiter for approval record assets on the World State.