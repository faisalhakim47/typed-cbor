import { array, boolean, bytes, createEncoder, decode, float, integer, map, nil, oneOf, text } from '../lib/cbor.js';

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

const sqlQueryCbor = encoder.encode(sqlQueryShape, {
  sql: 'SELECT * FROM users WHERE id = ?',
  params: [123n],
});

// Transfer sqlQueryCbor to another system

const sqlQuery = decode(sqlQueryShape, sqlQueryCbor);

console.log(sqlQuery.sql); // 'SELECT * FROM users WHERE id = ?'
