// @ts-check

import { tag, map, integer, text, tagCheck, createEncoder, decode } from '../lib/cbor.js';

const noop = {
  /** @template T @param {T} value */
  encode(value) { return value; },
  /** @template T @param {T} value */
  decode(value) { return value; },
};

const AuthShape = tag(10001n, map({
  username: text(),
  password: text(),
}), noop)

const SessionShape = tag(10002n, map({
  userId: integer(),
  token: text(),
}), noop);

const cbor = createEncoder();

function frontendSendAuth() {
  return cbor.encode(AuthShape, {
    username: 'admin',
    password: 'admin',
  });
}

/**
 * @param {Uint8Array<ArrayBuffer>} authCbor
 */
function backendHandler(authCbor) {
  /**
   * We can detect a type of cbor by reading only few bytes
   */
  if (tagCheck(AuthShape, authCbor)) {
    const auth = decode(AuthShape, authCbor);
    // Do some auth...
    return cbor.encode(SessionShape, {
      userId: 1n,
      token: 'somecomplextoken',
    });
  }
  else throw new Error('Unhandled case');
}

const authRequest = frontendSendAuth();
backendHandler(authRequest);
