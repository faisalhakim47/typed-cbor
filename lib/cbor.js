/**
 * CBOR (Concise Binary Object Representation) implementation for JavaScript.
 * - Provides functions to encode and decode data in the CBOR format.
 * - Supports CBOR major types: integers, bytes, text, arrays, maps, and simple values.
 * - Parital support for tag.
 * - Does not support NaN, Infinity, and streaming indefinite-length items.
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
const MAJOR_TAG = /** @type {const} */ (6); // Partially supported. Act like plugin. User must implement their own handler. Does not implement any tag discribed in CBOR Tags Registry.
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
const SHAPE_TAG = Symbol('Tag');
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
 * @template ValueShape
 * @template JSValue
 * @typedef {{ type: SHAPE_TAG, tag: bigint, value: ValueShape, encode: (value: JSValue) => unknown, decode: (value: InferValue<ValueShape>) => JSValue }} TagShape
 */

/**
 * @template Vairants
 * @typedef {{ type: SHAPE_ONE_OF, variants: Vairants }} OneOfShape
 */

/** @typedef {PrimitiveShape | ArrayShape<unknown> | MapShape<Record<string, unknown>> | TagShape<unknown, unknown> | OneOfShape<unknown[]>} Shape */

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
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]> } :
 *   S extends TagShape<infer ValueShape, unknown> ? InferLeaf<ValueShape> :
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
 *   S extends TagShape<infer ValueShape, unknown> ? InferLeaf<ValueShape> :
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
 *   S extends TagShape<infer ValueShape, unknown> ? InferLeaf<ValueShape> :
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
 * @template ValueShape
 * @template JSValue
 * @param {bigint} tag
 * @param {ValueShape} value
 * @param {{ encode: (value: JSValue) => unknown, decode: (value: InferValue<ValueShape>) => JSValue }} options
 * @returns {TagShape<ValueShape, JSValue>}
 */
export function tag(tag, value, options) {
  return {
    type: SHAPE_TAG,
    tag,
    value,
    ...options,
  };
}

/**
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export function oneOf(...variants) { return { type: SHAPE_ONE_OF, variants: /** @type {Variants} */ (variants) }; }

/**
 * @template {Shape} S
 * @param {S} shape
 * @param {unknown} value
 * @returns {value is InferValue<S>}
 */
