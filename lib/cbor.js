/**
 * CBOR (Concise Binary Object Representation) implementation for JavaScript.
 * - Provides functions to encode and decode data in the CBOR format.
 * - Supports CBOR major types: integers, bytes, text, arrays, maps, and simple values.
 * - Does not support tag, NaN, Infinity, and streaming indefinite-length items.
 * - Map keys are limited to unique strings, no other types are allowed as keys.
 * - Designed to be efficient and semi-compliant with the CBOR specification (RFC 8949).
 * - Focus on browser-first environments, no external dependencies, and minimal memory usage.
 * - Schema-first approach to ensure type safety and validation during encoding and decoding.
 */

// CBOR Major Types
const MAJOR_POSITIVE = /** @type {const} */ (0);
const MAJOR_NEGATIVE = /** @type {const} */ (1);
const MAJOR_BYTE = /** @type {const} */ (2);
const MAJOR_TEXT = /** @type {const} */ (3);
const MAJOR_ARRAY = /** @type {const} */ (4);
const MAJOR_MAP = /** @type {const} */ (5);
// const MAJOR_TAG = /** @type {const} */ (6); (UNSUPPORTED)
const MAJOR_SIMPLE = /** @type {const} */ (7);

// CBOR Additional Information
const INFO_FALSE = 20;
const INFO_TRUE = 21;
const INFO_NULL = 22;
const INFO_UNDEFINED = 23;
const INFO_1_BYTE = 24;
const INFO_2_BYTES = 25;
const INFO_4_BYTES = 26;
const INFO_8_BYTES = 27;
// const INFO_INDEFINITE = 31; (UNSUPPORTED)

// Schema Types
const SHAPE_INTEGER = Symbol('Integer');
const SHAPE_BYTES = Symbol('Bytes');
const SHAPE_TEXT = Symbol('Text');
const SHAPE_ARRAY = Symbol('Array');
const SHAPE_MAP = Symbol('Map');
const SHAPE_BOOLEAN = Symbol('Boolean');
const SHAPE_NIL = Symbol('Nil');
const SHAPE_UNDEFINED = Symbol('Undefined');
const SHAPE_FLOAT = Symbol('Float');
const SHAPE_ONE_OF = Symbol('OneOf');

// Primitive Shapes
/** @typedef {{ type: SHAPE_INTEGER }} IntegerShape */
/** @typedef {{ type: SHAPE_BYTES }} BytesShape */
/** @typedef {{ type: SHAPE_TEXT }} TextShape */
/** @typedef {{ type: SHAPE_BOOLEAN }} BooleanShape */
/** @typedef {{ type: SHAPE_NIL }} NilShape */
/** @typedef {{ type: SHAPE_UNDEFINED }} UndefShape */
/** @typedef {{ type: SHAPE_FLOAT }} FloatShape */

/** @typedef {IntegerShape | BytesShape | TextShape | BooleanShape | NilShape | UndefShape | FloatShape} PrimitiveShape */

// Composite Shapes
/**
 * @template ItemShape
 * @typedef {{ type: SHAPE_ARRAY, items: ItemShape }} ArrayShape
 */

/**
 * @template {Record<string, unknown>} Properties
 * @typedef {{ type: SHAPE_MAP, properties: Properties }} MapShape
 */

/**
 * @template Vairants
 * @typedef {{ type: SHAPE_ONE_OF, variants: Vairants }} OneOfShape
 */

/** @typedef {PrimitiveShape | ArrayShape<unknown> | MapShape<Record<string, unknown>> | OneOfShape<unknown[]>} Shape */

/**
 * @template S
 * @typedef {S extends unknown ? InferLeafInternal<S> : never} InferLeaf
 */

/**
 * @template S
 * @typedef {( 
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown
 * )} InferLeafInternal
 */

/**
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] :
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]> } :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown
 * )} InferShallowInternal
 */

