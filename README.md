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
import { dict, constant, text, integer, encode, decode } from 'typed-cbor';

const schema = dict(
  [constant('name'), text()],
  [constant('age'), integer()],
);

// Encode (dicts accept plain [key, value] pair arrays, or Dict instances)
const cbor = encode(schema, [
  ['name', 'Alice'],
  ['age', 30n],
]);

// Decode
const decoded = decode(schema, cbor);
// decoded.get('name') === 'Alice'
// decoded.get('age') === 30n
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

// Dicts - key-value maps with arbitrary keys.
// record declares a paired `[key, value]` pattern.
// collects these patterns into a shape. Key shapes must be disjoint.
const userSchema = dict(
  [constant('name'), text()],
  [constant('age'), integer()],
);

// A dict decodes into a Dict (a Map subclass) with per-key typing:
const user = decode(userSchema, cbor);
user.get('name'); // string | undefined

// Record-style shorthand for string-keyed dicts. Equivalent to the
// dict() above, but takes a plain object of shapes:
const userMapSchema = map({ name: text(), age: integer() });

// Non-string keys are supported (dict() only — map() is string keys):
const lookupSchema = dict(
  [integer(), text()],
  [text(), boolean()],
);

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
| `encode(shape, value)` | Encodes a value using the provided schema (shared singleton encoder) |
| `createEncoder()` | Creates an isolated encoder instance with its own buffer (`{ encode }`) |
| `decode(shape, cbor)` | Decodes CBOR bytes using the provided schema |
| `typeCheck(shape, value)` | Validates a value against a schema (dict shapes only accept `Dict` instances, not pair arrays) |

## Migrating from V1

- `map({ name: text(), age: integer() })` still exists as a string-keyed shorthand, but it now returns a dict shape that decodes to a `Dict`, not a plain object.
- `encode` no longer accepts plain objects: pass `[['name', 'Alice'], ['age', 30n]]` or `new Dict([['name', 'Alice'], ['age', 30n]])`.
- `decode` returns a `Dict`: read with `decoded.get('name')` instead of `decoded.name`.
- `encode` is now a top-level singleton. Use `createEncoder()` only when you need an isolated buffer.

## Examples

### Basic Encoding

```javascript
// examples/basic.js
import {
  array, boolean, bytes, constant, decode, dict,
  float, integer, nil, oneOf, text, typeCheck,
} from 'typed-cbor';

const sqlParamShape = oneOf(
  nil(),
  boolean(),
  integer(),
  float(),
  text(),
  bytes(),
);

const sqlQueryShape = dict(
  [constant('sql'), text()],
  [constant('params'), array(sqlParamShape)],
);

const cbor = encode(sqlQueryShape, [
  ['sql', 'SELECT * FROM users WHERE id = ?'],
  ['params', [123n]],
]);

const decoded = decode(sqlQueryShape, cbor);
console.log(decoded.get('sql')); // 'SELECT * FROM users WHERE id = ?'
```

### Tags and Transforms

```javascript
// examples/tag.js
import { transform, tag, integer, text, constant, dict, Dict, decode } from 'typed-cbor';

// Tag 0 – RFC 3339 date/time string
const DateTimeShape = tag(0n, transform(
  text(),
  value => new Date(value),
  value => value.toString(),
));

const dateTimeCbor = encode(DateTimeShape, new Date());
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
  dict(
    [constant('x'), integer()],
    [constant('y'), integer()],
  ),
  obj => new Coordinate(Number(obj.get('x')), Number(obj.get('y'))),
  coord => new Dict([
    ['x', BigInt(coord.x)],
    ['y', BigInt(coord.y)],
  ]),
));
```

### Message Routing

```javascript
// examples/communication.js
import { tag, dict, constant, integer, text, tagCheck, decode } from 'typed-cbor';

const AuthShape = tag(10001n, dict(
  [constant('username'), text()],
  [constant('password'), text()],
));

const SessionShape = tag(10002n, dict(
  [constant('userId'), integer()],
  [constant('token'), text()],
));

// Frontend sends auth request
const authRequest = encode(AuthShape, [
  ['username', 'admin'],
  ['password', 'admin'],
]);

// Backend receives and routes by tag
function backendHandler(authCbor) {
  if (tagCheck(AuthShape, authCbor)) {
    const auth = decode(AuthShape, authCbor);
    return encode(SessionShape, [
      ['userId', 1n],
      ['token', 'somecomplextoken'],
    ]);
  }
  throw new Error('Unhandled case');
}
```

## Type Inference

The library provides full TypeScript type inference:

```typescript
import { dict, map, constant, integer, text, encode, decode } from 'typed-cbor';

const UserSchema = dict(
  [constant('id'), integer()],
  [constant('name'), text()],
);

// Record-style shorthand — equivalent to the dict() above:
const UserMapSchema = map({ id: integer(), name: text() });

// InferValue<UserSchema> = Dict<[[ConstShape<'id'>, IntegerShape], [ConstShape<'name'>, TextShape]]>

const cbor = encode(UserSchema, [['id', 1n], ['name', 'Alice']]);
const user = decode(UserSchema, cbor);
// user.get('id')   // bigint | undefined
// user.get('name') // string | undefined
// user.set('id', 'nope') // ✖ type error: string is not bigint
```

Dict values accept either a `Dict` instance (as returned by `decode`) or a plain array of `[key, value]` pairs — the array form is checked against the schema's records at the call site (value types, key kinds, and literal key names).

**Literal inference.** `constant()` and `Dict.get()/set()` use `const` type parameters, so `constant('id')` infers `ConstShape<'id'>` (not `ConstShape<string>`) with no pinning needed. `encode(UserSchema, [['id', 1n], ['name', 'Alice']])` type-checks while both `[['id', 'nope']]` (wrong value) and `[['idx', 1n]]` (wrong key name) fail statically; unknown key names are also caught at runtime by the encoder.

## Limitations

- **Dict keys** - Keys must match one of the declared record patterns, and key shapes must be disjoint (enforced at `dict()` construction). Byte-string keys are supported but compare by content.
- **Numbers** - NaN and Infinity are not supported
- **Indefinite length** - Streaming indefinite-length items are not supported
- **Tags** - Only basic tag support; users must implement custom handlers for CBOR tag registry values
- **BigInt** - Limited to 64-bit integers (signed)

## License

MIT