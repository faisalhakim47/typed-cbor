/**
 * CBOR (Concise Binary Object Representation) implementation for JavaScript.
 * - Provides functions to encode and decode data in the CBOR format.
 * - Supports CBOR major types: integers, bytes, text, arrays, maps, and simple values.
 * - Partial support for tag.
 * - Does not support NaN, Infinity, and streaming indefinite-length items.
 * - Maps are represented by the Dict class (a Map subclass). Each record pattern in a
 *   dict shape declares a key shape paired with its value shape, so non-string keys
 *   (integers, bytes, booleans, ...) are fully supported. Record-style string-keyed
 *   dicts have a map() shorthand that takes a plain object of shapes.
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
const INFO_FALSE = /** @type {const} */ (20);
const INFO_TRUE = /** @type {const} */ (21);
const INFO_NULL = /** @type {const} */ (22);
const INFO_UNDEFINED = /** @type {const} */ (23);
const INFO_1_BYTE = /** @type {const} */ (24);
const INFO_2_BYTES = /** @type {const} */ (25);
const INFO_4_BYTES = /** @type {const} */ (26);
const INFO_8_BYTES = /** @type {const} */ (27);
// const INFO_INDEFINITE = 31; (UNSUPPORTED)

// Schema Types
const SHAPE_INTEGER = Symbol('Integer');
const SHAPE_BYTES = Symbol('Bytes');
const SHAPE_TEXT = Symbol('Text');
const SHAPE_ARRAY = Symbol('Array');
const SHAPE_DICT = Symbol('Dict');
const SHAPE_TAG = Symbol('Tag');
const SHAPE_BOOLEAN = Symbol('Boolean');
const SHAPE_NIL = Symbol('Nil');
const SHAPE_UNDEF = Symbol('Undef');
const SHAPE_FLOAT = Symbol('Float');
const SHAPE_ONEOF = Symbol('OneOf');
const SHAPE_CONST = Symbol('Const');
const SHAPE_TRANSFORM = Symbol('Transform');

// Primitive Shapes
/** @typedef {{ type: typeof SHAPE_INTEGER }} IntegerShape */
/** @typedef {{ type: typeof SHAPE_BYTES }} BytesShape */
/** @typedef {{ type: typeof SHAPE_TEXT }} TextShape */
/** @typedef {{ type: typeof SHAPE_BOOLEAN }} BooleanShape */
/** @typedef {{ type: typeof SHAPE_NIL }} NilShape */
/** @typedef {{ type: typeof SHAPE_UNDEF }} UndefShape */
/** @typedef {{ type: typeof SHAPE_FLOAT }} FloatShape */

/**
 * @template T
 * @typedef {{ type: typeof SHAPE_CONST, value: T }} ConstShape
 */

/** @typedef {IntegerShape | BytesShape | TextShape | BooleanShape | NilShape | UndefShape | FloatShape} PrimitiveShape */

// Composite Shapes
/**
 * @template ItemShape
 * @typedef {object} ArrayShape
 * @property {typeof SHAPE_ARRAY} type
 * @property {ItemShape} items
 */

/**
 * @template {readonly [unknown, unknown][]} Records
 * @typedef {object} DictShape
 * @property {typeof SHAPE_DICT} type
 * @property {Records} records
 */

/**
 * @template ValueShape
 * @typedef {object} TagShape
 * @property {typeof SHAPE_TAG} type
 * @property {bigint} tag
 * @property {ValueShape} value
 */

/**
 * @template Variants
 * @typedef {object} OneOfShape
 * @property {typeof SHAPE_ONEOF} type
 * @property {Variants} variants
 */

/**
 * @template ValueShape
 * @template JSValue
 * @typedef {object} TransformShape
 * @property {typeof SHAPE_TRANSFORM} type
 * @property {ValueShape} value
 * @property {(value: JSValue) => InferValue<ValueShape>} encode
 * @property {(value: InferValue<ValueShape>) => JSValue} decode
 */