/**
 * @template S
 * @typedef {S extends unknown ? InferShallowInternal<S> : never} InferShallow
 */

/**
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferShallow<ItemShape>[] :
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferShallow<Properties[K]> } :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : unknown
 * )} InferValueInternal
 */

/**
 * @template S
 * @typedef {S extends unknown ? InferValueInternal<S> : never} InferValue
 */

/** @returns {IntegerShape} */ export function integer() { return { type: SHAPE_INTEGER }; }
/** @returns {BytesShape} */ export function bytes() { return { type: SHAPE_BYTES }; }
/** @returns {TextShape} */ export function text() { return { type: SHAPE_TEXT }; }
/** @returns {BooleanShape} */ export function boolean() { return { type: SHAPE_BOOLEAN }; }
/** @returns {NilShape} */ export function nil() { return { type: SHAPE_NIL }; }
/** @returns {UndefShape} */ export function undef() { return { type: SHAPE_UNDEFINED }; }
/** @returns {FloatShape} */ export function float() { return { type: SHAPE_FLOAT }; }

/**
 * @template ItemShape
 * @param {ItemShape} items
 * @returns {ArrayShape<ItemShape>}
 */
export function array(items) {
  return { type: SHAPE_ARRAY, items };
}

/**
 * @template {Record<string, Shape>} Properties
 * @param {Properties} properties
 * @returns {MapShape<Properties>}
 */
export function map(properties) {
  return { type: SHAPE_MAP, properties };
}

/**
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export function oneOf(...variants) { return { type: SHAPE_ONE_OF, variants: /** @type {Variants} */ (variants) }; }

/**
 * @param {Shape} shape
 * @param {unknown} value
 * @returns {boolean}
 */
function typeCheck(shape, value) {
  switch (shape.type) {
    case SHAPE_INTEGER: return typeof value === 'bigint';
    case SHAPE_TEXT: return typeof value === 'string';
    case SHAPE_BYTES: return value instanceof Uint8Array;
    case SHAPE_BOOLEAN: return typeof value === 'boolean';
    case SHAPE_NIL: return value === null;
    case SHAPE_UNDEFINED: return value === undefined;
    case SHAPE_FLOAT: return typeof value === 'number';
    case SHAPE_ARRAY:
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!typeCheck(/** @type {any} */(shape.items), item)) return false;
        }
        return true;
      }
      else return false;
    case SHAPE_MAP:
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        for (const key in shape.properties) {
          if (!typeCheck(
            /** @type {any} */(shape.properties)[key],
            /** @type {any} */(value)[key],
          )) return false;
        }
        // For forward-compatibility, we allow extra keys in the value that are not defined in the shape.
        return true;
      }
      else return false;
    case SHAPE_ONE_OF:
      if ('variants' in shape) for (const variant of shape.variants) {
        if (typeCheck(
          /** @type {any} */(variant),
          value,
        )) return true;
      }
      return false;

    default: throw new Error(`Unknown shape type: ${/** @type {any} */ (shape)?.type}`);
  }
}

