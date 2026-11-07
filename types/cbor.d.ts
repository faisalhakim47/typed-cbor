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
declare const SHAPE_INTEGER: unique symbol;
declare const SHAPE_BYTES: unique symbol;
declare const SHAPE_TEXT: unique symbol;
declare const SHAPE_ARRAY: unique symbol;
declare const SHAPE_DICT: unique symbol;
declare const SHAPE_TAG: unique symbol;
declare const SHAPE_BOOLEAN: unique symbol;
declare const SHAPE_NIL: unique symbol;
declare const SHAPE_UNDEF: unique symbol;
declare const SHAPE_FLOAT: unique symbol;
declare const SHAPE_ONEOF: unique symbol;
declare const SHAPE_CONST: unique symbol;
declare const SHAPE_TRANSFORM: unique symbol;
export type IntegerShape = {
    type: typeof SHAPE_INTEGER;
};
export type BytesShape = {
    type: typeof SHAPE_BYTES;
};
export type TextShape = {
    type: typeof SHAPE_TEXT;
};
export type BooleanShape = {
    type: typeof SHAPE_BOOLEAN;
};
export type NilShape = {
    type: typeof SHAPE_NIL;
};
export type UndefShape = {
    type: typeof SHAPE_UNDEF;
};
export type FloatShape = {
    type: typeof SHAPE_FLOAT;
};
export type ConstShape<T> = {
    type: typeof SHAPE_CONST;
    value: T;
};
export type PrimitiveShape = IntegerShape | BytesShape | TextShape | BooleanShape | NilShape | UndefShape | FloatShape;
export type ArrayShape<ItemShape> = {
    type: typeof SHAPE_ARRAY;
    items: ItemShape;
};
export type DictShape<Records extends readonly [unknown, unknown][]> = {
    type: typeof SHAPE_DICT;
    records: Records;
};
export type TagShape<ValueShape> = {
    type: typeof SHAPE_TAG;
    tag: bigint;
    value: ValueShape;
};
export type OneOfShape<Variants> = {
    type: typeof SHAPE_ONEOF;
    variants: Variants;
};
export type TransformShape<ValueShape, JSValue> = {
    type: typeof SHAPE_TRANSFORM;
    value: ValueShape;
    encode: (value: JSValue) => InferValue<ValueShape>;
    decode: (value: InferValue<ValueShape>) => JSValue;
};
export type Shape = PrimitiveShape | ArrayShape<unknown> | DictShape<readonly [unknown, unknown][]> | OneOfShape<unknown[]> | ConstShape<unknown> | TagShape<unknown> | TransformShape<any, any>;
export type InferLeaf<S> = S extends unknown ? InferLeafInternal<S> : never;
export type InferLeafInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] : S extends DictShape<infer Records> ? Dict<Records> : S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer Value> ? Value : unknown);
export type InferShallowInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] : S extends DictShape<infer Records> ? Dict<Records> : S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer Value> ? Value : unknown);
export type InferShallow<S> = S extends unknown ? InferShallowInternal<S> : never;
export type InferValueInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferShallow<ItemShape>[] : S extends DictShape<infer Records> ? Dict<Records> : S extends TagShape<infer ValueShape> ? InferShallow<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer T> ? T : unknown);
export type InferValue<S> = S extends unknown ? InferValueInternal<S> : never;
export type RecordValue<Record, K> = (Record extends [infer KS, infer VS] ? K extends InferLeaf<KS> ? InferLeaf<VS> : never : never);
export type RecordKey<Record> = Record extends [infer KS, infer VS] ? InferLeaf<KS> : never;
export type DictKeys<E extends readonly [unknown, unknown][]> = RecordKey<E[number]>;
export type ValueForRecord<E extends readonly [unknown, unknown][], K> = ({
    [I in keyof E]: RecordValue<E[I], K>;
}[number]);
export type TypedPair<Record> = Record extends [infer KS, infer VS] ? [InferLeaf<KS>, EncodePairs<VS>] : never;
export type DictPairs<E extends readonly [unknown, unknown][]> = ({
    [I in keyof E]: TypedPair<E[I]>;
});
export type EncodePairsInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? EncodePairs<ItemShape>[] : S extends DictShape<infer E> ? DictPairs<E> : S extends TagShape<infer ValueShape> ? EncodePairs<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? EncodePairs<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer T> ? T : unknown);
export type EncodePairs<S> = S extends unknown ? EncodePairsInternal<S> : never;
export type EncodeValueInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? EncodeValue<ItemShape>[] : S extends DictShape<infer E> ? Dict<E> | DictPairs<E> : S extends TagShape<infer ValueShape> ? EncodeValue<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? EncodeValue<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer T> ? T : unknown);
export type EncodeValue<S> = S extends unknown ? EncodeValueInternal<S> : never;
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
 * Map a single [keyShape, valueShape] record pair to its key type.
 * Declared on a naked type parameter so the conditional distributes over
 * unions: when the record list's element type is a union
 * (map() produces such lists from plain-object fields), each pair resolves
 * independently and the union of all keys survives.
 *
 * @template Record
 * @typedef {Record extends [infer KS, infer VS] ? InferLeaf<KS> : never} RecordKey
 */
