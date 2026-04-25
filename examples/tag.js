// @ts-check

import { tag, integer, text, createEncoder } from '../lib/cbor.js';

const cbor = createEncoder();

// Tag 0 – RFC 3339 date/time string
const DateTimeShape = tag(0n, text(), {
  /** @param {Date} value */
  encode(value) { return value.toISOString() },
  decode(value) { return new Date(value) },
});

cbor.encode(DateTimeShape, new Date());

// Tag 1 – Epoch-based date/time (seconds)
const TimestampShape = tag(1n, integer(), {
  /** @param {Date} value */
  encode(value) { return BigInt(Math.floor(value.getTime() / 1000)); },
  decode(value) { return new Date(Number(value) * 1000); },
});

cbor.encode(TimestampShape, new Date());
