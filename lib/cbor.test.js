import { describe, it } from 'node:test';
import {
  array, boolean, bytes, constant, decode, dict, Dict,
  encode, float, integer, map, nil, oneOf, tag, tagCheck, text, typeCheck, transform, undef,
} from './cbor.js';
import { deepEqual, deepStrictEqual, equal, throws } from 'node:assert';

/**
 * Encode a value with the given shape, then decode the result back.
 * @template {import('./cbor.js').Shape} S
 * @param {S} shape
 * @param {import('./cbor.js').EncodeValue<S>} value
 * @returns {import('./cbor.js').InferValue<S>}
 */
function roundtrip(shape, value) {
  return decode(shape, encode(shape, value));
}

describe('Primitives', function primitives() {
  describe('integer()', function integerTests() {
    const schema = integer();

    it('round-trips positive integers in the single-byte range', function testSmallPositive() {
      for (let i = 0n; i <= 23n; i += 1n) {
        deepEqual(roundtrip(schema, i), i, `Failed for integer ${i}`);
      }
    });

    it('round-trips integers at byte-size boundaries', function testBoundaries() {
      const values = [
        0n,                  // Min
        23n,                 // Max single-byte
        24n,                 // First 1-byte value
        255n,                // Max 1-byte value
        256n,                // First 2-byte value
        65535n,              // Max 2-byte value
        65536n,              // First 4-byte value
        0xFFFFFFFFn,         // Max 4-byte value
        0x100000000n,        // First 8-byte value
        0xFFFFFFFFFFFFFFFFn, // Max 8-byte value
      ];

      for (const value of values) {
        deepEqual(roundtrip(schema, value), value, `Failed for integer ${value}`);
      }
    });

    it('round-trips negative integers across byte-size boundaries', function testNegative() {
      const values = [
        -1n,                 // Max negative single-byte
        -23n,                // Last single-byte negative
        -24n,                // First 1-byte value
        -255n,               // Max 1-byte value
        -256n,               // First 2-byte value
        -65535n,             // Max 2-byte value
        -65536n,             // First 4-byte value
        -0xFFFFFFFFn,        // Max 4-byte value
        -0x100000000n,       // First 8-byte value
        -0xFFFFFFFFFFFFFFFFn,// Max 8-byte value
      ];

      for (const value of values) {
        deepEqual(roundtrip(schema, value), value, `Failed for negative integer ${value}`);
      }
    });

    it('rejects non-bigint values', function testTypeReject() {
      throws(() => encode(schema, /** @type {any} */(123)), { message: /Expected integer/ });
      throws(() => encode(schema, /** @type {any} */('not an int')), { message: /Expected integer/ });
      throws(() => encode(schema, /** @type {any} */({})), { message: /Expected integer/ });
      throws(() => encode(schema, /** @type {any} */(true)), { message: /Expected integer/ });
      throws(() => encode(schema, /** @type {any} */(42)), { message: /Expected integer/ });
    });
  });

  describe('text()', function textTests() {
    const schema = text();

    it('round-trips text strings', function testBasic() {
      const strings = [
        '',                    // Empty
        'a',                   // Single character
        'hello world',         // ASCII
        '你好',                 // Multi-byte UTF-8
        '🎉🚀✨',               // Emoji
        'Café',                // Accent marks
      ];

      for (const str of strings) {
        deepEqual(roundtrip(schema, str), str, `Failed for text: "${str}"`);
      }
    });

    it('round-trips unicode edge cases', function testUnicodeEdgeCases() {
      const strings = [
        '\u0000',   // Null character
        '\u00FF',   // Extended ASCII
        '\uFFFF',   // BMP boundary
        '👨‍👩‍👧‍👦',   // ZWJ sequence
        '\n\r\t',   // Control characters
      ];

      for (const str of strings) {
        deepEqual(roundtrip(schema, str), str, `Failed for unicode: ${JSON.stringify(str)}`);
      }
    });

    it('rejects non-string values', function testTypeReject() {
      throws(() => encode(schema, /** @type {any} */(123)), { message: /Expected text/ });
      throws(() => encode(schema, /** @type {any} */(null)), { message: /Expected text/ });
    });
  });

  describe('bytes()', function bytesTests() {
    const schema = bytes();

    it('round-trips byte strings of various lengths', function testBasic() {
      const lengths = [0, 1, 10, 23, 24, 100, 255, 256, 1000];

      for (const len of lengths) {
        const data = new Uint8Array(len);
        for (let i = 0; i < len; i++) data[i] = i % 256;

        const decoded = roundtrip(schema, data);
        deepStrictEqual([...decoded], [...data], `Failed for length ${len}`);
      }
    });

    it('round-trips bytes nested in arrays', function testInArray() {
      const arraySchema = array(bytes());
      const value = [new Uint8Array([]), new Uint8Array([1, 2, 3]), new Uint8Array(256)];

      const decoded = roundtrip(arraySchema, value);
      equal(decoded.length, value.length);
      for (let i = 0; i < value.length; i++) {
        deepStrictEqual([...decoded[i]], [...value[i]], `Failed for item ${i}`);
      }
    });

    it('rejects non-Uint8Array values', function testTypeReject() {
      throws(() => encode(schema, /** @type {any} */('not bytes')), { message: /Expected bytes/ });
      throws(() => encode(schema, /** @type {any} */([1, 2, 3])), { message: /Expected bytes/ });
    });
  });

  describe('boolean(), nil(), undef()', function simpleTests() {
    it('round-trips booleans', function testBoolean() {
      const schema = boolean();

      deepEqual(roundtrip(schema, true), true);
      deepEqual(roundtrip(schema, false), false);
      throws(() => encode(schema, /** @type {any} */(1)), { message: /Expected boolean/ });
      throws(() => encode(schema, /** @type {any} */('true')), { message: /Expected boolean/ });
    });

    it('round-trips null', function testNil() {
      const schema = nil();

      deepEqual(roundtrip(schema, null), null);
      throws(() => encode(schema, /** @type {any} */(undefined)), { message: /Expected null/ });
      throws(() => encode(schema, /** @type {any} */(0)), { message: /Expected null/ });
    });

    it('round-trips undefined', function testUndef() {
      const schema = undef();

      deepEqual(roundtrip(schema, undefined), undefined);
      throws(() => encode(schema, /** @type {any} */(null)), { message: /Expected undefined/ });
      throws(() => encode(schema, /** @type {any} */(0)), { message: /Expected undefined/ });
    });
  });

  describe('float()', function floatTests() {
    const schema = float();

    it('round-trips floating point numbers', function testBasic() {
      const numbers = [
        0,
        1.5,
        -3.14,
        123.456,
        1e-10,     // Very small
        1e20,      // Very large
        0.1 + 0.2, // Requires Float64 precision
      ];

      for (const num of numbers) {
        deepEqual(roundtrip(schema, num), num, `Failed for float ${num}`);
      }
    });

    it('rejects NaN and Infinity', function testSpecialValues() {
      throws(() => encode(schema, NaN), { message: /NaN and Infinity/ });
      throws(() => encode(schema, Infinity), { message: /NaN and Infinity/ });
      throws(() => encode(schema, -Infinity), { message: /NaN and Infinity/ });
    });

    it('rejects non-number values', function testTypeReject() {
      throws(() => encode(schema, /** @type {any} */('1.5')), { message: /Expected float/ });
      throws(() => encode(schema, /** @type {any} */(123n)), { message: /Expected float/ });
    });
  });
});

