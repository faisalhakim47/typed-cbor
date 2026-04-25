import { describe, it } from 'node:test';
import { array, bytes, boolean, constant, createEncoder, decode, float, integer, map, nil, oneOf, tag, tagCheck, text, typeCheck, undef } from './cbor.js';
import { deepEqual, throws, equal } from 'node:assert';

describe('CBOR Encoder/Decoder', function cborDescription() {

  // ============================================================================
  // PHASE 2: PRIMITIVE TYPE TESTS
  // ============================================================================

  describe('Primitive Types - integer()', function integerTests() {
    it('should encode and decode positive integers (0-23)', function testSmallPositive() {
      const encoder = createEncoder();
      const schema = integer();

      for (let i = 0n; i <= 23n; i += 1n) {
        const encoded = encoder.encode(schema, i);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, i, `Failed for integer ${i}`);
      }
    });

    it('should encode and decode positive integers at byte boundaries', function testBoundaryPositive() {
      const encoder = createEncoder();
      const schema = integer();
      const testValues = [
        0n,           // Min
        23n,          // Max single byte
        24n,          // First 1-byte value
        255n,         // Max 1-byte value
        256n,         // First 2-byte value
        65535n,       // Max 2-byte value
        65536n,       // First 4-byte value
        0xFFFFFFFFn,  // Max 4-byte value
        0x100000000n, // First 8-byte value
        0xFFFFFFFFFFFFFFFFn, // Max valid 8-byte bigint
      ];

      for (const value of testValues) {
        const encoded = encoder.encode(schema, value);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, value, `Failed for integer ${value}`);
      }
    });

    it('should reject non-bigint values', function testIntegerTypeCheck() {
      const encoder = createEncoder();
      const schema = integer();

      throws(() => encoder.encode(schema, /** @type {any} */ (123)), { message: /Expected integer/ });
      throws(() => encoder.encode(schema, /** @type {any} */ ('not an int')), { message: /Expected integer/ });
      throws(() => encoder.encode(schema, /** @type {any} */ ({})), { message: /Expected integer/ });
    });
  });

  describe('Primitive Types - text()', function textTests() {
    it('should encode and decode text strings', function testTextBasic() {
      const encoder = createEncoder();
      const schema = text();
      const testStrings = [
        '',                    // Empty string
        'a',                   // Single character
        'hello world',         // ASCII
        'The quick brown fox', // Longer ASCII
        '你好',                // Multi-byte UTF-8
        '🎉🚀✨',              // Emoji
        'Café',                // Accent marks
      ];

      for (const str of testStrings) {
        const encoded = encoder.encode(schema, str);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, str, `Failed for text: "${str}"`);
      }
    });

    it('should reject non-string values', function testTextTypeCheck() {
      const encoder = createEncoder();
      const schema = text();

      throws(() => encoder.encode(schema, /** @type {any} */ (123)), { message: /Expected text/ });
      throws(() => encoder.encode(schema, /** @type {any} */ (null)), { message: /Expected text/ });
    });
  });

  describe('Primitive Types - bytes()', function bytesTests() {
    it('should encode and decode byte arrays', function testBytesBasic() {
      const encoder = createEncoder();
      const schema = bytes();
      const testBytes = [
        new Uint8Array([]),                    // Empty
        new Uint8Array([0xFF, 0xD8, 0xFF]),    // JPEG header
        new Uint8Array([1, 2, 3, 4, 5]),       // Sequential
        new Uint8Array(256),                   // Larger data (256 bytes)
      ];

      for (const byteArray of testBytes) {
        const encoded = encoder.encode(schema, byteArray);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, byteArray, `Failed for bytes of length ${byteArray.length}`);
      }
    });

    it('should reject non-Uint8Array values', function testBytesTypeCheck() {
      const encoder = createEncoder();
      const schema = bytes();

      throws(() => encoder.encode(schema, /** @type {any} */ ('not bytes')), { message: /Expected bytes/ });
      throws(() => encoder.encode(schema, /** @type {any} */ ([1, 2, 3])), { message: /Expected bytes/ });
    });
  });

  describe('Primitive Types - boolean()', function booleanTests() {
    it('should encode and decode booleans', function testBooleanBasic() {
      const encoder = createEncoder();
      const schema = boolean();

      let encoded = encoder.encode(schema, true);
      deepEqual(decode(schema, encoded), true);

      encoded = encoder.encode(schema, false);
      deepEqual(decode(schema, encoded), false);
    });

    it('should reject non-boolean values', function testBooleanTypeCheck() {
      const encoder = createEncoder();
      const schema = boolean();

      throws(() => encoder.encode(schema, /** @type {any} */ (1)), { message: /Expected boolean/ });
      throws(() => encoder.encode(schema, /** @type {any} */ ('true')), { message: /Expected boolean/ });
    });
  });

  describe('Primitive Types - nil()', function nilTests() {
    it('should encode and decode null', function testNilBasic() {
      const encoder = createEncoder();
      const schema = nil();

      const encoded = encoder.encode(schema, null);
      deepEqual(decode(schema, encoded), null);
    });

    it('should reject non-null values', function testNilTypeCheck() {
      const encoder = createEncoder();
      const schema = nil();

      throws(() => encoder.encode(schema, /** @type {any} */ (undefined)), { message: /Expected null/ });
      throws(() => encoder.encode(schema, /** @type {any} */ (0)), { message: /Expected null/ });
    });
  });

  describe('Primitive Types - undef()', function undefTests() {
    it('should encode and decode undefined', function testUndefBasic() {
      const encoder = createEncoder();
      const schema = undef();

      const encoded = encoder.encode(schema, undefined);
      deepEqual(decode(schema, encoded), undefined);
    });

    it('should reject non-undefined values', function testUndefTypeCheck() {
      const encoder = createEncoder();
      const schema = undef();

      throws(() => encoder.encode(schema, /** @type {any} */ (null)), { message: /Expected undefined/ });
      throws(() => encoder.encode(schema, /** @type {any} */ (0)), { message: /Expected undefined/ });
    });
  });

  describe('Primitive Types - float()', function floatTests() {
    it('should encode and decode floating point numbers', function testFloatBasic() {
      const encoder = createEncoder();
      const schema = float();
      const testNumbers = [
        0,
        1.5,
        -3.14,
        123.456,
        1e-10,    // Very small
        1e20,     // Very large
        0.1 + 0.2, // Classic precision test
      ];

      for (const num of testNumbers) {
        const encoded = encoder.encode(schema, num);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, num, `Failed for float ${num}`);
      }
    });

    it('should reject NaN and Infinity', function testFloatSpecialValues() {
      const encoder = createEncoder();
      const schema = float();

      throws(() => encoder.encode(schema, NaN), { message: /NaN|Infinity/ });
      throws(() => encoder.encode(schema, Infinity), { message: /NaN|Infinity/ });
      throws(() => encoder.encode(schema, -Infinity), { message: /NaN|Infinity/ });
    });

    it('should reject non-number values', function testFloatTypeCheck() {
      const encoder = createEncoder();
      const schema = float();

      throws(() => encoder.encode(schema, /** @type {any} */ ('1.5')), { message: /Expected float/ });
      throws(() => encoder.encode(schema, /** @type {any} */ (123n)), { message: /Expected float/ });
    });
  });

  // ============================================================================
  // PHASE 3: NEGATIVE INTEGER TESTS
  // ============================================================================

  describe('Negative Integers', function negativeTests() {
    it('should encode and decode negative integers', function testNegativeBasic() {
      const encoder = createEncoder();
      const schema = integer();
      const testValues = [
        -1n,          // Min negative single-byte
        -23n,         // Still single-byte
        -24n,         // First 1-byte value
        -255n,        // Max 1-byte value
        -256n,        // First 2-byte value
        -65535n,      // Max 2-byte value
        -65536n,      // First 4-byte value
        -0xFFFFFFFFn, // Max 4-byte value
      ];

      for (const value of testValues) {
        const encoded = encoder.encode(schema, value);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, value, `Failed for negative integer ${value}`);
      }
    });
  });

  // ============================================================================
  // PHASE 4: COMPOSITE TYPE TESTS
  // ============================================================================

  describe('Composite Types - array()', function arrayTests() {
    it('should encode and decode empty arrays', function testEmptyArray() {
      const encoder = createEncoder();
      const schema = array(integer());
      const value = /** @type {Array<any>} */ ([]);

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode arrays of integers', function testIntegerArray() {
      const encoder = createEncoder();
      const schema = array(integer());
      const value = [1n, 2n, 3n, 100n, 999999n];

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode nested arrays', function testNestedArray() {
      const encoder = createEncoder();
      const schema = array(array(integer()));
      const value = [[1n, 2n], [3n], [4n, 5n, 6n]];

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode arrays with union types', function testArrayWithOneOf() {
      const encoder = createEncoder();
      const schema = array(oneOf(integer(), text()));
      const value = [1n, 'hello', 999n, 'world', 0n];

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should reject arrays with mismatched item types', function testArrayTypeCheck() {
      const encoder = createEncoder();
      const schema = array(integer());

      throws(() => encoder.encode(schema, [1n, /** @type {any} */ ('not-int'), 3n]), { message: /integer/ });
      throws(() => encoder.encode(schema, [/** @type {any} */ ('string')]), { message: /integer/ });
    });
  });

  describe('Composite Types - map()', function mapTests() {
    it('should encode and decode empty maps', function testEmptyMap() {
      const encoder = createEncoder();
      const schema = map({});
      const value = {};

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode maps with mixed property types', function testMapBasic() {
      const encoder = createEncoder();
      const schema = map({
        name: text(),
        age: integer(),
        active: boolean(),
      });
      const value = {
        name: 'Alice',
        age: 30n,
        active: true,
      };

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should allow extra keys in decoded objects (forward compatibility)', function testMapExtraKeys() {
      const encoder = createEncoder();
      const schema = map({
        name: text(),
      });
      const valueWithExtra = {
        name: 'Bob',
        extraKey: 'ignored by encoder',
        anotherExtra: 123,
      };

      // Encoder only writes schema keys
      const encoded = encoder.encode(schema, valueWithExtra);
      const decoded = decode(schema, encoded);

      // Decoded should only have schema keys
      deepEqual(decoded, { name: 'Bob' });
    });

    it('should encode and decode nested maps', function testNestedMap() {
      const encoder = createEncoder();
      const schema = map({
        user: map({
          name: text(),
          age: integer(),
        }),
        active: boolean(),
      });
      const value = {
        user: { name: 'Charlie', age: 25n },
        active: true,
      };

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should reject maps with mismatched property types', function testMapTypeCheck() {
      const encoder = createEncoder();
      const schema = map({
        name: text(),
        age: integer(),
      });

      throws(() => encoder.encode(schema, { name: 'Dave', age: /** @type {any} */ ('30') }), { message: /integer/ });
      throws(() => encoder.encode(schema, { name: /** @type {any} */ (123), age: 30n }), { message: /text/ });
    });
  });

  describe('Composite Types - oneOf()', function oneOfTests() {
    it('should encode and decode oneOf with matching variant', function testOneOfBasic() {
      const encoder = createEncoder();
      const schema = oneOf(integer(), text());

      let encoded = encoder.encode(schema, 42n);
      deepEqual(decode(schema, encoded), 42n);

      encoded = encoder.encode(schema, 'hello');
      deepEqual(decode(schema, encoded), 'hello');
    });

    it('should reject values that do not match any variant', function testOneOfReject() {
      const encoder = createEncoder();
      const schema = oneOf(integer(), text());

      throws(() => encoder.encode(schema, /** @type {any} */ (true)), /variant|oneOf/i);
      throws(() => encoder.encode(schema, /** @type {any} */ (null)), /variant|oneOf/i);
    });

    it('should handle nested oneOf in complex structures', function testOneOfNested() {
      const encoder = createEncoder();
      const schema = map({
        id: integer(),
        data: oneOf(text(), bytes()),
      });

      const value1 = { id: 1n, data: 'text-data' };
      const value2 = { id: 2n, data: new Uint8Array([1, 2, 3]) };

      deepEqual(decode(schema, encoder.encode(schema, value1)), value1);
      deepEqual(decode(schema, encoder.encode(schema, value2)), value2);
    });
  });

  describe('Composite Types - constant()', function constantTests() {
    it('should work inside oneOf to create union types', function testConstantInOneOf() {
      const encoder = createEncoder();
      const StatusShape = oneOf(
        constant(/** @type {const} */ ('active')),
        constant(/** @type {const} */ ('inactive')),
      );

      const activeEncoded = encoder.encode(StatusShape, 'active');
      deepEqual(decode(StatusShape, activeEncoded), 'active');

      const inactiveEncoded = encoder.encode(StatusShape, 'inactive');
      deepEqual(decode(StatusShape, inactiveEncoded), 'inactive');
    });

    it('should work inside oneOf with numeric constants', function testConstantNumeric() {
      const encoder = createEncoder();
      const schema = oneOf(constant(1), constant(2), constant(3));

      for (const v of [1, 2, 3]) {
        deepEqual(decode(schema, encoder.encode(schema, v)), v);
      }
    });

    it('should reject values that do not match any constant in oneOf', function testConstantReject() {
      const encoder = createEncoder();
      const schema = oneOf(constant('active'), constant('inactive'));

      throws(() => encoder.encode(schema, /** @type {any} */ ('pending')), /does not match any variant/i);
    });

    it('should work in complex structures', function testConstantInMap() {
      const encoder = createEncoder();
      const schema = map({
        status: oneOf(constant('active'), constant('inactive')),
        count: integer(),
      });

      const value = { status: 'active', count: 5n };
      deepEqual(decode(schema, encoder.encode(schema, value)), value);
    });

    it('should type-check correctly', function testTypeCheck() {
      const StatusShape = oneOf(constant('active'), constant('inactive'));

      equal(typeCheck(StatusShape, 'active'), true);
      equal(typeCheck(StatusShape, 'inactive'), true);
      equal(typeCheck(StatusShape, 'unknown'), false);
    });
  });

  // ============================================================================
  // PHASE 5: ENCODER-SPECIFIC TESTS
  // ============================================================================

  describe('Encoder - Buffer Management', function encoderBufferTests() {
    it('should reuse buffer across multiple encode calls', function testBufferReuse() {
      const encoder = createEncoder();
      const schema = text();

      // First encode: small string (uses initial 256-byte buffer)
      const encoded1 = encoder.encode(schema, 'small');
      deepEqual(encoded1.length, encoded1.byteLength);

      // Second encode: another small string (should reuse buffer)
      const encoded2 = encoder.encode(schema, 'text');
      deepEqual(encoded2.length, encoded2.byteLength);

      // Verify both decode correctly
      deepEqual(decode(schema, encoded1), 'small');
      deepEqual(decode(schema, encoded2), 'text');
    });

    it('should grow buffer for large data', function testBufferGrowth() {
      const encoder = createEncoder();

      // Create a large string (larger than initial 256-byte buffer)
      const largeString = 'x'.repeat(1000);
      const schema = text();

      const encoded = encoder.encode(schema, largeString);
      deepEqual(decode(schema, encoded), largeString);
    });

    it('should handle multiple large encodes with buffer growth', function testMultipleLargeEncodes() {
      const encoder = createEncoder();
      const schema = text();

      const strings = [
        'x'.repeat(500),
        'y'.repeat(2000),
        'z'.repeat(100),
      ];

      for (const str of strings) {
        const encoded = encoder.encode(schema, str);
        deepEqual(decode(schema, encoded), str);
      }
    });
  });

  describe('Encoder - Type Validation', function encoderTypeTests() {
    it('should validate integer shape receives bigint', function testIntegerTypeValidation() {
      const encoder = createEncoder();
      const schema = integer();

      throws(() => encoder.encode(schema, /** @type {any} */ (42)));         // Number, not bigint
      throws(() => encoder.encode(schema, /** @type {any} */ ('42')));       // String
      throws(() => encoder.encode(schema, /** @type {any} */ (true)));       // Boolean
      throws(() => encoder.encode(schema, /** @type {any} */ ({})));         // Object
    });

    it('should validate nested type mismatches in arrays', function testArrayNestedTypeValidation() {
      const encoder = createEncoder();
      const schema = array(map({
        id: integer(),
        name: text(),
      }));

      const badValue = [
        { id: 1n, name: 'good' },
        { id: 'bad-id', name: 'bad' }, // id should be integer
      ];

      throws(() => encoder.encode(schema, /** @type {any} */ (badValue)), /integer/);
    });

    it('should validate nested type mismatches in maps', function testMapNestedTypeValidation() {
      const encoder = createEncoder();
      const schema = map({
        settings: map({
          debug: boolean(),
          timeout: integer(),
        }),
      });

      const badValue = {
        settings: {
          debug: 'not-bool',
          timeout: 5000n,
        },
      };

      throws(() => encoder.encode(schema, /** @type {any} */ (badValue)), /boolean/);
    });
  });

  // ============================================================================
  // PHASE 6: DECODER-SPECIFIC TESTS
  // ============================================================================

  describe('Decoder - Error Handling', function decoderErrorTests() {
    it('should reject truncated CBOR data', function testTruncatedData() {
      const encoder = createEncoder();
      const schema = text();

      const fullEncoded = encoder.encode(schema, 'hello world');
      const truncated = fullEncoded.slice(0, Math.floor(fullEncoded.length / 2));

      throws(() => decode(schema, truncated), /Unexpected end|Invalid typed array|RangeError/);
    });

    it('should reject CBOR data with extra bytes after valid value', function testExtraData() {
      const encoder = createEncoder();
      const schema = text();

      const encoded = encoder.encode(schema, 'hello');
      const extraData = new Uint8Array(encoded.length + 1);
      extraData.set(encoded);
      extraData[encoded.length] = 0xFF; // Add junk byte

      throws(() => decode(schema, extraData), /Extra data/);
    });

    it('should reject CBOR data that does not match schema', function testSchemaMismatch() {
      const encoder = createEncoder();
      const schemaInt = integer();
      const schemaText = text();

      const encodedInt = encoder.encode(schemaInt, 42n);

      // Try to decode integer as text (schema mismatch)
      throws(() => decode(schemaText, encodedInt), /does not match|match the provided shape/);
    });

    it('should handle empty CBOR stream gracefully', function testEmptyData() {
      const schema = integer();

      throws(() => decode(schema, new Uint8Array([])), /Unexpected end|Unexpected end of CBOR/);
    });
  });

  // ============================================================================
  // PHASE 7: ROUND-TRIP & INTEGRATION TESTS
  // ============================================================================

  describe('Integration - Complex Round-Trip', function integrationTests() {
    it('should encode and decode complex nested structure (original test)', function testComplexRoundTrip() {
      const encoder = createEncoder();

      const schema = map({
        name: text(),
        age: integer(),
        photo: bytes(),
        hobbies: array(oneOf(text(), integer())),
      });

      const value = {
        name: 'Alice',
        age: 30n,
        photo: new Uint8Array([0xFF, 0xD8, 0xFF]), // JPEG header bytes
        hobbies: ['reading', 'hiking', 5n],
      };

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);

      deepEqual(value, decoded);
    });

    it('should handle complex nested structure with all primitive types', function testAllTypes() {
      const encoder = createEncoder();

      const schema = map({
        id: integer(),
        title: text(),
        description: text(),
        data: bytes(),
        isActive: boolean(),
        nullable: nil(),
        optional: undef(),
        rating: float(),
        tags: array(text()),
        metadata: map({
          created: integer(),
          updated: integer(),
        }),
      });

      const value = {
        id: 123n,
        title: 'Complete Item',
        description: 'A fully featured test item',
        data: new Uint8Array([0xAA, 0xBB, 0xCC]),
        isActive: true,
        nullable: null,
        optional: undefined,
        rating: 4.5,
        tags: ['important', 'test', '🏷️'],
        metadata: {
          created: 1000n,
          updated: 2000n,
        },
      };

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);

      deepEqual(value, decoded);
    });

    it('should handle large batch of different types', function testLargeBatch() {
      const encoder = createEncoder();
      const schema = array(oneOf(
        integer(),
        text(),
        bytes(),
        boolean(),
        float(),
      ));

      const value = [
        1n, 'text', new Uint8Array([1, 2]), true, 3.14,
        999n, 'another', new Uint8Array([0xFF]), false, 2.71,
        0n, '🎉', new Uint8Array([]), true, 0.5,
      ];

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);

      deepEqual(value, decoded);
    });
  });

  // ============================================================================
  // PHASE 8: EDGE CASES
  // ============================================================================

