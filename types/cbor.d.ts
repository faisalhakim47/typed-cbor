/** @typedef {{ type: SHAPE_INTEGER }} IntegerShape */
/** @typedef {{ type: SHAPE_BYTES }} BytesShape */
/** @typedef {{ type: SHAPE_TEXT }} TextShape */
/** @typedef {{ type: SHAPE_BOOLEAN }} BooleanShape */
/** @typedef {{ type: SHAPE_NIL }} NilShape */
/** @typedef {{ type: SHAPE_UNDEFINED }} UndefShape */
/** @typedef {{ type: SHAPE_FLOAT }} FloatShape */
/** @typedef {IntegerShape | BytesShape | TextShape | BooleanShape | NilShape | UndefShape | FloatShape} PrimitiveShape */
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
 * @typedef {
 *   [S] extends [IntegerShape] ? bigint :
 *   [S] extends [TextShape] ? string :
 *   [S] extends [BytesShape] ? Uint8Array :
 *   [S] extends [BooleanShape] ? boolean :
 *   [S] extends [NilShape] ? null :
 *   [S] extends [UndefShape] ? undefined :
 *   [S] extends [FloatShape] ? number :
 *   [S] extends [ArrayShape<infer ItemShape>] ? InferLeaf<ItemShape>[] :
 *   [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown
 * } InferLeafInternal
 */
/**
 * @template S
 * @typedef {
 *   [S] extends [IntegerShape] ? bigint :
 *   [S] extends [TextShape] ? string :
 *   [S] extends [BytesShape] ? Uint8Array :
 *   [S] extends [BooleanShape] ? boolean :
 *   [S] extends [NilShape] ? null :
 *   [S] extends [UndefShape] ? undefined :
 *   [S] extends [FloatShape] ? number :
 *   [S] extends [ArrayShape<infer ItemShape>] ? InferLeaf<ItemShape>[] :
 *   [S] extends [MapShape<infer Properties>] ? { [K in keyof Properties]: InferLeaf<Properties[K]> } :
 *   [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown
 * } InferShallowInternal
 */
/**
 * @template S
 * @typedef {S extends unknown ? InferShallowInternal<S> : never} InferShallow
 */
/**
 * @template S
 * @typedef {
 *   [S] extends [IntegerShape] ? bigint :
 *   [S] extends [TextShape] ? string :
 *   [S] extends [BytesShape] ? Uint8Array :
 *   [S] extends [BooleanShape] ? boolean :
 *   [S] extends [NilShape] ? null :
 *   [S] extends [UndefShape] ? undefined :
 *   [S] extends [FloatShape] ? number :
 *   [S] extends [ArrayShape<infer ItemShape>] ? InferShallow<ItemShape>[] :
 *   [S] extends [MapShape<infer Properties>] ? { [K in keyof Properties]: InferShallow<Properties[K]> } :
 *   [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown :
 *   unknown} InferValueInternal
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
 * @template {Shape[]} Variants
 * @param {Variants} variants
 * @returns {OneOfShape<Variants>}
 */
export function oneOf<Variants extends Shape[]>(...variants: Variants): OneOfShape<Variants>;
export function createEncoder(): {
    encode: <S extends Shape>(shape: S, value: InferValue<S>) => Uint8Array;
};
/**
 * @template S
 * @param {Shape} shape
 * @param {Uint8Array} cbor
 * @returns {InferValue<S>}
 */
export function decode<S>(shape: Shape, cbor: Uint8Array): InferValue<S>;
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
    type: typeof SHAPE_UNDEFINED;
};
export type FloatShape = {
    type: typeof SHAPE_FLOAT;
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
export type OneOfShape<Vairants> = {
    type: typeof SHAPE_ONE_OF;
    variants: Vairants;
};
export type Shape = PrimitiveShape | ArrayShape<unknown> | MapShape<Record<string, unknown>> | OneOfShape<unknown[]>;
export type InferLeaf<S> = S extends unknown ? InferLeafInternal<S> : never;
export type InferLeafInternal<S> = any[S] extends [IntegerShape] ? bigint : [S] extends [TextShape] ? string : [S] extends [BytesShape] ? Uint8Array : [S] extends [BooleanShape] ? boolean : [S] extends [NilShape] ? null : [S] extends [UndefShape] ? undefined : [S] extends [FloatShape] ? number : [S] extends [ArrayShape<infer ItemShape>] ? InferLeaf<ItemShape>[] : [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown;
export type InferShallowInternal<S> = any[S] extends [IntegerShape] ? bigint : [S] extends [TextShape] ? string : [S] extends [BytesShape] ? Uint8Array : [S] extends [BooleanShape] ? boolean : [S] extends [NilShape] ? null : [S] extends [UndefShape] ? undefined : [S] extends [FloatShape] ? number : [S] extends [ArrayShape<infer ItemShape>] ? InferLeaf<ItemShape>[] : [S] extends [MapShape<infer Properties>] ? { [K in keyof Properties]: InferLeaf<Properties[K]>; } : [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferLeaf<Variants[number]> : unknown : unknown;
export type InferShallow<S> = S extends unknown ? InferShallowInternal<S> : never;
export type InferValueInternal<S> = any[S] extends [IntegerShape] ? bigint : [S] extends [TextShape] ? string : [S] extends [BytesShape] ? Uint8Array : [S] extends [BooleanShape] ? boolean : [S] extends [NilShape] ? null : [S] extends [UndefShape] ? undefined : [S] extends [FloatShape] ? number : [S] extends [ArrayShape<infer ItemShape>] ? InferShallow<ItemShape>[] : [S] extends [MapShape<infer Properties>] ? { [K in keyof Properties]: InferShallow<Properties[K]>; } : [S] extends [OneOfShape<infer Variants>] ? Variants extends readonly unknown[] ? InferShallow<Variants[number]> : unknown : unknown;
export type InferValue<S> = S extends unknown ? InferValueInternal<S> : never;
declare const SHAPE_INTEGER: unique symbol;
declare const SHAPE_BYTES: unique symbol;
declare const SHAPE_TEXT: unique symbol;
declare const SHAPE_BOOLEAN: unique symbol;
declare const SHAPE_NIL: unique symbol;
declare const SHAPE_UNDEFINED: unique symbol;
declare const SHAPE_FLOAT: unique symbol;
declare const SHAPE_ARRAY: unique symbol;
declare const SHAPE_MAP: unique symbol;
declare const SHAPE_ONE_OF: unique symbol;
export {};