describe('array()', function arrayTests() {
  it('round-trips arrays, including empty and nested', function testBasics() {
    deepStrictEqual(roundtrip(array(integer()), []), []);
    deepStrictEqual(roundtrip(array(integer()), [1n, 2n, 3n, 100n, 999999n]), [1n, 2n, 3n, 100n, 999999n]);
    deepStrictEqual(roundtrip(array(array(integer())), [[1n, 2n], [3n], [4n, 5n, 6n]]), [[1n, 2n], [3n], [4n, 5n, 6n]]);
  });

  it('round-trips arrays of union types', function testWithOneOf() {
    const schema = array(oneOf(integer(), text()));
    deepStrictEqual(roundtrip(schema, [1n, 'hello', 999n, 'world', 0n]), [1n, 'hello', 999n, 'world', 0n]);
  });

  it('rejects arrays with mismatched item types', function testTypeReject() {
    const schema = array(integer());

    throws(() => encode(schema, [1n, /** @type {any} */ ('not-int'), 3n]), { message: /integer/ });
    throws(() => encode(schema, [/** @type {any} */ ('string')]), { message: /integer/ });
  });
});

describe('dict()', function dictTests() {
  describe('record-style (constant keys)', function recordTests() {
    it('round-trips an empty dict', function testEmpty() {
      const schema = dict();
      deepStrictEqual(roundtrip(schema, new Dict()), new Dict());
      deepStrictEqual(roundtrip(schema, []), new Dict());
    });

    it('round-trips records with mixed value types from plain pair arrays', function testBasic() {
      const schema = dict(
        [constant('name'), text()],
        [constant('age'), integer()],
        [constant('active'), boolean()],
      );

      deepStrictEqual(
        roundtrip(schema, [['name', 'Alice'], ['age', 30n], ['active', true]]),
        new Dict([['name', 'Alice'], ['age', 30n], ['active', true]]),
      );
    });

    it('round-trips records encoded from Dict instances', function testDictInstance() {
      const schema = dict(
        [constant('name'), text()],
        [constant('age'), integer()],
      );

      const value = new Dict([['name', 'Bob'], ['age', 40n]]);
      deepStrictEqual(roundtrip(schema, value), value);
    });

    it('round-trips nested records', function testNested() {
      const schema = dict(
        [constant('user'), dict(
          [constant('name'), text()],
          [constant('age'), integer()],
        )],
        [constant('active'), boolean()],
      );

      deepStrictEqual(
        roundtrip(schema, [['user', [['name', 'Charlie'], ['age', 25n]]], ['active', true]]),
        new Dict([
          ['user', new Dict([['name', 'Charlie'], ['age', 25n]])],
          ['active', true],
        ]),
      );
    });

    it('round-trips deeply nested record/array mixes', function testDeepNesting() {
      const schema = dict(
        [constant('level1'), array(dict(
          [constant('level2'), array(dict(
            [constant('value'), integer()],
          ))],
        ))],
      );

      /** @param {bigint[]} values */
      const level2 = (values) => new Dict([
        ['level2', values.map((v) => new Dict([['value', v]]))],
      ]);

      deepStrictEqual(
        roundtrip(schema, [
          ['level1', [
            [['level2', [[['value', 1n]], [['value', 2n]]]]],
            [['level2', [[['value', 3n]]]]],
          ]],
        ]),
        new Dict([['level1', [level2([1n, 2n]), level2([3n])]]]),
      );
    });

    it('rejects mismatched value types', function testValueReject() {
      const schema = dict(
        [constant('name'), text()],
        [constant('age'), integer()],
      );

      throws(() => encode(schema, [['name', 'Dave'], ['age', /** @type {any} */ ('30')]]), { message: /integer/ });
      throws(() => encode(schema, [['name', /** @type {any} */ (123)], ['age', 30n]]), { message: /text/ });
    });

    it('rejects mismatched value types nested inside arrays', function testNestedReject() {
      const schema = array(dict(
        [constant('id'), integer()],
        [constant('name'), text()],
      ));

      throws(
        () => encode(schema, [[['id', 1n], ['name', 'good']], [['id', /** @type {any} */ ('bad-id')], ['name', 'bad']]]),
        /integer/,
      );
    });
  });

  describe('non-string keys', function nonStringKeyTests() {
    it('round-trips dicts with mixed key types', function testNonStringKeys() {
      const schema = dict(
        [integer(), text()],
        [text(), boolean()],
      );

      const value = new Dict([
        [1n, 'one'],
        [2n, 'two'],
        ['flag', true],
      ]);

      deepStrictEqual(roundtrip(schema, value), value);
    });

    it('encodes non-string-key dicts from plain pair arrays', function testPairArray() {
      const schema = dict(
        [integer(), text()],
        [text(), boolean()],
      );

      deepStrictEqual(
        roundtrip(schema, [[1n, 'one'], ['flag', true]]),
        new Dict([[1n, 'one'], ['flag', true]]),
      );
    });

    it('rejects overlapping key shapes at construction', function testDisjoint() {
      throws(() => dict([text(), integer()], [text(), boolean()]), /disjoint/);
      throws(() => dict([integer(), text()], [integer(), boolean()]), /disjoint/);
    });
  });
});

