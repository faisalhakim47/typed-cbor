// @ts-check

import { tag, dict, constant, integer, text, tagCheck, encode, decode } from '../lib/cbor.js';

const AuthShape = tag(10001n, dict(
  [constant('username'), text()],
  [constant('password'), text()],
));

const SessionShape = tag(10002n, dict(
  [constant('userId'), integer()],
  [constant('token'), text()],
));

function frontendSendAuth() {
  return encode(AuthShape, [
    ['username', 'admin'],
    ['password', 'admin'],
  ]);
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
    auth.get('username'); // === admin
    // Do some auth...
    return encode(SessionShape, [
      ['userId', 1n],
      ['token', 'somecomplextoken'],
    ]);
  }
  else throw new Error('Unhandled case');
}

const authRequest = frontendSendAuth();
backendHandler(authRequest);