export function createEncoder() {
  // Encoder state: reusable write buffer shared across encode calls
  let buff = new Uint8Array(256);
  let view = new DataView(buff.buffer);
  let offset = 0;

  const textEncoder = new TextEncoder();

  /** @param {number} bytesNeeded */
  function capacity(bytesNeeded) {
    const required = offset + bytesNeeded;
    if (required <= buff.length) return;
    let newLength = buff.length;
    while (newLength < required) newLength <<= 1;
    const grown = new Uint8Array(newLength);
    grown.set(buff.subarray(0, offset));
    buff = grown;
    view = new DataView(buff.buffer);
  }

  /**
   * @param {number} major
   * @param {number} length
   * @returns {void}
   */
  function writeSizedHead(major, length) {
    if (length < 24) {
      capacity(1);
      view.setUint8(offset, (major << 5) | length); offset += 1;
    }
    else if (length <= 0xFF) {
      capacity(1 + 1);
      view.setUint8(offset, (major << 5) | INFO_1_BYTE); offset += 1;
      view.setUint8(offset, length); offset += 1;
    }
    else if (length <= 0xFFFF) {
      capacity(1 + 2);
      view.setUint8(offset, (major << 5) | INFO_2_BYTES); offset += 1;
      view.setUint16(offset, length, false); offset += 2;
    }
    else if (length <= 0xFFFFFFFF) {
      capacity(1 + 4);
      view.setUint8(offset, (major << 5) | INFO_4_BYTES); offset += 1;
      view.setUint32(offset, length, false); offset += 4;
    }
    else if (BigInt(length) <= 0xFFFFFFFFFFFFFFFFn) {
      capacity(1 + 8);
      view.setUint8(offset, (major << 5) | INFO_8_BYTES); offset += 1;
      view.setBigUint64(offset, BigInt(length), false); offset += 8;
    }
    else throw new Error(`Data length of ${length} is too large to encode in CBOR (max ${0xFFFFFFFFFFFFFFFFn} bytes)`);
  }

  /**
   * @param {Shape} shape
   * @param {unknown} value
   */
  function write(shape, value) {
    switch (shape.type) {
      case SHAPE_INTEGER:
        if (typeof value === 'bigint') {
          let int = value; // reassign to fix typing issues

          const isNegative = int < 0n;
          const major = isNegative ? MAJOR_NEGATIVE : MAJOR_POSITIVE;

          // Align the negative integer to the CBOR encoding scheme (N = -1 - value)
          if (isNegative) int = -1n - int;

          // Can be stored directly in the additional information
          if (int < 24n) {
            capacity(1);
            view.setUint8(offset, (major << 5) | Number(int)); offset += 1;
          }
          else if (int <= 0xFFn) {
            capacity(1 + 1);
            view.setUint8(offset, (major << 5) | INFO_1_BYTE); offset += 1;
            view.setUint8(offset, Number(int)); offset += 1;
          }
          else if (int <= 0xFFFFn) {
            capacity(1 + 2);
            view.setUint8(offset, (major << 5) | INFO_2_BYTES); offset += 1;
            view.setUint16(offset, Number(int), false); offset += 2;
          }
          else if (int <= 0xFFFFFFFFn) {
            capacity(1 + 4);
            view.setUint8(offset, (major << 5) | INFO_4_BYTES); offset += 1;
            view.setUint32(offset, Number(int), false); offset += 4;
          }
          else if (int <= 0xFFFFFFFFFFFFFFFFn) {
            capacity(1 + 8);
            view.setUint8(offset, (major << 5) | INFO_8_BYTES); offset += 1;
            view.setBigUint64(offset, int, false); offset += 8;
          }
          else {
            throw new Error(`BigInt larger than 64 bits are not supported.`);
          }
        }
        else throw new Error(`Expected integer, got ${typeof value}`);
        break;

      case SHAPE_TEXT:
        if (typeof value === 'string') {
          const encoded = textEncoder.encode(value);
          writeSizedHead(MAJOR_TEXT, encoded.length);
          capacity(encoded.length);
          buff.set(encoded, offset); offset += encoded.length;
        }
        else throw new Error(`Expected text, got ${typeof value}`);
        break;

      case SHAPE_BYTES:
        if (value instanceof Uint8Array) {
          writeSizedHead(MAJOR_BYTE, value.length);
          capacity(value.length);
          buff.set(value, offset); offset += value.length;
        }
        else throw new Error(`Expected bytes, got ${typeof value}`);
        break;

      case SHAPE_BOOLEAN:
        if (typeof value === 'boolean') {
          capacity(1);
          view.setUint8(offset, (MAJOR_SIMPLE << 5) | (value === true ? INFO_TRUE : INFO_FALSE)); offset += 1;
        }
        else throw new Error(`Expected boolean, got ${typeof value}`);
        break;

      case SHAPE_NIL:
        if (value === null) {
          capacity(1);
          view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_NULL); offset += 1;
        }
        else throw new Error(`Expected null, got ${typeof value}`);
        break;

      case SHAPE_UNDEFINED:
        if (value === undefined) {
          capacity(1);
          view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_UNDEFINED); offset += 1;
        }
        else throw new Error(`Expected undefined, got ${typeof value}`);
        break;

      case SHAPE_FLOAT:
        if (typeof value === 'number') {
          if (Number.isNaN(value) || !Number.isFinite(value)) {
            throw new Error('NaN and Infinity are not supported');
          }

          // We use trial error to determine the floating-point size.
          capacity(1 + 8);
          const valueOffset = 1 + offset;

          // Skip for browser compatibility is still low
          // view.setFloat16(valueOffset, value, false);
          // if (view.getFloat16(valueOffset, false) === value) {
          //   view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_2_BYTES); offset += 1;
          //   offset += 2;
          //   break;
          // }

          view.setFloat32(valueOffset, value, false);
          if (view.getFloat32(valueOffset, false) === value) {
            view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_4_BYTES); offset += 1;
            offset += 4;
            break;
          }

          view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_8_BYTES); offset += 1;
          view.setFloat64(offset, value, false); offset += 8;
        }
        else throw new Error(`Expected float, got ${typeof value}`);
        break;

      case SHAPE_ARRAY:
        if (Array.isArray(value)) {
          writeSizedHead(MAJOR_ARRAY, value.length);
          for (const item of value) {
            write(/** @type {any} */(shape.items), item);
          }
        }
        else throw new Error(`Expected array, got ${typeof value}`);
        break;

      case SHAPE_MAP:
        if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(/** @type {any} */(shape.properties));
          writeSizedHead(MAJOR_MAP, keys.length);
          for (const key of keys) {
            write({ type: SHAPE_TEXT }, key);
            write(
              /** @type {any} */(shape.properties)[key],
              /** @type {any} */(value)[key],
            );
          }
        }
        else throw new Error(`Expected map, got ${typeof value}`);
        break;

      case SHAPE_ONE_OF:
        if ('variants' in shape) {
          let matched = false;
          for (const variant of shape.variants) {
            if (typeCheck(/** @type {any} */(variant), value)) {
              write(/** @type {any} */(variant), value);
              matched = true;
              break;
            }
          }
          if (!matched) throw new Error(`Value does not match any variant in oneOf`);
        }
        else throw new Error(`Invalid oneOf shape, missing variants`);
        break;

      default:
        throw new Error(`Unknown shape type: ${/** @type {any} */ (shape)?.type}`);
    }
  }

  /**
   * @template {Shape} S
   * @param {S} shape
   * @param {InferValue<S>} value
   * @returns {Uint8Array}
   */
  function encode(shape, value) {
    offset = 0;
    write(shape, value);
    const cbor = buff.slice(0, offset);
    // We could reset the buffer here to save memory, but it would be less efficient because of memory allocations on subsequent encodes. Instead, we just keep the buffer around and reuse it for the next encode call. The buffer will grow as needed, but it will never shrink, so it will only use as much memory as the largest encoded value. If we wanted to implement a reset function, we could just set offset = 0 and optionally clear the buffer if we want to free memory, but it's not strictly necessary.
    // buff = new Uint8Array(256);
    // view = new DataView(buff.buffer);
    // offset = 0;
    return cbor;
  }

  return { encode };
}