describe('map()', function mapTests() {
  it('round-trips record-style dicts via pairs arrays', function testRoundtrip() {
    const schema = map({ sql: text(), flavor: integer() });
    const cbor = encode(schema, [['sql', 'SELECT 1'], ['flavor', 7n]]);
    const decoded = decode(schema, cbor);
    equal(decoded.get('sql'), 'SELECT 1');
    equal(decoded.get('flavor'), 7n);
  });

  it('is byte-identical to the equivalent dict() schema', function testEquivalence() {
    const fromMap = map({ sql: text(), flavor: integer() });
    const fromDict = dict([constant('sql'), text()], [constant('flavor'), integer()]);
    deepEqual(
      encode(fromMap, [['sql', 'SELECT 1'], ['flavor', 7n]]),
      encode(fromDict, [['sql', 'SELECT 1'], ['flavor', 7n]]),
    );
  });

  it('rejects wrong value at runtime', function testRejects() {
    const schema = map({ sql: text(), flavor: integer() });
    throws(() => encode(schema, [['sql', 'x'], ['flavor', /** @type {any} */ ('bad')]]), /Expected integer/);
  });

  it('rejects decoding when some keys are missing from map', function testMissingKeys() {
    const schema = map({ sql: text(), flavor: integer() });

    const encoded = encode(map({ sql: text() }), [['sql', 'SELECT 1']]);
    throws(() => decode(schema, encoded), { message: /Some keys are missing from map: flavor/ });
  });

  it('nests inside dict() and array()', function testNested() {
    const schema = dict(
      [constant('meta'), map({ author: text() })],
      [constant('rows'), array(map({ id: integer(), name: text() }))],
    );
    const decoded = decode(schema, encode(schema, [
      ['meta', [['author', 'Alice']]],
      ['rows', [[['id', 1n], ['name', 'one']]]],
    ]));
    const meta = decoded.get('meta');
    const rows = decoded.get('rows');
    equal(meta?.get('author'), 'Alice');
    equal(rows?.[0]?.get('name'), 'one');
  });
});