describe('Edge Cases', function edgeCaseTests() {
    it('should handle empty collections', function testEmptyCollections() {
      const encoder = createEncoder();

      const schemas = [
        array(integer()),
        array(text()),
        map({}),
        map({ a: text(), b: integer() }),
      ];

      const values = [
        [],
        [],
        {},
        { a: '', b: 0n },
      ];

      for (let i = 0; i < schemas.length; i++) {
        const encoded = encoder.encode(schemas[i], values[i]);
        const decoded = decode(schemas[i], encoded);
        deepEqual(decoded, values[i], `Failed for schema index ${i}`);
      }
    });

    it('should handle deeply nested structures', function testDeepNesting() {
      const encoder = createEncoder();

      // Create deeply nested structure: map -> array -> map -> array -> integer
      const schema = map({
        level1: array(
          map({
            level2: array(
              map({
                value: integer(),
              })
            ),
          })
        ),
      });

      const value = {
        level1: [
          { level2: [{ value: 1n }, { value: 2n }] },
          { level2: [{ value: 3n }] },
        ],
      };

      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);

      deepEqual(value, decoded);
    });

    it('should correctly handle integer boundary transitions', function testIntegerBoundaries() {
      const encoder = createEncoder();
      const schema = integer();

      // Test transitions where CBOR byte representation changes
      const boundaries = [
        [22n, 23n, 24n, 25n],
        [254n, 255n, 256n, 257n],
        [65534n, 65535n, 65536n, 65537n],
      ];

      for (const boundarySet of boundaries) {
        for (const value of boundarySet) {
          const encoded = encoder.encode(schema, value);
          const decoded = decode(schema, encoded);
          deepEqual(decoded, value, `Failed at boundary: ${value}`);
        }
      }
    });

    it('should handle unicode edge cases in text', function testUnicodeEdgeCases() {
      const encoder = createEncoder();
      const schema = text();

      const texts = [
        '\u0000',        // Null character
        '\u00FF',        // Extended ASCII
        '\uFFFF',        // Supplementary
        '👨‍👩‍👧‍👦',        // ZWJ sequence (family emoji)
        '\n\r\t',        // Control characters
      ];

      for (const txt of texts) {
        const encoded = encoder.encode(schema, txt);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, txt, `Failed for unicode: ${JSON.stringify(txt)}`);
      }
    });

    it('should handle various byte array lengths', function testByteArrayLengths() {
      const encoder = createEncoder();
      const schema = bytes();

      const lengths = [0, 1, 10, 23, 24, 100, 255, 256, 1000];

      for (const len of lengths) {
        const byteArray = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          byteArray[i] = i % 256;
        }

        const encoded = encoder.encode(schema, byteArray);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, byteArray, `Failed for length ${len}`);
      }
    });
  });

  describe('Composite Types - tag()', function tagTests() {
    it('should encode and decode a simple tagged integer', function testTagSimpleInteger() {
      const encoder = createEncoder();
      const schema = tag(0n, integer(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = 42n;
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode a tagged text string', function testTagText() {
      const encoder = createEncoder();
      const schema = tag(0n, text(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = 'hello world';
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode a tagged complex structure', function testTagComplex() {
      const encoder = createEncoder();
      const schema = tag(0n, map({ name: text(), age: integer() }), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = { name: 'Alice', age: 30n };
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should apply encode transformation before encoding', function testTagEncodeTransform() {
      const encoder = createEncoder();
      const schema = tag(0n, integer(), {
        encode: (value) => value + 10n,
        decode: (value) => value - 10n,
      });

      const input = 5n;
      const encoded = encoder.encode(schema, input);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, input);
    });

    it('should apply decode transformation after decoding', function testTagDecodeTransform() {
      const encoder = createEncoder();
      const schema = tag(0n, text(), {
        encode: (value) => value.toUpperCase(),
        decode: (value) => value.toLowerCase(),
      });

      const input = 'Hello World';
      const encoded = encoder.encode(schema, input);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, 'hello world');
    });

    it('should reject wrong tag number during decoding', function testTagMismatch() {
      const encoder = createEncoder();
      const schema = tag(42n, integer(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = 10n;
      const encoded = encoder.encode(schema, value);

      const wrongSchema = tag(99n, integer(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      throws(() => decode(wrongSchema, encoded), /Expect Tag to be 99/);
    });

    it('should type-check tagged value before encoding', function testTagTypeCheck() {
      const encoder = createEncoder();
      const schema = tag(0n, integer(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      throws(() => encoder.encode(schema, /** @type {any} */ (42)), /integer/);
      throws(() => encoder.encode(schema, /** @type {any} */ ('not-int')), /integer/);
    });

    it('should encode and decode tag with nested array', function testTagNestedArray() {
      const encoder = createEncoder();
      const schema = tag(0n, array(integer()), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = [1n, 2n, 3n, 100n];
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should encode and decode tag with nested map', function testTagNestedMap() {
      const encoder = createEncoder();
      const schema = tag(0n, map({ a: integer(), b: text() }), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = { a: 1n, b: 'test' };
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should work with tag in array', function testTagInArray() {
      const encoder = createEncoder();
      const schema = array(tag(0n, integer(), {
        encode: (value) => value,
        decode: (value) => value,
      }));

      const value = [1n, 2n, 3n];
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should work with tag in map', function testTagInMap() {
      const encoder = createEncoder();
      const schema = map({
        taggedValue: tag(0n, text(), {
          encode: (value) => value,
          decode: (value) => value,
        }),
      });

      const value = { taggedValue: 'hello' };
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should reject non-matching value type during typeCheck', function testTagTypeCheckComplex() {
      const encoder = createEncoder();
      const schema = tag(0n, map({ a: integer() }), {
        encode: (value) => value,
        decode: (value) => value,
      });

      throws(() => encoder.encode(schema, { a: /** @type {any} */ ('not-int') }), /integer/);
    });

    it('should handle tag with bytes value', function testTagWithBytes() {
      const encoder = createEncoder();
      const schema = tag(0n, bytes(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = new Uint8Array([1, 2, 3, 4, 5]);
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should handle tag with boolean value', function testTagWithBoolean() {
      const encoder = createEncoder();
      const schema = tag(0n, boolean(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = true;
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should handle tag with nil value', function testTagWithNil() {
      const encoder = createEncoder();
      const schema = tag(0n, nil(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = null;
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should handle tag with float value', function testTagWithFloat() {
      const encoder = createEncoder();
      const schema = tag(0n, float(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const value = 3.14159;
      const encoded = encoder.encode(schema, value);
      const decoded = decode(schema, encoded);
      deepEqual(decoded, value);
    });

    it('should handle different tag numbers', function testDifferentTagNumbers() {
      const encoder = createEncoder();

      const tagNumbers = [0n, 1n, 24n, 100n, 255n, 1000n];

      for (const tagNum of tagNumbers) {
        const schema = tag(tagNum, text(), {
          encode: (value) => value,
          decode: (value) => value,
        });

        const value = `tag-${tagNum}`;
        const encoded = encoder.encode(schema, value);
        const decoded = decode(schema, encoded);
        deepEqual(decoded, value, `Failed for tag ${tagNum}`);
      }
    });
  });

  describe('tagCheck', function tagCheckTests() {
    it('should return true when tag matches', function testTagCheckMatch() {
      const shape = tag(0n, text(), {
        encode: (value) => value,
        decode: (value) => value,
      });
      const encoder = createEncoder();
      const encoded = encoder.encode(shape, 'hello');

      const result = tagCheck(shape, encoded);
      equal(result, true);
    });

    it('should return false when tag does not match', function testTagCheckMismatch() {
      const shape = tag(42n, text(), {
        encode: (value) => value,
        decode: (value) => value,
      });
      const encoder = createEncoder();
      const encoded = encoder.encode(shape, 'hello');

      const wrongShape = tag(99n, text(), {
        encode: (value) => value,
        decode: (value) => value,
      });

      const result = tagCheck(wrongShape, encoded);
      equal(result, false);
    });

    it('should throw when CBOR data is not a tagged value', function testTagCheckNotTagged() {
      const shape = tag(0n, text(), {
        encode: (value) => value,
        decode: (value) => value,
      });
      const encoder = createEncoder();
      const encoded = encoder.encode(text(), 'hello');

      throws(() => tagCheck(shape, encoded), /Expected Tagged CBOR/);
    });

    it('should work with various tag sizes', function testTagCheckVariousTags() {
      const encoder = createEncoder();
      const tagSizes = [0n, 1n, 23n, 24n, 255n, 256n, 1000n, 65535n];

      for (const tagNum of tagSizes) {
        const shape = tag(tagNum, integer(), {
          encode: (value) => value,
          decode: (value) => value,
        });
        const encoded = encoder.encode(shape, 1n);
        const result = tagCheck(shape, encoded);
        equal(result, true, `Failed for tag ${tagNum}`);
      }
    });

    it('should work with nested tagged structure', function testTagCheckNested() {
      const shape = tag(0n, array(integer()), {
        encode: (value) => value,
        decode: (value) => value,
      });
      const encoder = createEncoder();
      const encoded = encoder.encode(shape, [1n, 2n, 3n]);

      const result = tagCheck(shape, encoded);
      equal(result, true);
    });
  });

});