export function typeCheck(shape, value) {
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
    case SHAPE_TAG:
      return typeCheck(/** @type {Shape} */(shape.value), shape.encode(value));
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

/**
 * @param {Uint8Array} cbor
 */
export function readTag(cbor) {
  const view = new DataView(cbor.buffer, cbor.byteOffset, cbor.byteLength);
  let offset = 0;

  const head = view.getUint8(offset); offset += 1;
  const major = head >> 5;
  const info = head & 0x1F;

  if (major === MAJOR_TAG) {
    /** @type {bigint} */
    let tag;
    if (info < 24) tag = BigInt(info);
    else if (info === INFO_1_BYTE) { tag = BigInt(view.getUint8(offset)); offset += 1; }
    else if (info === INFO_2_BYTES) { tag = BigInt(view.getUint16(offset, false)); offset += 2; }
    else if (info === INFO_4_BYTES) { tag = BigInt(view.getUint32(offset, false)); offset += 4; }
    else if (info === INFO_8_BYTES) { tag = view.getBigUint64(offset, false); offset += 8; }
    else throw new Error(`Invalid additional information for positive integer major type: ${info}`);
    return tag;
  }
  else throw new Error(`Expected Tagged CBOR data major type. Got ${major} major type instead.`);
}

/**
 * @param {TagShape<unknown, unknown>} shape
 * @param {Uint8Array} cbor
 */
export function tagCheck(shape, cbor) {
  const tag = readTag(cbor);
  return tag === shape.tag;
}

export function createEncoder() {
  // Encoder state: reusable write buffer shared across encode calls
  let u8a = new Uint8Array(256);
  let view = new DataView(u8a.buffer);
  let offset = 0;

  const textEncoder = new TextEncoder();

  /** @param {number} bytesNeeded */
  function capacity(bytesNeeded) {
    const required = offset + bytesNeeded;
    if (required <= u8a.length) return;
    let newLength = u8a.length;
    while (newLength < required) newLength <<= 1;
    const grown = new Uint8Array(newLength);
    grown.set(u8a.subarray(0, offset));
    u8a = grown;
    view = new DataView(u8a.buffer);
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
   * @param {number} major
   * @param {bigint} value
   */
  function writeInt(major, value) {
    // Can be stored directly in the additional information
    if (value < 24n) {
      capacity(1);
      view.setUint8(offset, (major << 5) | Number(value)); offset += 1;
    }
    else if (value <= 0xFFn) {
      capacity(1 + 1);
      view.setUint8(offset, (major << 5) | INFO_1_BYTE); offset += 1;
      view.setUint8(offset, Number(value)); offset += 1;
    }
    else if (value <= 0xFFFFn) {
      capacity(1 + 2);
      view.setUint8(offset, (major << 5) | INFO_2_BYTES); offset += 1;
      view.setUint16(offset, Number(value), false); offset += 2;
    }
    else if (value <= 0xFFFFFFFFn) {
      capacity(1 + 4);
      view.setUint8(offset, (major << 5) | INFO_4_BYTES); offset += 1;
      view.setUint32(offset, Number(value), false); offset += 4;
    }
    else if (value <= 0xFFFFFFFFFFFFFFFFn) {
      capacity(1 + 8);
      view.setUint8(offset, (major << 5) | INFO_8_BYTES); offset += 1;
      view.setBigUint64(offset, value, false); offset += 8;
    }
    else throw new Error(`BigInt larger than 64 bits are not supported.`);
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

          writeInt(major, int);
        }
        else throw new Error(`Expected integer, got ${typeof value}`);
        break;

      case SHAPE_TEXT:
        if (typeof value === 'string') {
          const encoded = textEncoder.encode(value);
          writeSizedHead(MAJOR_TEXT, encoded.length);
          capacity(encoded.length);
          u8a.set(encoded, offset); offset += encoded.length;
        }
        else throw new Error(`Expected text, got ${typeof value}`);
        break;

      case SHAPE_BYTES:
        if (value instanceof Uint8Array) {
          writeSizedHead(MAJOR_BYTE, value.length);
          capacity(value.length);
          u8a.set(value, offset); offset += value.length;
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

      case SHAPE_TAG:
        writeInt(MAJOR_TAG, shape.tag);
        write(/** @type {Shape} */(shape.value), shape.encode(value));
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
    const cbor = u8a.slice(0, offset);
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

  /** @param {Shape} [currentShape] */
  function read(currentShape) {
    if (offset >= view.byteLength) throw new Error(`Unexpected end of CBOR data`);

    const head = view.getUint8(offset); offset += 1;
    const major = head >> 5;
    const info = head & 0x1F;

    function readInt() {
      /** @type {bigint} */
      let int;
      if (info < 24) int = BigInt(info);
      else if (info === INFO_1_BYTE) { int = BigInt(view.getUint8(offset)); offset += 1; }
      else if (info === INFO_2_BYTES) { int = BigInt(view.getUint16(offset, false)); offset += 2; }
      else if (info === INFO_4_BYTES) { int = BigInt(view.getUint32(offset, false)); offset += 4; }
      else if (info === INFO_8_BYTES) { int = view.getBigUint64(offset, false); offset += 8; }
      else throw new Error(`Invalid additional information for positive integer major type: ${info}`);
      return int;
    }

    /** @type {any} */
    let value;
    switch (major) {
      case MAJOR_POSITIVE:
      case MAJOR_NEGATIVE:
        value = readInt();
        // Convert from CBOR's negative integer encoding scheme to JavaScript's signed integers
        if (major === MAJOR_NEGATIVE) value = -1n - value;
        break;

      case MAJOR_BYTE:
        const bytesSize = takeSize(info);
        value = cbor.subarray(offset, offset + bytesSize);
        offset += bytesSize;
        break;

      case MAJOR_TEXT:
        const textLength = takeSize(info);
        const textBytes = new Uint8Array(view.buffer, view.byteOffset + offset, textLength); offset += textLength;
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
        const arrayShape = currentShape?.type === SHAPE_ARRAY ? currentShape.items : null;
        value = [];
        for (let index = 0; index < arraySize; index++) value.push(read(/** @type {any} */(arrayShape)));
        break;

      case MAJOR_MAP:
        const mapSize = takeSize(info);
        const mapShape = currentShape?.type === SHAPE_MAP ? currentShape.properties : null;
        value = {};
        for (let index = 0; index < mapSize; index++) {
          const key = read();
          if (typeof key === 'string') {
            if (key in value) throw new Error(`Duplicate map keys are not supported.`);
            const propShape = mapShape ? mapShape[key] : null;
            value[key] = read(/** @type {any} */(propShape));
          }
          else throw new Error(`Expected string keys in CBOR map, got ${typeof key}`);
        }
        break;

      case MAJOR_TAG:
        const tagShape = currentShape?.type === SHAPE_TAG ? currentShape : null;
        const tag = readInt();
        if (tagShape && tagShape.tag === tag) value = tagShape.decode(read(/** @type {any} */(tagShape.value)));
        else if (!tagShape) value = read();
        else throw new Error(`Expect Tag to be ${tagShape.tag}, got ${tag} instead.`);
        break;

      default:
        throw new Error(`Unsupported CBOR major type: ${major}`);
    }

    return value;
  }

  const value = read(shape);

  if (offset < view.byteLength) {
    throw new Error(`Extra data found after decoding CBOR value, offset ${offset} of ${view.byteLength}`);
  }

  if (!typeCheck(shape, value)) {
    throw new Error(`Decoded value does not match the provided shape`);
  }

  return value;
}