describe('oneOf()', function oneOfTests() {
  it('round-trips values matching any variant', function testBasic() {
    const schema = oneOf(integer(), text());

    deepEqual(roundtrip(schema, 42n), 42n);
    deepEqual(roundtrip(schema, 'hello'), 'hello');
  });

  it('rejects values matching no variant', function testReject() {
    const schema = oneOf(integer(), text());

    throws(() => encode(schema, /** @type {any} */(true)), /variant|oneOf/i);
    throws(() => encode(schema, /** @type {any} */(null)), /variant|oneOf/i);
  });

  it('works nested inside other shapes', function testNested() {
    const schema = array(oneOf(
      integer(), text(), bytes(), boolean(), float(), nil(),
    ));

    deepStrictEqual(
      roundtrip(schema, [1n, 'text', new Uint8Array([1, 2]), true, 3.14, null]),
      [1n, 'text', new Uint8Array([1, 2]), true, 3.14, null],
    );
  });
});

describe('constant()', function constantTests() {
  it('creates unions of fixed values inside oneOf', function testInOneOf() {
    const schema = oneOf(
      constant('active'),
      constant('inactive'),
    );

    deepEqual(roundtrip(schema, 'active'), 'active');
    deepEqual(roundtrip(schema, 'inactive'), 'inactive');
    throws(() => encode(schema, /** @type {any} */('pending')), /does not match any variant/i);
  });

  it('supports numeric constants', function testNumeric() {
    const schema = oneOf(constant(1), constant(2), constant(3));

    for (const v of /** @type {const} */ ([1, 2, 3])) {
      deepEqual(roundtrip(schema, v), v);
    }
  });
});

