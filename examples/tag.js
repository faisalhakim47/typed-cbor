// @ts-check

import { equal } from 'node:assert/strict';
import {
  transform, tag, integer, text, encode, decode, dict, Dict, constant,
} from '../lib/cbor.js';


// Tag 0 – RFC 3339 date/time string
const DateTimeShape = tag(0n, transform(
  text(),
  value => new Date(value),
  value => value.toString(),
));

const dateTimeCbor = encode(DateTimeShape, new Date());
const dateTime = decode(DateTimeShape, dateTimeCbor);
equal(dateTime instanceof Date, true, 'shall be Date');

// Tag 1 – Epoch-based date/time (seconds)
const TimestampShape = tag(1n, transform(
  integer(),
  value => new Date(Number(value) * 1000),
  value => BigInt(Math.floor(value.getTime() / 1000)),
));

const timestampCbor = encode(TimestampShape, new Date());
const timestamp = decode(TimestampShape, timestampCbor);
equal(timestamp instanceof Date, true, 'shall be Date');

// App level custom tags

const SquareShape = tag(10001n, dict(
  [constant('height'), integer()],
  [constant('width'), integer()],
));
const squareCbor = encode(SquareShape, [
  ['height', 1n],
  ['width', 1n],
]);
const square = decode(SquareShape, squareCbor);
square.get('height');

const QubeShape = tag(10002n, dict(
  [constant('size'), integer()],
));
const qubeCbor = encode(QubeShape, [['size', 2n]]);
const qube = decode(QubeShape, qubeCbor);
qube.get('size');

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
    dict(
      [constant('x'), integer()],
      [constant('y'), integer()],
    ),
    function decode(obj) {
      return new Coordinate(Number(obj.get('x')), Number(obj.get('y')));
    },
    function encode(coordinate) {
      return new Dict([
        ['x', BigInt(coordinate.x)],
        ['y', BigInt(coordinate.y)],
      ]);
    },
  ),
);
const coordinateCbor = encode(CoordinateShape, new Coordinate(100, 200));
const coordinate = decode(CoordinateShape, coordinateCbor);
coordinate.x;
coordinate.y;