/** @typedef {PrimitiveShape | ArrayShape<unknown> | DictShape<readonly [unknown, unknown][]> | OneOfShape<unknown[]> | ConstShape<unknown> | TagShape<unknown> | TransformShape<any, any>} Shape */

/**
 * @template S
 * @typedef {S extends unknown ? InferLeafInternal<S> : never} InferLeaf
 */

/**
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array<ArrayBuffer> :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] :
 *   S extends DictShape<infer Records> ? Dict<Records> :
 *   S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown :
 *   S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue :
 *   S extends ConstShape<infer Value> ? Value : unknown
 * )} InferLeafInternal
 */

/**
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array<ArrayBuffer> :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] :
 *   S extends DictShape<infer Records> ? Dict<Records> :
 *   S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown :
 *   S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue :
 *   S extends ConstShape<infer Value> ? Value : unknown
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
 *   S extends BytesShape ? Uint8Array<ArrayBuffer> :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? InferShallow<ItemShape>[] :
 *   S extends DictShape<infer Records> ? Dict<Records> :
 *   S extends TagShape<infer ValueShape> ? InferShallow<ValueShape> :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown :
 *   S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue :
 *   S extends ConstShape<infer T> ? T : unknown
 * )} InferValueInternal
 */

/**
 * @template S
 * @typedef {S extends unknown ? InferValueInternal<S> : never} InferValue
 */

/**
 * Map a single [keyShape, valueShape] record pair to the value type paired
 * with the key type K. Declared on naked type parameters so the conditionals
 * distribute over unions: when the record list's element type is a union
 * (map() produces such lists from plain-object fields), each pair is resolved
 * independently and only the matching key's value type survives.
 *
 * @template Record
 * @template K
 * @typedef {(
 *   Record extends [infer KS, infer VS] ?
 *     K extends InferLeaf<KS> ? InferLeaf<VS> : never :
 *     never
 * )} RecordValue
 */

/**
 * Given a dict record list E, resolve the value type paired with the key type K.
 * With disjoint key shapes (enforced by dict()), at most one record matches a
 * concrete key type, so this resolves to that record's value type. Each slot is
 * resolved through RecordValue, so this works for both tuple record lists
 * (dict()) and pair-union lists (map()).
 *
 * @template {readonly [unknown, unknown][]} E
 * @template K
 * @typedef {(
 *   { [I in keyof E]: RecordValue<E[I], K> }[number]
 * )} ValueForRecord
 */

/**
 * Map a single [keyShape, valueShape] record pair to its encoded pair type.
 * Declared on a naked type parameter so the conditional distributes over
 * unions. This keeps per-record pair typing sound when the record list's
 * element type is a union, which is how map() represents plain-object fields.
 *
 * @template Record
 * @typedef {Record extends [infer KS, infer VS] ? [InferLeaf<KS>, EncodePairs<VS>] : never} TypedPair
 */

/**
 * Derive the plain pair-array type corresponding to a dict's record list E.
 * Each slot becomes [keyValueType, valueValueType], so a literal array of
 * [key, value] pairs is checked against the schema at the call site.
 *
 * The value slot recurses through EncodePairs (not EncodeValue): pair values
 * are nested positions where the pair-array form must remain the only
 * array-like alternative (see EncodePairs).
 *
 * @template {readonly [unknown, unknown][]} E
 * @typedef {(
 *   { [I in keyof E]: TypedPair<E[I]> }
 * )} DictPairs
 */