describe('typeCheck()', function typeCheckTests() {
  it('validates primitives', function testPrimitives() {
    equal(typeCheck(integer(), 42n), true);
    equal(typeCheck(integer(), 42), false);
    equal(typeCheck(text(), 'hi'), true);
    equal(typeCheck(text(), 123n), false);
    equal(typeCheck(bytes(), new Uint8Array([1])), true);
    equal(typeCheck(bytes(), [1]), false);
    equal(typeCheck(boolean(), true), true);
    equal(typeCheck(boolean(), 1), false);
    equal(typeCheck(nil(), null), true);
    equal(typeCheck(nil(), undefined), false);
    equal(typeCheck(undef(), undefined), true);
    equal(typeCheck(undef(), null), false);
  });

  it('validates composites', function testComposites() {
    equal(typeCheck(array(integer()), [1n, 2n]), true);
    equal(typeCheck(array(integer()), [1n, 'nope']), false);
    equal(typeCheck(array(integer()), 'nope'), false);

    const recordSchema = dict(
      [constant('name'), text()],
      [constant('age'), integer()],
    );
    equal(typeCheck(recordSchema, new Dict([['name', 'Ada'], ['age', 1n]])), true);
    equal(typeCheck(recordSchema, new Dict([['name', 'Ada']])), true); // Empty for a key is fine
    equal(typeCheck(recordSchema, new Dict([['name', 'Ada'], ['age', 'nope']])), false);
    equal(typeCheck(recordSchema, [['name', 'Ada']]), false); // Plain pairs are encode-only
    equal(typeCheck(oneOf(integer(), text()), 1n), true);
    equal(typeCheck(oneOf(integer(), text()), []), false);
  });

  it('validates constants and tagged values', function testConstAndTag() {
    const constSchema = oneOf(constant('active'), constant('inactive'));
    equal(typeCheck(constSchema, 'active'), true);
    equal(typeCheck(constSchema, 'unknown'), false);

    equal(typeCheck(tag(0n, integer()), 42n), true);
    equal(typeCheck(tag(0n, integer()), 42), false);
  });
});

describe('Encoder', function encoderTests() {
  it('reuses its buffer across encode calls', function testBufferReuse() {
    const schema = text();

    const encoded1 = encode(schema, 'small');
    const encoded2 = encode(schema, 'text');

    deepEqual(encoded1.length, encoded1.byteLength);
    deepEqual(encoded2.length, encoded2.byteLength);
    deepEqual(decode(schema, encoded1), 'small');
    deepEqual(decode(schema, encoded2), 'text');
  });

  it('grows its buffer for large data', function testBufferGrowth() {
    const schema = text();

    for (const str of ['x'.repeat(500), 'y'.repeat(2000), 'z'.repeat(100)]) {
      deepEqual(decode(schema, encode(schema, str)), str);
    }
  });
});

describe('Decoder', function decoderTests() {
  it('rejects truncated CBOR data', function testTruncated() {
    const encoded = encode(text(), 'hello world');
    throws(() => decode(text(), encoded.slice(0, Math.floor(encoded.length / 2))), /Unexpected end|Invalid typed array|RangeError/);
  });

  it('rejects CBOR data with extra bytes after the value', function testExtraData() {
    const encoded = encode(text(), 'hello');

    const extraData = new Uint8Array(encoded.length + 1);
    extraData.set(encoded);
    extraData[encoded.length] = 0xFF; // Junk byte

    throws(() => decode(text(), extraData), /Extra data/);
  });

  it('rejects CBOR data that does not match the schema', function testSchemaMismatch() {
    const encodedInt = encode(integer(), 42n);
    throws(() => decode(text(), encodedInt), /does not match|match the provided shape/);
  });

  it('rejects an empty CBOR stream', function testEmptyData() {
    throws(() => decode(integer(), new Uint8Array([])), /Unexpected end/);
  });
});

