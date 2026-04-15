# typed-cbor

A lightweight, schema-first CBOR (Concise Binary Object Representation) encoder/decoder for JavaScript. It is dependency-free and targets modern runtimes (browser and Node.js).

## Overview

`typed-cbor` serializes and deserializes CBOR data using explicit schemas. Schemas are used for:

- Runtime validation during encode and decode
- Type annotations exposed through generated declaration files

The implementation follows core CBOR behavior from [RFC 8949](https://www.rfc-editor.org/info/rfc8949), with a deliberate subset of features.

## Installation

```bash
npm install typed-cbor
```

For local development in this repository, import from `./lib/cbor.js`.

## Quick Start

```javascript
import { integer, text, map, createEncoder, decode } from 'typed-cbor';

const userSchema = map({
  id: integer(),
  name: text(),
  email: text(),
});

const encoder = createEncoder();

const user = { id: 1n, name: 'Alice', email: 'alice@example.com' };
const encoded = encoder.encode(userSchema, user);

const decoded = decode(userSchema, encoded);
console.log(decoded);
```

## Schema API

### Primitive schemas

```javascript
import { integer, text, bytes, boolean, nil, undef, float } from 'typed-cbor';

const id = integer();       // bigint
const name = text();        // string
const payload = bytes();    // Uint8Array
const active = boolean();   // boolean
const empty = nil();        // null
const missing = undef();    // undefined
const score = float();      // number
```

### Composite schemas

```javascript
import { array, map, oneOf, integer, text, boolean } from 'typed-cbor';

const tags = array(text());

const person = map({
  name: text(),
  age: integer(),
  active: boolean(),
});

// Union of variants (not tagged/discriminated by the library)
const idOrName = oneOf(integer(), text());
```

### Tagged values

```javascript
import { tag, integer, text, map, bytes, float, createEncoder, decode, tagCheck } from 'typed-cbor';

// Tag 0 – RFC 3339 date/time string
const dateTimeSchema = tag(0n, text(), {
  encode: (value) => value.toISOString(),
  decode: (value) => new Date(value),
});

// Tag 1 – Epoch-based date/time (seconds)
const timestampSchema = tag(1n, integer(), {
  encode: (value) => BigInt(Math.floor(value.getTime() / 1000)),
  decode: (value) => new Date(Number(value) * 1000),
});

// Use tagCheck to verify tag before decoding
const cborData = receiveFromNetwork();
if (tagCheck(timestampSchema, cborData)) {
  const decoded = decode(timestampSchema, cborData);
}
```

**Tag 0 – RFC 3339 Date/Time String**

```javascript
const encoder = createEncoder();
const now = new Date('2024-01-15T10:30:00Z');
const encoded = encoder.encode(dateTimeSchema, now);
const result = decode(dateTimeSchema, encoded);
console.log(result.toISOString()); // "2024-01-15T10:30:00.000Z"
```

**Tag 1 – Epoch-based Date/Time**

```javascript
const encoder = createEncoder();
const now = new Date();
const encoded = encoder.encode(timestampSchema, now);
const result = decode(timestampSchema, encoded);
console.log(result.toISOString()); // Current time as Date object
```

**IANA CBOR Tags Registry**

This library implements the tag mechanism but does not provide built-in handlers for standard tags. You can implement any tag from the [IANA CBOR Tags Registry](https://www.iana.org/assignments/cbor-tags/cbor-tags.xhtml) by providing custom `encode` and `decode` functions. Common tags include:

- `0` – RFC 3339 date/time string
- `1` – Epoch-based date/time (integer or float)
- `32` – URI
- `36` – MIME message
- `37` – Binary UUID

## TypeScript Notes

`InferValue` can be used to derive a value type from a schema:

```typescript
import { map, text, integer, InferValue, createEncoder } from 'typed-cbor';

const userSchema = map({
  name: text(),
  age: integer(),
});

type User = InferValue<typeof userSchema>;

const encoder = createEncoder();
const user: User = { name: 'Bob', age: 30n };
const encoded = encoder.encode(userSchema, user);
```

Note: runtime validation is authoritative. Depending on TypeScript configuration and declaration-generation details, inferred editor types may be less strict than runtime checks.

## Encoding and Decoding Behavior

- `createEncoder()` returns a reusable encoder instance.
- The internal buffer grows when needed and is reused between calls.
- `decode(shape, cbor)` fully decodes one CBOR item and rejects trailing bytes.
- Decoding validates the result against the given schema and throws on mismatch.

## Supported CBOR Major Types

| Major Type | Support | Details |
|-----------|---------|---------|
| 0 | Yes | Unsigned integers |
| 1 | Yes | Negative integers |
| 2 | Yes | Byte strings |
| 3 | Yes | Text strings (UTF-8) |
| 4 | Yes | Arrays |
| 5 | Yes | Maps |
| 6 | Partial | User-provided encode/decode handlers only |
| 7 | Yes | booleans, null, undefined, floats |

## Important Limitations

- No indefinite-length (streaming) items.
- Map keys must decode to strings.
- Integer encoding is limited to CBOR uint64 payload size; encodable bigint range is `[-18446744073709551616, 18446744073709551615]`.
- `float()` rejects `NaN`, `Infinity`, and `-Infinity` during encoding.
- Standard CBOR tags are not implemented – users must provide their own encode/decode handlers.

## Error Handling

Both encode and decode throw `Error` instances for invalid input, including:

- Type mismatches against schema
- Truncated or malformed CBOR data
- Duplicate keys in CBOR maps
- Extra bytes after a decoded value

## Development

### Build

```bash
npm run build
```

Generates declaration files into `types/` from JSDoc annotations.

### Test

```bash
npm test
```

Runs the Node.js test suite in `lib/cbor.test.js`.

## License

MIT © Faisal Hakim