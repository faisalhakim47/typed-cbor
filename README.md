# typed-cbor

A type-safe CBOR (Concise Binary Object Representation) encoder/decoder for JavaScript with schema validation and automatic TypeScript type inference.

## Features

- **Schema-first design** - Define data shapes and encode/decode with automatic validation
- **Type inference** - Automatic TypeScript types from schema definitions
- **Typed API** - Full TypeScript support with JSDoc annotations
- **RFC 8949 compliant** - Subset of CBOR major types
- **Browser-first** - Works in browser and Node.js environments

## Install

```bash
npm install typed-cbor
```

## Usage

Define a schema using shape functions, then encode and decode values:

```javascript
import { map, text, array, integer, oneOf, nil, createEncoder, decode, typeCheck } from 'typed-cbor';

const QuerySchema = map({
  sql: text(),
  params: array(oneOf(integer(), text(), nil())),
});

const encoder = createEncoder();

const cbor = encoder.encode(QuerySchema, {
  sql: 'SELECT * FROM users WHERE id = ?',
  params: [1n, 'admin'],
});

const query = decode(QuerySchema, cbor);
```

### Type Safety at Runtime

Use `typeCheck` for runtime validation:

```javascript
import { typeCheck } from 'typed-cbor';

/** @type {unknown} */
let unknownValue = undefined;

if (typeCheck(QuerySchema, unknownValue)) {
  // unknownValue is typed as { sql: string, params: (bigint | string | null)[] }
  console.log(unknownValue.sql);
}
```

## Schema API

### Primitive Types

```javascript
integer()     // BigInt values
float()       // Number (float32/float64)
text()        // String
bytes()       // Uint8Array
boolean()    // Boolean
nil()         // null
undef()       // undefined
```

### Composite Types

```javascript
array(items)        // Array of items with specific shape
map(props)         // Object with string keys
oneOf(...variants) // Union type
constant(value)    // Literal/constant value
tag(tag, value, options) // CBOR tag with custom encode/decode
```

### Encoder & Decoder

```javascript
const encoder = createEncoder();
const cbor = encoder.encode(shape, value);

const decoded = decode(shape, cbor);
const isValid = typeCheck(shape, value);
```

## Examples

### SQL Query Parameters

```javascript
import { map, text, array, integer, float, oneOf, nil, bytes, boolean, createEncoder, decode } from 'typed-cbor';

const sqlParamShape = oneOf(
  nil(),
  boolean(),
  integer(),
  float(),
  text(),
  bytes(),
);

const sqlQueryShape = map({
  sql: text(),
  params: array(sqlParamShape),
});

const encoder = createEncoder();

const cbor = encoder.encode(sqlQueryShape, {
  sql: 'SELECT * FROM users WHERE id = ?',
  params: [123n],
});

const query = decode(sqlQueryShape, cbor);
```

### Tagged Messages (Communication Protocols)

```javascript
import { tag, map, text, integer, tagCheck, createEncoder, decode } from 'typed-cbor';

const encoder = createEncoder();

const AuthShape = tag(10001n, map({
  username: text(),
  password: text(),
}), {
  encode: (value) => ({ username: value.username, password: value.password }),
  decode: (value) => ({ username: value.username, password: value.password }),
});

const SessionShape = tag(10002n, map({
  userId: integer(),
  token: text(),
}), {
  encode: (value) => ({ userId: value.userId, token: value.token }),
  decode: (value) => ({ userId: value.userId, token: value.token }),
});

function frontendSendAuth() {
  return encoder.encode(AuthShape, {
    username: 'admin',
    password: 'secret',
  });
}

function backendHandler(authCbor) {
  if (tagCheck(AuthShape, authCbor)) {
    const auth = decode(AuthShape, authCbor);
    return encoder.encode(SessionShape, {
      userId: 1n,
      token: 'token123',
    });
  }
  throw new Error('Unknown message type');
}
```

## Limitations

- Map keys are limited to strings only
- Does not support NaN, Infinity, or streaming indefinite-length items
- Tags are partially supported - custom encode/decode handlers must be provided
- Negative integers are encoded using the CBOR scheme (N = -1 - value)

## License

MIT