// @ts-check

import { equal } from 'node:assert/strict';
import { transform, tag, integer, text, createEncoder, decode, map } from '../lib/cbor.js';

const cbor = createEncoder();

// Tag 0 – RFC 3339 date/time string
const DateTimeShape = tag(0n, transform(
  text(),
  value => new Date(value),
  value => value.toString(),
));

const dateTimeCbor = cbor.encode(DateTimeShape, new Date());
const dateTime = decode(DateTimeShape, dateTimeCbor);
equal(dateTime instanceof Date, true, 'shall be Date');

// Tag 1 – Epoch-based date/time (seconds)
const TimestampShape = tag(1n, transform(
  integer(),
  value => new Date(Number(value) * 1000),
  value => BigInt(Math.floor(value.getTime() / 1000)),
));

const timestampCbor = cbor.encode(TimestampShape, new Date());
const timestamp = decode(TimestampShape, timestampCbor);
equal(timestamp instanceof Date, true, 'shall be Date');

// App level custom tags

const SquareShape = tag(10001n, map({
  height: integer(),
  width: integer(),
}));
const squareCbor = cbor.encode(SquareShape, {
  height: 1n,
  width: 1n,
});
const square = decode(SquareShape, squareCbor);
square.height;

const QubeShape = tag(10002n, map({
  size: integer(),
}));
const qubeCbor = cbor.encode(QubeShape, { size: 2n });
const qube = decode(QubeShape, qubeCbor);
qube.size;

class Coordinate {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

const CoordinateShape = tag(
  10003n,
  transform(
    map({ x: integer(), y: integer() }),
    function decode(obj) {
      return new Coordinate(Number(obj.x), Number(obj.y));
    },
    function encode(coordinate) {
      return { x: BigInt(coordinate.x), y: BigInt(coordinate.y) };
    },
  ),
);
const coordinateCbor = cbor.encode(CoordinateShape, new Coordinate(100, 200));
const coordinate = decode(CoordinateShape, coordinateCbor);
coordinate.x;
coordinate.y;