const textDecoder = new TextDecoder();

/**
 * @template {Shape} S
 * @param {S} shape
 * @param {Uint8Array} cbor
 * @returns {InferValue<S>}
 */
export function decode(shape, cbor) {
  const view = new DataView(cbor.buffer, cbor.byteOffset, cbor.byteLength);
  let offset = 0;

  /** @param {number} info */
  function takeSize(info) {
    let size = 0;
    if (info < 24) size = info;
    else switch (info) {
      case INFO_1_BYTE: size = view.getUint8(offset); offset += 1; break;
      case INFO_2_BYTES: size = view.getUint16(offset, false); offset += 2; break;
      case INFO_4_BYTES: size = view.getUint32(offset, false); offset += 4; break;
      case INFO_8_BYTES:
        const bigSize = view.getBigUint64(offset, false);
        if (bigSize > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error(`Data size of ${bigSize} is too large to decode in CBOR (max ${Number.MAX_SAFE_INTEGER})`);
        }
        size = Number(bigSize);
        offset += 8;
        break;
      default: throw new Error(`Invalid additional information in CBOR head: ${info}`);
    }
    return size;
  }

  function read() {
    if (offset >= view.byteLength) throw new Error(`Unexpected end of CBOR data`);

    const head = view.getUint8(offset); offset += 1;
    const major = head >> 5;
    const info = head & 0x1F;

    /** @type {any} */
    let value;
    switch (major) {
      case MAJOR_POSITIVE:
      case MAJOR_NEGATIVE:
        if (info < 24) value = BigInt(info);
        else if (info === INFO_1_BYTE) { value = BigInt(view.getUint8(offset)); offset += 1; }
        else if (info === INFO_2_BYTES) { value = BigInt(view.getUint16(offset, false)); offset += 2; }
        else if (info === INFO_4_BYTES) { value = BigInt(view.getUint32(offset, false)); offset += 4; }
        else if (info === INFO_8_BYTES) { value = view.getBigUint64(offset, false); offset += 8; }
        else throw new Error(`Invalid additional information for positive integer major type: ${info}`);
        // Convert from CBOR's negative integer encoding scheme to JavaScript's signed integers
        if (major === MAJOR_NEGATIVE) value = -1n - value;
        break;

      case MAJOR_BYTE:
        const bytesSize = takeSize(info);
        value = cbor.slice(offset, offset + bytesSize);
        offset += bytesSize;
        break;

      case MAJOR_TEXT:
        const textSize = takeSize(info);
        const textBytes = new Uint8Array(view.buffer, view.byteOffset + offset, textSize); offset += textSize;
        value = textDecoder.decode(textBytes);
        break;

      case MAJOR_SIMPLE:
        switch (info) {
          case INFO_FALSE: value = false; break;
          case INFO_TRUE: value = true; break;
          case INFO_NULL: value = null; break;
          case INFO_UNDEFINED: value = undefined; break;
          case INFO_2_BYTES: value = view.getFloat16(offset, false); offset += 2; break;
          case INFO_4_BYTES: value = view.getFloat32(offset, false); offset += 4; break;
          case INFO_8_BYTES: value = view.getFloat64(offset, false); offset += 8; break;
          default: throw new Error(`Invalid additional information for simple value major type: ${info}`);
        }
        break;

      case MAJOR_ARRAY:
        const arraySize = takeSize(info);
        value = [];
        for (let index = 0; index < arraySize; index++) value.push(read());
        break;

      case MAJOR_MAP:
        const mapSize = takeSize(info);
        value = {};
        for (let index = 0; index < mapSize; index++) {
          const key = read();
          if (typeof key === 'string') {
            if (key in value) throw new Error(`Duplicate map keys are not supported.`);
            value[key] = read();
          }
          else throw new Error(`Expected string keys in CBOR map, got ${typeof key}`);
        }
        break;

      default:
        throw new Error(`Unsupported CBOR major type: ${major}`);
    }

    return value;
  }

  const value = read();

  if (offset < view.byteLength) {
    throw new Error(`Extra data found after decoding CBOR value, offset ${offset} of ${view.byteLength}`);
  }

  if (!typeCheck(shape, value)) {
    throw new Error(`Decoded value does not match the provided shape`);
  }

  return value;
}