/**
 * Value type accepted at nested positions (inside a dict pair value slot).
 * Structurally identical to EncodeValueInternal except the dict branch accepts
 * ONLY the pair-array form.
 *
 * Rationale: TypeScript only matches an array literal shape-by-shape when every
 * member of its contextual union is array-like. When the Map-shaped Dict<E>
 * alternative is in the union, nested pair-array literals degrade to unshaped
 * element-union arrays and fail to typecheck. Dict *instances* are still
 * accepted at the top level via EncodeValue, so round-tripping decoded values
 * remains supported.
 *
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array<ArrayBuffer> :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? EncodePairs<ItemShape>[] :
 *   S extends DictShape<infer E> ? DictPairs<E> :
 *   S extends TagShape<infer ValueShape> ? EncodePairs<ValueShape> :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? EncodePairs<Variants[number]> : unknown :
 *   S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue :
 *   S extends ConstShape<infer T> ? T : unknown
 * )} EncodePairsInternal
 */

/**
 * @template S
 * @typedef {S extends unknown ? EncodePairsInternal<S> : never} EncodePairs
 */

/**
 * Value type accepted by the encoder for a given shape S. Dict shapes accept
 * either a Dict instance (e.g. produced by decode) or a plain array of paired
 * values, which keeps full type inference without constructing a Dict.
 * The Dict alternative is only available at the top level of the encoded value;
 * nested positions use the pairs-only EncodePairs so that nested pair-array
 * literals keep their tuple inference.
 *
 * @template S
 * @typedef {(
 *   S extends IntegerShape ? bigint :
 *   S extends TextShape ? string :
 *   S extends BytesShape ? Uint8Array<ArrayBuffer> :
 *   S extends BooleanShape ? boolean :
 *   S extends NilShape ? null :
 *   S extends UndefShape ? undefined :
 *   S extends FloatShape ? number :
 *   S extends ArrayShape<infer ItemShape> ? EncodeValue<ItemShape>[] :
 *   S extends DictShape<infer E> ? Dict<E> | DictPairs<E> :
 *   S extends TagShape<infer ValueShape> ? EncodeValue<ValueShape> :
 *   S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? EncodeValue<Variants[number]> : unknown :
 *   S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue :
 *   S extends ConstShape<infer T> ? T : unknown
 * )} EncodeValueInternal
 */

/**
 * @template S
 * @typedef {S extends unknown ? EncodeValueInternal<S> : never} EncodeValue
 */

/** @returns {IntegerShape} */ export function integer() { return { type: SHAPE_INTEGER }; }
/** @returns {BytesShape} */ export function bytes() { return { type: SHAPE_BYTES }; }
/** @returns {TextShape} */ export function text() { return { type: SHAPE_TEXT }; }
/** @returns {BooleanShape} */ export function boolean() { return { type: SHAPE_BOOLEAN }; }
/** @returns {NilShape} */ export function nil() { return { type: SHAPE_NIL }; }
/** @returns {UndefShape} */ export function undef() { return { type: SHAPE_UNDEF }; }
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
 * Structural overlap check between two shapes, used to prove disjointness of
 * dict key shapes. OneOf/Transform/Tag are unwrapped; distinct kinds never
 * overlap; same kind is conservatively treated as overlapping.
 *
 * @param {Shape} a
 * @param {Shape} b
 * @returns {boolean}
 */
function shapesOverlap(a, b) {
  const sa = /** @type {any} */ (a);
  const sb = /** @type {any} */ (b);

  if (sa.type === SHAPE_ONEOF && Array.isArray(sa.variants)) {
    return /** @type {Shape[]} */ (sa.variants).some(v => shapesOverlap(v, b));
  }
  if (sb.type === SHAPE_ONEOF && Array.isArray(sb.variants)) {
    return /** @type {Shape[]} */ (sb.variants).some(v => shapesOverlap(a, v));
  }

  if (sa.type === SHAPE_TRANSFORM) return shapesOverlap(sa.value, b);
  if (sb.type === SHAPE_TRANSFORM) return shapesOverlap(a, sb.value);
  if (sa.type === SHAPE_TAG) return shapesOverlap(sa.value, b);
  if (sb.type === SHAPE_TAG) return shapesOverlap(a, sb.value);

  if (sa.type !== sb.type) return false;
  if (sa.type === SHAPE_CONST) return sa.value === sb.value;

  // Same shape kind otherwise: conservatively treat as overlapping.
  return true;
}

