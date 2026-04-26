# typed-cbor

A schema-first CBOR (Concise Binary Object Representation) encoder/decoder for JavaScript with full type inference.

## Installation

```bash
npm install typed-cbor
```

## Overview

This library provides:
- **Encode/Decode** - Convert between JavaScript values and CBOR binary format
- **Schema Validation** - Define data structures using composable shape functions
- **Type Inference** - Full TypeScript support with automatic type inference from schemas

## Quick Start

```javascript
import { map, text, integer, createEncoder, decode } from 'typed-cbor';

const schema = map({
  name: text(),
  age: integer(),
});

const encoder = createEncoder();

// Encode
const cbor = encoder.encode(schema, { name: 'Alice', age: 30n });

// Decode
const decoded = decode(schema, cbor);
// decoded = { name: 'Alice', age: 30n }
```

## API

### Primitive Shapes

| Function | TypeScript Type | Description |
|----------|-----------------|-------------|
| `integer()` | `bigint` | Signed integers (arbitrary precision) |
| `text()` | `string` | UTF-8 text strings |
| `bytes()` | `Uint8Array` | Byte strings |
| `boolean()` | `boolean` | True/false values |
| `nil()` | `null` | Null value |
| `undef()` | `undefined` | Undefined value |
| `float()` | `number` | Floating-point numbers |

### Composite Shapes

```javascript
// Arrays - homogeneous collection
const arrayOfIntegers = array(integer());
arrayOfIntegers.type; // 'Array'

// Maps - key-value pairs with string keys
const userSchema = map({
  name: text(),
  age: integer(),
});

// OneOf - union types
const sqlParam = oneOf(nil(), integer(), text(), float());

// Tag - wraps values with a CBOR tag
const timestamp = tag(1n, integer());

// Transform - custom encode/decode functions
const dateShape = tag(0n, transform(
  text(),
  (str) => new Date(str),      // decode: CBOR string -> Date
  (date) => date.toISOString() // encode: Date -> CBOR string
));

// Constant - fixed values
const status = oneOf(constant('active'), constant('inactive'));
```

### Core Functions

| Function | Description |
|----------|-------------|
| `createEncoder()` | Creates an encoder instance with internal buffer |
| `encode(shape, value)` | Encodes a value using the provided schema |
| `decode(shape, cbor)` | Decodes CBOR bytes using the provided schema |
| `typeCheck(shape, value)` | Validates a value against a schema |

## Examples

### Basic Encoding

```javascript
// examples/basic.js
import { array, boolean, bytes, createEncoder, decode, float, integer, map, nil, oneOf, text, typeCheck } from 'typed-cbor';

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

const decoded = decode(sqlQueryShape, cbor);
console.log(decoded.sql); // 'SELECT * FROM users WHERE id = ?'
```

### Tags and Transforms

```javascript
// examples/tag.js
import { transform, tag, integer, text, createEncoder, decode, map } from 'typed-cbor';

const cbor = createEncoder();

// Tag 0 – RFC 3339 date/time string
const DateTimeShape = tag(0n, transform(
  text(),
  value => new Date(value),
  value => value.toString(),
));

const dateTimeCbor = cbor.encode(DateTimeShape, new Date());
const dateTime = decode(DateTimeShape, dateTimeCbor);
// dateTime instanceof Date === true

// Tag 1 – Epoch-based timestamp (seconds)
const TimestampShape = tag(1n, transform(
  integer(),
  value => new Date(Number(value) * 1000),
  value => BigInt(Math.floor(value.getTime() / 1000)),
));

// Custom class transformation
class Coordinate {
  constructor(x, y) { this.x = x; this.y = y; }
}

const CoordinateShape = tag(10003n, transform(
  map({ x: integer(), y: integer() }),
  obj => new Coordinate(Number(obj.x), Number(obj.y)),
  coord => ({ x: BigInt(coord.x), y: BigInt(coord.y) }),
));
```

### Message Routing

```javascript
// examples/communication.js
import { tag, map, integer, text, tagCheck, createEncoder, decode } from 'typed-cbor';

const AuthShape = tag(10001n, map({
  username: text(),
  password: text(),
}));

const SessionShape = tag(10002n, map({
  userId: integer(),
  token: text(),
}));

const cbor = createEncoder();

// Frontend sends auth request
const authRequest = cbor.encode(AuthShape, {
  username: 'admin',
  password: 'admin',
});

// Backend receives and routes by tag
function backendHandler(authCbor) {
  if (tagCheck(AuthShape, authCbor)) {
    const auth = decode(AuthShape, authCbor);
    return cbor.encode(SessionShape, {
      userId: 1n,
      token: 'somecomplextoken',
    });
  }
  throw new Error('Unhandled case');
}
```

## Type Inference

The library provides full TypeScript type inference:

```typescript
import { map, integer, text, createEncoder, decode } from 'typed-cbor';

const UserSchema = map({
  id: integer(),
  name: text(),
});

// InferValue<UserSchema> = { id: bigint, name: string }

const encoder = createEncoder();
const cbor = encoder.encode(UserSchema, { id: 1n, name: 'Alice' });
const user = decode(UserSchema, cbor);
// user: { id: bigint, name: string }
```

## Limitations

- **Map keys** - Only string keys are supported
- **Numbers** - NaN and Infinity are not supported
- **Indefinite length** - Streaming indefinite-length items are not supported
- **Tags** - Only basic tag support; users must implement custom handlers for CBOR tag registry values
- **BigInt** - Limited to 64-bit integers (signed)

## License

MIT