describe('Integration', function integrationTests() {
  it('round-trips a complex nested structure', function testComplex() {
    const schema = dict(
      [constant('name'), text()],
      [constant('age'), integer()],
      [constant('photo'), bytes()],
      [constant('hobbies'), array(oneOf(text(), integer()))],
    );

    deepStrictEqual(
      roundtrip(schema, [
        ['name', 'Alice'],
        ['age', 30n],
        ['photo', new Uint8Array([0xFF, 0xD8, 0xFF])], // JPEG header bytes
        ['hobbies', ['reading', 'hiking', 5n]],
      ]),
      new Dict([
        ['name', 'Alice'],
        ['age', 30n],
        ['photo', new Uint8Array([0xFF, 0xD8, 0xFF])],
        ['hobbies', ['reading', 'hiking', 5n]],
      ]),
    );
  });

  it('round-trips a record covering every primitive type', function testAllTypes() {
    const schema = dict(
      [constant('id'), integer()],
      [constant('title'), text()],
      [constant('data'), bytes()],
      [constant('isActive'), boolean()],
      [constant('nullable'), nil()],
      [constant('optional'), undef()],
      [constant('rating'), float()],
      [constant('tags'), array(text())],
      [constant('metadata'), dict(
        [constant('created'), integer()],
        [constant('updated'), integer()],
      )],
    );

    deepStrictEqual(
      roundtrip(schema, [
        ['id', 123n],
        ['title', 'Complete Item'],
        ['data', new Uint8Array([0xAA, 0xBB, 0xCC])],
        ['isActive', true],
        ['nullable', null],
        ['optional', undefined],
        ['rating', 4.5],
        ['tags', ['important', 'test', '🏷️']],
        ['metadata', [['created', 1000n], ['updated', 2000n]]],
      ]),
      new Dict([
        ['id', 123n],
        ['title', 'Complete Item'],
        ['data', new Uint8Array([0xAA, 0xBB, 0xCC])],
        ['isActive', true],
        ['nullable', null],
        ['optional', undefined],
        ['rating', 4.5],
        ['tags', ['important', 'test', '🏷️']],
        ['metadata', new Dict([['created', 1000n], ['updated', 2000n]])],
      ]),
    );
  });
});

describe('tag()', function tagTests() {
  it('round-trips tagged values across shapes', function testRoundTrip() {
    /** @type {[string, import('./cbor.js').Shape, unknown, unknown][]} */
    const cases = [
      ['integer', integer(), 42n, 42n],
      ['text', text(), 'hello world', 'hello world'],
      ['bytes', bytes(), new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([1, 2, 3, 4, 5])],
      ['boolean', boolean(), true, true],
      ['nil', nil(), null, null],
      ['float', float(), 3.14159, 3.14159],
      ['array', array(integer()), [1n, 2n, 3n, 100n], [1n, 2n, 3n, 100n]],
      ['record',
        dict([constant('name'), text()]),
        [['name', 'Alice']],
        new Dict([['name', 'Alice']]),
      ],
    ];

    for (const [label, inner, value, expected] of cases) {
      deepEqual(roundtrip(tag(0n, inner), value), expected, `Failed for tag(${label})`);
    }
  });

  it('rejects a wrong tag number during decoding', function testMismatch() {
    const encoded = encode(tag(42n, integer()), 10n);
    throws(() => decode(tag(99n, integer()), encoded), /Expect Tag to be 99/);
  });

  it('type-checks the tagged value before encoding', function testTypeReject() {
    const schema = tag(0n, integer());

    throws(() => encode(schema, /** @type {any} */(42)), /integer/);
    throws(() => encode(schema, /** @type {any} */('not-int')), /integer/);
  });

  it('supports various tag numbers and sizes', function testTagNumbers() {
    for (const tagNum of [0n, 1n, 23n, 24n, 255n, 256n, 1000n, 65535n]) {
      deepEqual(roundtrip(tag(tagNum, text()), `tag-${tagNum}`), `tag-${tagNum}`, `Failed for tag ${tagNum}`);
    }
  });

  it('works inside arrays and records', function testNested() {
    deepStrictEqual(
      roundtrip(array(tag(0n, integer())), [1n, 2n, 3n]),
      [1n, 2n, 3n],
    );

    const schema = dict([constant('tagged'), tag(0n, text())]);
    deepStrictEqual(
      roundtrip(schema, [['tagged', 'hello']]),
      new Dict([['tagged', 'hello']]),
    );
  });
});