/**
 * Throw if any two dict records share an overlapping key shape. This guarantee
 * is what makes per-key get/set typing sound and runtime key matching unambiguous.
 *
 * @param {readonly [unknown, unknown][]} records
 */
function assertDisjointKeys(records) {
  for (let i = 0; i < records.length; i++) {
    for (let j = i + 1; j < records.length; j++) {
      if (shapesOverlap(
        /** @type {Shape} */(records[i][0]),
        /** @type {Shape} */(records[j][0]),
      )) {
        throw new Error(
          `Dict records ${i} and ${j} share an overlapping key shape; dict requires disjoint key shapes`,
        );
      }
    }
  }
}

/**
 * Create a dict shape from a list of record patterns.
 * Key shapes must be disjoint; this is enforced at construction time.
 *
 * @template {readonly [unknown, unknown][]} Records
 * @param {Records} records
 * @returns {DictShape<Records>}
 */
export function dict(...records) {
  assertDisjointKeys(records);
  return { type: SHAPE_DICT, records };
}

/**
 * Record-style records for map(): a plain object of fields F becomes a list of
 * [constant(key), valueShape] records. The result is an array whose element is
 * the union of the per-key pair tuples (plain-object keys have no meaningful
 * fixed order), which satisfies the dict Records constraint while keeping
 * per-key typing via the distributive pair helpers (see ValueForRecord).
 *
 * @template {Record<string, Shape>} Fields
 * @typedef {{ [K in keyof Fields]: [ConstShape<K & string>, Fields[K]] }[keyof Fields][]} MapRecords
 */

/**
 * Create a record-style dict shape from a plain object whose keys are string
 * literals and whose values are shapes. Sugar for pairing each key with
 * constant(), so `map({ sql: text() })` is equivalent to
 * `dict([constant('sql'), text()])`. Keys of a JS object are always strings
 * (symbol keys are skipped by Object.records), and distinct string keys are
 * disjoint by construction, so dict() construction-time validation still
 * applies. Use dict() directly for non-string or mixed key types.
 *
 * @template {Record<string, Shape>} Fields
 * @param {Fields} fields
 * @returns {DictShape<MapRecords<Fields>>}
 */
export function map(fields) {
  const records = Object.entries(fields).map(
    /** @param {[string, Shape]} entry */
    ([key, shape]) => [constant(key), shape],
  );
  // The declared return type resolves per-key shapes from the fields template,
  // while this runtime construction infers ConstShape<string>; a cast bridges
  // the two without weakening any user-facing typing.
  const shape = dict(.../** @type {any} */ (records));
  return /** @type {DictShape<MapRecords<Fields>>} */ (shape);
}

/**
 * A Map subclass that carries dict record patterns at the type level. The generic
 * parameter E is the list of [keyShape, valueShape] records, which drives
 * per-key typing on get()/set() via RecordValue over E[number]. RecordValue
 * distributes over unions of record pairs, so this works for both tuple record
 * lists (dict()) and pair-union lists (map()'s plain-object fields).
 *
 * @template {readonly [unknown, unknown][]} E
 * @extends {Map<unknown, unknown>}
 */
export class Dict extends Map {
  /**
   * @template const K
   * @param {K} key
   * @returns {RecordValue<E[number], K> | undefined}
   */
  get(key) {
    return /** @type {RecordValue<E[number], K> | undefined} */ (super.get(key));
  }

  /**
   * @template const K
   * @param {K} key
   * @param {RecordValue<E[number], K>} value
   * @returns {this}
   */
  set(key, value) {
    super.set(key, value);
    return this;
  }
}

