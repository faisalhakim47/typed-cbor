import {
  array, boolean, bytes, constant, encode, decode, dict,
  float, integer, nil, oneOf, text, typeCheck,
} from '../lib/cbor.js';

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

const sqlQueryCbor = encode(sqlQueryShape, [
  ['sql', 'SELECT * FROM users WHERE id = ?'],
  ['params', [123n]],
]);

// Transfer sqlQueryCbor to another system

const sqlQuery = decode(sqlQueryShape, sqlQueryCbor);

console.log(sqlQuery.get('sql')); // 'SELECT * FROM users WHERE id = ?'

/** @type {unknown} */
let unknownSqlQuery = undefined;

if (typeCheck(sqlQueryShape, unknownSqlQuery)) {
  // this should be typed as Dict<[[ConstShape<'sql'>, TextShape], [ConstShape<'params'>, ArrayShape<OneOfShape<...>>>]]>
  unknownSqlQuery;
}