describe('transform()', function transformTests() {
  it('applies the decode transformation after decoding', function testDecodeTransform() {
    const schema = transform(
      integer(),
      (value) => value - 10n,
      (value) => value + 10n,
    );

    deepEqual(roundtrip(schema, 5n), 5n);
  });

  it('applies the encode transformation before encoding', function testEncodeTransform() {
    const schema = transform(
      text(),
      (value) => value.toLowerCase(),
      (value) => value.toUpperCase(),
    );

    const decoded = decode(schema, encode(schema, 'Hello World'));
    deepEqual(decoded, 'hello world');
  });

  it('type-checks the original value before transforming', function testTypeReject() {
    const schema = transform(integer(), (value) => value, (value) => value);

    throws(() => encode(schema, /** @type {any} */(42)), /integer/);
    throws(() => encode(schema, /** @type {any} */('not-int')), /integer/);
  });

  it('works inside arrays and records', function testNested() {
    const arraySchema = array(transform(integer(), (value) => value, (value) => value));
    deepStrictEqual(roundtrip(arraySchema, [1n, 2n, 3n]), [1n, 2n, 3n]);

    const recordSchema = dict(
      [constant('value'), transform(integer(), (value) => value, (value) => value)],
    );
    deepStrictEqual(
      roundtrip(recordSchema, [['value', 42n]]),
      new Dict([['value', 42n]]),
    );
  });

  it('maps decoded values into plain JS objects', function testToPlainObject() {
    const schema = transform(
      dict(
        [constant('x'), integer()],
        [constant('y'), integer()],
      ),
      (obj) => ({ x: Number(obj.get('x')), y: Number(obj.get('y')) }),
      (coord) => new Dict([['x', BigInt(coord.x)], ['y', BigInt(coord.y)]]),
    );

    deepEqual(roundtrip(schema, { x: 1, y: 2 }), { x: 1, y: 2 });
  });

  it('works with tag(0n) as a date/time string', function testDateTime() {
    const schema = tag(0n, transform(
      text(),
      (value) => new Date(value),
      (value) => value.toString(),
    ));

    const decoded = roundtrip(schema, new Date('2024-01-15T10:30:00Z'));
    equal(decoded instanceof Date, true, 'shall be Date');
  });

  it('works with tag(1n) as an epoch timestamp', function testTimestamp() {
    const schema = tag(1n, transform(
      integer(),
      (value) => new Date(Number(value) * 1000),
      (value) => BigInt(Math.floor(value.getTime() / 1000)),
    ));

    const decoded = roundtrip(schema, new Date('2024-01-15T10:30:00Z'));
    equal(decoded instanceof Date, true, 'shall be Date');
  });

  it('reconstructs custom classes', function testCustomClass() {
    class Coordinate {
      /**
       * @param {number} x
       * @param {number} y
       */
      constructor(x, y) { this.x = x; this.y = y; }
    }

    const schema = tag(100n, transform(
      dict(
        [constant('x'), integer()],
        [constant('y'), integer()],
      ),
      (obj) => new Coordinate(Number(obj.get('x')), Number(obj.get('y'))),
      (coord) => new Dict([['x', BigInt(coord.x)], ['y', BigInt(coord.y)]]),
    ));

    const input = new Coordinate(100, 200);
    const output = roundtrip(schema, input);

    equal(output instanceof Coordinate, true, 'shall be Coordinate');
    deepEqual(output.x, input.x);
    deepEqual(output.y, input.y);
  });
});

describe('tagCheck()', function tagCheckTests() {
  it('returns true when the tag matches', function testMatch() {
    equal(tagCheck(tag(0n, text()), encode(tag(0n, text()), 'hello')), true);
  });

  it('returns false when the tag does not match', function testMismatch() {
    equal(tagCheck(tag(99n, text()), encode(tag(42n, text()), 'hello')), false);
  });

  it('throws when the CBOR data is not tagged', function testNotTagged() {
    const shape = tag(0n, text());
    throws(() => tagCheck(shape, encode(text(), 'hello')), /Expected Tagged CBOR/);
  });

  it('works for various tag sizes and with transforms', function testVariants() {
    for (const tagNum of [0n, 1n, 23n, 24n, 255n, 256n, 1000n, 65535n]) {
      equal(tagCheck(tag(tagNum, integer()), encode(tag(tagNum, integer()), 1n)), true, `Failed for tag ${tagNum}`);
    }

    const withTransform = tag(0n, transform(text(), (value) => value, (value) => value));
    equal(tagCheck(withTransform, encode(withTransform, 'hello')), true);
    equal(tagCheck(tag(99n, transform(text(), (value) => value, (value) => value)), encode(withTransform, 'hello')), false);
  });
});

describe('Global encode()', function globalEncodeTests() {
  it('exposes a standalone encode matching encode', function testStandalone() {
    const schema = dict([constant('greeting'), text()]);

    const standalone = encode(schema, [['greeting', 'hi']]);
    const instance = encode(schema, [['greeting', 'hi']]);

    deepEqual(standalone, instance);
    deepStrictEqual(decode(schema, standalone), new Dict([['greeting', 'hi']]));
  });
});