/**
 * The main purpose for transform is to be combined with tag.
 * Fundamentally, tag only put "label" upon a tagged value.
 * When combined with this transform, we can map from CBOR primitive value to desired Javascript value.
 * 
 * @template ValueShape
 * @template JSValue
 * @param {ValueShape} value
 * @param {(value: InferValue<ValueShape>) => JSValue} decode
 * @param {(value: JSValue) => InferValue<ValueShape>} encode
 * @returns {TransformShape<ValueShape, JSValue>}
 */
export function transform(value, decode, encode) {
  return { type: SHAPE_TRANSFORM, value, decode, encode };
}

/**
 * @template ValueShape
 * @param {bigint} tag
 * @param {ValueShape} value
 * @returns {TagShape<ValueShape>}
 */
export function tag(tag, value) {
  return { type: SHAPE_TAG, tag, value };
}

/**
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export function oneOf(...variants) { return { type: SHAPE_ONEOF, variants: /** @type {Variants} */ (variants) }; }

/**
 * @template const T
 * @param {T} value
 * @returns {ConstShape<T>}
 */
export function constant(value) { return { type: SHAPE_CONST, value }; }

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
    case SHAPE_UNDEF: return value === undefined;
    case SHAPE_FLOAT: return typeof value === 'number';
    case SHAPE_ARRAY:
      if (Array.isArray(value)) {
        for (const item of value) {
          if (!typeCheck(/** @type {any} */(shape.items), item)) return false;
        }
        return true;
      }
      else return false;
    case SHAPE_DICT:
      if (value instanceof Dict) {
        const dictRecords = /** @type {any} */ (shape).records;
        outer:
        for (const [k, v] of value) {
          for (const record of dictRecords) {
            if (typeCheck(record[0], k)) {
              if (!typeCheck(record[1], v)) return false;
              continue outer;
            }
          }
          // No record matched this key.
          return false;
        }
        return true;
      }
      else return false;
    case SHAPE_TAG:
      return typeCheck(/** @type {Shape} */(shape.value), value);
    case SHAPE_ONEOF:
      if ('variants' in shape) for (const variant of shape.variants) {
        if (typeCheck(
          /** @type {any} */(variant),
          value,
        )) return true;
      }
      return false;
    case SHAPE_TRANSFORM:
      return typeCheck(/** @type {Shape} */(shape.value), shape.encode(value));
    case SHAPE_CONST:
      return value === shape.value;

    default: throw new Error(`Unknown shape type: ${/** @type {any} */ (shape)?.type}`);
  }
}