/**
 * Given a dict record list E, resolve the union of valid key types.
 * Works for both tuple record lists (dict()) and pair-union lists (map()).
 *
 * @template {readonly [unknown, unknown][]} E
 * @typedef {RecordKey<E[number]>} DictKeys
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
/** @returns {IntegerShape} */ export declare function integer(): IntegerShape;
/** @returns {BytesShape} */ export declare function bytes(): BytesShape;
/** @returns {TextShape} */ export declare function text(): TextShape;
/** @returns {BooleanShape} */ export declare function boolean(): BooleanShape;
/** @returns {NilShape} */ export declare function nil(): NilShape;
/** @returns {UndefShape} */ export declare function undef(): UndefShape;
/** @returns {FloatShape} */ export declare function float(): FloatShape;
/**
 * @template ItemShape
 * @param {ItemShape} items
 * @returns {ArrayShape<ItemShape>}
 */
export declare function array<ItemShape>(items: ItemShape): ArrayShape<ItemShape>;
/**
 * Create a dict shape from a list of record patterns.
 * Key shapes must be disjoint; this is enforced at construction time.
 *
 * @template {readonly [unknown, unknown][]} Records
 * @param {Records} records
 * @returns {DictShape<Records>}
 */
export declare function dict<Records extends readonly [unknown, unknown][]>(...records: Records): DictShape<Records>;
export type MapRecords<Fields extends Record<string, Shape>> = {
    [K in keyof Fields]: [ConstShape<K & string>, Fields[K]];
}[keyof Fields][];
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
export declare function map<Fields extends Record<string, Shape>>(fields: Fields): DictShape<MapRecords<Fields>>;
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
export declare class Dict<E extends readonly [unknown, unknown][]> extends Map<unknown, unknown> {
    /**
     * @template {DictKeys<E>} const K
     * @param {K} key
     * @returns {RecordValue<E[number], K>}
     */
    get<const K extends DictKeys<E>>(key: K): RecordValue<E[number], K>;
    /**
     * @template {DictKeys<E>} const K
     * @param {K} key
     * @param {RecordValue<E[number], K>} value
     * @returns {this}
     */
    set<const K extends DictKeys<E>>(key: K, value: RecordValue<E[number], K>): this;
    /**
     * @template {DictKeys<E>} const K
     * @param {K} key
     * @returns {boolean}
     */
    has<const K extends DictKeys<E>>(key: K): boolean;
    /**
     * @template {DictKeys<E>} const K
     * @param {K} key
     * @returns {boolean}
     */
    delete<const K extends DictKeys<E>>(key: K): boolean;
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
export declare function transform<ValueShape, JSValue>(value: ValueShape, decode: (value: InferValue<ValueShape>) => JSValue, encode: (value: JSValue) => InferValue<ValueShape>): TransformShape<ValueShape, JSValue>;
/**
 * @template ValueShape
 * @param {bigint} tag
 * @param {ValueShape} value
 * @returns {TagShape<ValueShape>}
 */
export declare function tag<ValueShape>(tag: bigint, value: ValueShape): TagShape<ValueShape>;
/**
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export declare function oneOf<Variants extends Shape[]>(...variants: Variants): OneOfShape<Variants>;
/**
 * @template const T
 * @param {T} value
 * @returns {ConstShape<T>}
 */
export declare function constant<const T>(value: T): ConstShape<T>;
/**
 * @template {Shape} S
 * @param {S} shape
 * @param {unknown} value
 * @returns {value is InferValue<S>}
 */
export declare function typeCheck<S extends Shape>(shape: S, value: unknown): value is InferValue<S>;
/**
 * @param {Uint8Array<ArrayBuffer>} cbor
 */
export declare function readTag(cbor: Uint8Array<ArrayBuffer>): bigint;
/**
 * @param {TagShape<unknown>} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
 */
export declare function tagCheck(shape: TagShape<unknown>, cbor: Uint8Array<ArrayBuffer>): boolean;
export declare function createEncoder(): {
    encode: <S extends Shape>(shape: S, value: EncodeValue<S>) => Uint8Array<ArrayBuffer>;
};
export declare const encode: <S extends Shape>(shape: S, value: EncodeValue<S>) => Uint8Array<ArrayBuffer>;
/**
 * @template {Shape} S
 * @param {S} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
 * @returns {InferValue<S>}
 */
export declare function decode<S extends Shape>(shape: S, cbor: Uint8Array<ArrayBuffer>): InferValue<S>;
export {};
