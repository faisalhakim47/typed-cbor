/** @typedef {{ type: SHAPE_INTEGER }} IntegerShape */
/** @typedef {{ type: SHAPE_BYTES }} BytesShape */
/** @typedef {{ type: SHAPE_TEXT }} TextShape */
/** @typedef {{ type: SHAPE_BOOLEAN }} BooleanShape */
/** @typedef {{ type: SHAPE_NIL }} NilShape */
/** @typedef {{ type: SHAPE_UNDEF }} UndefShape */
/** @typedef {{ type: SHAPE_FLOAT }} FloatShape */
/**
 * @template T
 * @typedef {{ type: SHAPE_CONST, value: T }} ConstShape
 */
/** @typedef {IntegerShape | BytesShape | TextShape | BooleanShape | NilShape | UndefShape | FloatShape} PrimitiveShape */
/**
 * @template ItemShape
 * @typedef {object} ArrayShape
 * @property {typeof SHAPE_ARRAY} type
 * @property {ItemShape} items
 */
/**
 * @template {Record<string, unknown>} Properties
 * @typedef {object} MapShape
 * @property {typeof SHAPE_MAP} type
 * @property {Properties} properties
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
/** @typedef {PrimitiveShape | ArrayShape<unknown> | MapShape<Record<string, unknown>> | OneOfShape<unknown[]> | ConstShape<unknown> | TagShape<unknown> | TransformShape<any, any>} Shape */
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
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]> } :
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
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]> } :
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
 *   S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferShallow<Properties[K]> } :
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
/** @returns {IntegerShape} */ export function integer(): IntegerShape;
/** @returns {BytesShape} */ export function bytes(): BytesShape;
/** @returns {TextShape} */ export function text(): TextShape;
/** @returns {BooleanShape} */ export function boolean(): BooleanShape;
/** @returns {NilShape} */ export function nil(): NilShape;
/** @returns {UndefShape} */ export function undef(): UndefShape;
/** @returns {FloatShape} */ export function float(): FloatShape;
/**
 * @template ItemShape
 * @param {ItemShape} items
 * @returns {ArrayShape<ItemShape>}
 */
export function array<ItemShape>(items: ItemShape): ArrayShape<ItemShape>;
/**
 * @template {Record<string, Shape>} Properties
 * @param {Properties} properties
 * @returns {MapShape<Properties>}
 */
export function map<Properties extends Record<string, Shape>>(properties: Properties): MapShape<Properties>;
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
export function transform<ValueShape, JSValue>(value: ValueShape, decode: (value: InferValue<ValueShape>) => JSValue, encode: (value: JSValue) => InferValue<ValueShape>): TransformShape<ValueShape, JSValue>;
/**
 * @template ValueShape
 * @param {bigint} tag
 * @param {ValueShape} value
 * @returns {TagShape<ValueShape>}
 */
export function tag<ValueShape>(tag: bigint, value: ValueShape): TagShape<ValueShape>;
/**
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export function oneOf<Variants extends Shape[]>(...variants: Variants): OneOfShape<Variants>;
/**
 * @template T
 * @param {T} value
 * @returns {ConstShape<T>}
 */
export function constant<T>(value: T): ConstShape<T>;
/**
 * @template {Shape} S
 * @param {S} shape
 * @param {unknown} value
 * @returns {value is InferValue<S>}
 */
export function typeCheck<S extends Shape>(shape: S, value: unknown): value is InferValue<S>;
/**
 * @param {Uint8Array<ArrayBuffer>} cbor
 */
export function readTag(cbor: Uint8Array<ArrayBuffer>): bigint;
/**
 * @param {TagShape<unknown>} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
 */
export function tagCheck(shape: TagShape<unknown>, cbor: Uint8Array<ArrayBuffer>): boolean;
export function createEncoder(): {
    encode: <S extends Shape>(shape: S, value: InferValue<S>) => Uint8Array<ArrayBuffer>;
};
/**
 * @template {Shape} S
 * @param {S} shape
 * @param {Uint8Array<ArrayBuffer>} cbor
 * @returns {InferValue<S>}
 */
export function decode<S extends Shape>(shape: S, cbor: Uint8Array<ArrayBuffer>): InferValue<S>;
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
export type MapShape<Properties extends Record<string, unknown>> = {
    type: typeof SHAPE_MAP;
    properties: Properties;
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
export type Shape = PrimitiveShape | ArrayShape<unknown> | MapShape<Record<string, unknown>> | OneOfShape<unknown[]> | ConstShape<unknown> | TagShape<unknown> | TransformShape<any, any>;
export type InferLeaf<S> = S extends unknown ? InferLeafInternal<S> : never;
export type InferLeafInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] : S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]>; } : S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer Value> ? Value : unknown);
export type InferShallowInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferLeaf<ItemShape>[] : S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferLeaf<Properties[K]>; } : S extends TagShape<infer ValueShape> ? InferLeaf<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer Value> ? Value : unknown);
export type InferShallow<S> = S extends unknown ? InferShallowInternal<S> : never;
export type InferValueInternal<S> = (S extends IntegerShape ? bigint : S extends TextShape ? string : S extends BytesShape ? Uint8Array<ArrayBuffer> : S extends BooleanShape ? boolean : S extends NilShape ? null : S extends UndefShape ? undefined : S extends FloatShape ? number : S extends ArrayShape<infer ItemShape> ? InferShallow<ItemShape>[] : S extends MapShape<infer Properties> ? { [K in keyof Properties]: InferShallow<Properties[K]>; } : S extends TagShape<infer ValueShape> ? InferShallow<ValueShape> : S extends OneOfShape<infer Variants> ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : S extends TransformShape<infer SourceShape, infer TargetValue> ? TargetValue : S extends ConstShape<infer T> ? T : unknown);
export type InferValue<S> = S extends unknown ? InferValueInternal<S> : never;
declare const SHAPE_INTEGER: unique symbol;
declare const SHAPE_BYTES: unique symbol;
declare const SHAPE_TEXT: unique symbol;
declare const SHAPE_BOOLEAN: unique symbol;
declare const SHAPE_NIL: unique symbol;
declare const SHAPE_UNDEF: unique symbol;
declare const SHAPE_FLOAT: unique symbol;
declare const SHAPE_CONST: unique symbol;
declare const SHAPE_ARRAY: unique symbol;
declare const SHAPE_MAP: unique symbol;
declare const SHAPE_TAG: unique symbol;
declare const SHAPE_ONEOF: unique symbol;
declare const SHAPE_TRANSFORM: unique symbol;
export {};