/**
 * @param {Uint8Array<ArrayBuffer>} cbor
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
 * @param {TagShape<unknown>} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
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

      case SHAPE_UNDEF:
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
          // Reserve space for Float64 first (largest case)
          capacity(1 + 8);

          // Try Float32 first
          view.setFloat32(offset + 1, value, false);
          if (view.getFloat32(offset + 1, false) === value) {
            view.setUint8(offset, (MAJOR_SIMPLE << 5) | INFO_4_BYTES); offset += 1;
            offset += 4;
            break;
          }

          // Float32 didn't work, use Float64
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

      case SHAPE_DICT: {
        let dictValue;
        if (value instanceof Dict) dictValue = value;
        else if (Array.isArray(value)) dictValue = new Dict(/** @type {any} */(value));
        else throw new Error(`Expected dict or array of [key, value] pairs, got ${value?.constructor?.name ?? typeof value}`);

        const dictRecords = /** @type {any} */ (shape).records;
        writeSizedHead(MAJOR_MAP, dictValue.size);
        for (const [k, v] of dictValue) {
          let matched = false;
          for (const record of dictRecords) {
            if (typeCheck(record[0], k)) {
              write(record[0], k);
              write(record[1], v);
              matched = true;
              break;
            }
          }
          if (!matched) throw new Error(`Dict key does not match any record in the schema`);
        }
        break;
      }

      case SHAPE_TAG:
        writeInt(MAJOR_TAG, shape.tag);
        write(/** @type {Shape} */(shape.value), value);
        break;

      case SHAPE_ONEOF:
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

      case SHAPE_TRANSFORM:
        write(/** @type {Shape} */(shape.value), shape.encode(value));
        break;

      case SHAPE_CONST: {
        const constValue = shape.value;
        let innerShape;
        if (typeof constValue === 'string') innerShape = { type: SHAPE_TEXT };
        else if (typeof constValue === 'bigint') innerShape = { type: SHAPE_INTEGER };
        else if (typeof constValue === 'number') innerShape = { type: SHAPE_FLOAT };
        else if (typeof constValue === 'boolean') innerShape = { type: SHAPE_BOOLEAN };
        else if (constValue === null) innerShape = { type: SHAPE_NIL };
        else if (constValue === undefined) innerShape = { type: SHAPE_UNDEF };
        else throw new Error(`Unsupported constant type: ${typeof constValue}`);
        write(/** @type {Shape} */(innerShape), constValue);
        break;
      }

      default:
        throw new Error(`Unknown shape type: ${/** @type {any} */ (shape)?.type}`);
    }
  }

  /**
   * @template {Shape} S
   * @param {S} shape
   * @param {EncodeValue<S>} value
   * @returns {Uint8Array<ArrayBuffer>}
   */
  function encode(shape, value) {
    offset = 0;
    write(shape, value);
    // On large encodings, hand over the internal buffer instead of copying it.
    if (offset > 8_000_000) {
      const out = /** @type {Uint8Array<ArrayBuffer>} */ (/** @type {unknown} */ (u8a.subarray(0, offset)));
      u8a = new Uint8Array(256);
      view = new DataView(u8a.buffer);
      offset = 0;
      return out;
    }
    return u8a.slice(0, offset);
  }

  return { encode };
}

export const { encode } = createEncoder();

const textDecoder = new TextDecoder();

/**
 * Compare two decoded map keys for semantic equality. Used for duplicate-key
 * detection on decode. Supports scalar keys plus byte strings (compared by content).
 *
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function keysEqual(a, b) {
  if (a === b) return true;
  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  return false;
}

/**
 * @template {Shape} S
 * @param {S} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
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

  /**
   * @param {Shape} [currentShape]
   * @returns {unknown}
   */
  function read(currentShape) {
    if (offset >= view.byteLength) throw new Error(`Unexpected end of CBOR data`);

    if (currentShape?.type === SHAPE_TRANSFORM) {
      const innerValue = read(/** @type {any} */(currentShape.value));
      return currentShape.decode(innerValue);
    }

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
        const dictRecords = currentShape?.type === SHAPE_DICT ? /** @type {any} */ (currentShape).records : null;
        value = dictRecords ? new Dict() : {};
        for (let index = 0; index < mapSize; index++) {
          const key = read();
          if (dictRecords) {
            let matchedRecord = null;
            for (const record of dictRecords) {
              if (typeCheck(record[0], key)) {
                if (matchedRecord) throw new Error(`Dict key matches multiple records; key shapes must be disjoint`);
                matchedRecord = record;
              }
            }
            if (!matchedRecord) throw new Error(`Dict key does not match any record in the schema`);
            const val = read(matchedRecord[1]);
            for (const existing of value.keys()) {
              if (keysEqual(existing, key)) throw new Error(`Duplicate map keys are not supported.`);
            }
            value.set(key, val);
          }
          else {
            if (typeof key === 'string') {
              if (key in value) throw new Error(`Duplicate map keys are not supported.`);
              value[key] = read();
            }
            else throw new Error(`Expected string keys in CBOR map, got ${typeof key}`);
          }
        }
        break;

      case MAJOR_TAG:
        const tagShape = currentShape?.type === SHAPE_TAG ? currentShape : null;
        const tag = readInt();
        if (tagShape && tagShape.tag === tag) value = read(/** @type {any} */(tagShape.value));
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
