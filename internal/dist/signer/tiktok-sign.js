"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCODER_B = exports.ENCODER_A = exports.DEFAULT_SCM_VERSION = exports.DEFAULT_SDK_VERSION = exports.BOGUS_VALUE = exports.GNARLY_PARAM = exports.BOGUS_PARAM = exports.MS_TOKEN_PARAM = exports.DYNOSAUR_PARAM = void 0;
exports.encodeQuery = encodeQuery;
exports.hashState = hashState;
exports.encodeField = encodeField;
exports.packPayload = packPayload;
exports.mixState = mixState;
exports.foldChecksum = foldChecksum;
exports.seal = seal;
exports.dynosaurPayload = dynosaurPayload;
exports.gnarlyFields = gnarlyFields;
exports.gnarlyPayload = gnarlyPayload;
exports.signRequest = signRequest;
exports.extractSignatureParameters = extractSignatureParameters;
const crypto_1 = require("crypto");
const MASK32 = 0xffffffff;
exports.DYNOSAUR_PARAM = 'X-Dynosaur';
exports.MS_TOKEN_PARAM = 'msToken';
exports.BOGUS_PARAM = 'X-Bogus';
exports.GNARLY_PARAM = 'X-Gnarly';
exports.BOGUS_VALUE = '1';
const ENVELOPE_TAG = 0x4b;
const ALPHABET = 'u09tbS3UvgDEe6r-ZVMXzLpsAohTn7mdINQlW412GqBjfYiyk8JORCF5/xKHwacP';
const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CHACHA_INIT = [1196819126, 600974999, 3863347763, 1451689750];
const FNV_OFFSET = 2166136260;
const FNV_PRIME = 16777619;
const KEY_WORDS = 12;
exports.DEFAULT_SDK_VERSION = '5.3.2';
exports.DEFAULT_SCM_VERSION = '2.0.0.561';
const ENV_CODE = 65;
const UB_CODE = 8;
const VM_STATE_HASH = 0xc46ce353;
const CANVAS_HASH = '-1';
const WEBGL_HASH = '0';
const COMPONENT_VERSION = '0';
const DEVICE_HASH = '0';
const DEFAULT_PAGE = 'www.tiktok.com/';
const CALL_SEQUENCE_START = 1;
exports.ENCODER_A = [103, 1, null, 2, 1];
exports.ENCODER_B = [102, 0, 165, 1, 0];
const MUST_ESCAPE = {
    ' ': '%20',
    '"': '%22',
    '<': '%3C',
    '>': '%3E',
    '`': '%60',
    '#': '%23',
};
function escapeQueryComponent(text) {
    let out = '';
    for (const ch of text) {
        if (ch in MUST_ESCAPE) {
            out += MUST_ESCAPE[ch];
        }
        else if (ch > ' ' && ch <= '~') {
            out += ch;
        }
        else {
            for (const byte of Buffer.from(ch, 'utf8')) {
                out += `%${byte.toString(16).toUpperCase().padStart(2, '0')}`;
            }
        }
    }
    return out;
}
function encodeQuery(pairs) {
    return pairs.map(([k, v]) => `${escapeQueryComponent(k)}=${escapeQueryComponent(v)}`).join('&');
}
function hashState(text) {
    let value = FNV_OFFSET;
    for (const byte of Buffer.from(text, 'utf8')) {
        const step = Math.imul(value ^ byte, FNV_PRIME) >>> 0;
        value = (step + Math.imul(step, 32)) >>> 0;
    }
    return value;
}
function encodeField(text, config) {
    const [xorBase, addBase, preXor, rotate, postAdd] = config;
    const chars = Array.from(text);
    const size = Math.max(chars.length + 2, 6);
    const out = Buffer.alloc(size);
    chars.forEach((char, index) => {
        let value = (char.codePointAt(0) ^ (xorBase + index)) & MASK32;
        value = (value + addBase + (170 & index)) % 256;
        if (preXor !== null)
            value ^= preXor;
        value = ((value << rotate) | (value >> (8 - rotate))) & 0xff;
        out[index] = ((value ^ 187) + postAdd) % 256;
    });
    for (let index = chars.length; index < size - 2; index++) {
        out[index] = (221 + index) & 0xff;
    }
    out[size - 2] = 0;
    out[size - 1] = chars.length;
    return out;
}
function be(value, size) {
    const out = Buffer.alloc(size);
    out.writeUIntBE(value >>> 0, 0, size);
    return out;
}
function le(value, size) {
    const out = Buffer.alloc(size);
    out.writeUIntLE(value >>> 0, 0, size);
    return out;
}
function packPayload(fields, order, leadCount = false) {
    const keys = order ? [...order] : [...fields.keys()].sort((a, b) => a - b);
    const parts = [];
    for (const key of keys) {
        const value = fields.get(key);
        if (!value)
            continue;
        parts.push(Buffer.from([key, 0, value.length]), value);
    }
    const body = Buffer.concat(parts);
    return leadCount ? Buffer.concat([Buffer.from([keys.length]), body]) : body;
}
function mixState(timestamp, nonce, envCode = ENV_CODE) {
    const folded = ((timestamp >>> 16) ^ (nonce >>> 16) ^ timestamp ^ nonce) & 0xffff;
    return (folded | (envCode << 16)) >>> 0;
}
function foldChecksum(values, mode) {
    let accumulator = MASK32;
    for (const value of values) {
        let number;
        if (typeof value === 'string') {
            const raw = Buffer.from(value, 'utf8').subarray(0, 4);
            number = mode === 1 ? 0 : raw.length === 0 ? 0 : raw.readUIntBE(0, raw.length);
        }
        else {
            number = value;
        }
        accumulator = (accumulator ^ (number >>> 0)) >>> 0;
    }
    return accumulator >>> 0;
}
function rotl(value, bits) {
    return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}
function quarterRound(state, a, b, c, d) {
    state[a] = (state[a] + state[b]) >>> 0;
    state[d] = (state[d] ^ state[a]) >>> 0;
    state[d] = rotl(state[d], 16);
    state[c] = (state[c] + state[d]) >>> 0;
    state[b] = (state[b] ^ state[c]) >>> 0;
    state[b] = rotl(state[b], 12);
    state[a] = (state[a] + state[b]) >>> 0;
    state[d] = (state[d] ^ state[a]) >>> 0;
    state[d] = rotl(state[d], 8);
    state[c] = (state[c] + state[d]) >>> 0;
    state[b] = (state[b] ^ state[c]) >>> 0;
    state[b] = rotl(state[b], 7);
}
function keystream(state, rounds) {
    const working = [...state];
    let done = 0;
    while (done < rounds) {
        quarterRound(working, 0, 4, 8, 12);
        quarterRound(working, 1, 5, 9, 13);
        quarterRound(working, 2, 6, 10, 14);
        quarterRound(working, 3, 7, 11, 15);
        done += 1;
        if (done >= rounds)
            break;
        quarterRound(working, 0, 5, 10, 15);
        quarterRound(working, 1, 6, 11, 12);
        quarterRound(working, 2, 7, 12, 13);
        quarterRound(working, 3, 4, 13, 14);
        done += 1;
    }
    return working.map((word, i) => (word + state[i]) >>> 0);
}
function crypt(key, rounds, payload) {
    const state = [...CHACHA_INIT, ...key.map((word) => word >>> 0)];
    const length = payload.length;
    const wordCount = Math.ceil(length / 4);
    const words = new Array(wordCount);
    for (let i = 0; i < wordCount; i++) {
        const slice = Buffer.alloc(4);
        payload.copy(slice, 0, i * 4, Math.min(i * 4 + 4, length));
        words[i] = slice.readUInt32LE(0);
    }
    let offset = 0;
    while (offset + 16 < wordCount) {
        const block = keystream(state, rounds);
        state[12] = (state[12] + 1) >>> 0;
        for (let i = 0; i < 16; i++)
            words[offset + i] = (words[offset + i] ^ block[i]) >>> 0;
        offset += 16;
    }
    const block = keystream(state, rounds);
    for (let i = 0; i < wordCount - offset; i++) {
        words[offset + i] = (words[offset + i] ^ block[i]) >>> 0;
    }
    const out = Buffer.alloc(wordCount * 4);
    words.forEach((word, i) => out.writeUInt32LE(word >>> 0, i * 4));
    return out.subarray(0, length);
}
function toCustomAlphabet(standard) {
    let out = '';
    for (const ch of standard) {
        const index = STANDARD.indexOf(ch);
        out += index >= 0 ? ALPHABET[index] : ch;
    }
    return out;
}
function seal(payload, key) {
    const rounds = (key.reduce((sum, word) => sum + (word & 0xf), 0) & 0xf) + 5;
    const ciphertext = crypt(key, rounds, payload);
    const keyBytes = Buffer.concat(key.map((word) => le(word, 4)));
    const position = (keyBytes.reduce((a, b) => a + b, 0) + ciphertext.reduce((a, b) => a + b, 0)) %
        (ciphertext.length + 1);
    const spliced = Buffer.concat([
        ciphertext.subarray(0, position),
        keyBytes,
        ciphertext.subarray(position),
    ]);
    return toCustomAlphabet(Buffer.concat([Buffer.from([ENVELOPE_TAG]), spliced]).toString('base64'));
}
function md5Hex(input) {
    return (0, crypto_1.createHash)('md5').update(input).digest('hex');
}
function clockNonce() {
    return Number((BigInt(Date.now()) * 1000n) & 0xffffffffn);
}
function randomKey() {
    const bytes = (0, crypto_1.randomBytes)(KEY_WORDS * 4);
    return Array.from({ length: KEY_WORDS }, (_, i) => bytes.readUInt32LE(i * 4));
}
function dynosaurPayload(query, userAgent, options) {
    const { timestamp, nonce, sequence = CALL_SEQUENCE_START } = options;
    const page = options.page ?? DEFAULT_PAGE;
    const { sdkVersion, scmVersion } = options.versions ?? {
        sdkVersion: exports.DEFAULT_SDK_VERSION,
        scmVersion: exports.DEFAULT_SCM_VERSION,
    };
    const fields = new Map([
        [0x21, encodeField('1', exports.ENCODER_B)],
        [0x22, encodeField('1', exports.ENCODER_B)],
        [0x23, encodeField('0', exports.ENCODER_A)],
        [0x24, encodeField(String(mixState(timestamp, nonce, options.envCode)), exports.ENCODER_A)],
        [0x25, encodeField(String(sequence), exports.ENCODER_A)],
        [0x26, encodeField(String(options.envCode ?? ENV_CODE), exports.ENCODER_A)],
        [0x27, encodeField(String(timestamp), exports.ENCODER_A)],
        [0x28, encodeField(WEBGL_HASH, exports.ENCODER_A)],
        [0x29, encodeField('0', exports.ENCODER_A)],
        [0x2a, encodeField(sdkVersion, exports.ENCODER_A)],
        [0x2b, be(hashState(''), 4)],
        [0x2c, encodeField(CANVAS_HASH, exports.ENCODER_A)],
        [0x2d, encodeField('0', exports.ENCODER_A)],
        [0x2e, be(hashState(query), 4)],
        [0x2f, encodeField(String(sequence), exports.ENCODER_A)],
        [0x30, be(hashState(userAgent), 4)],
        [0x31, encodeField(scmVersion, exports.ENCODER_A)],
        [0x32, encodeField(COMPONENT_VERSION, exports.ENCODER_A)],
        [0x33, encodeField(DEVICE_HASH, exports.ENCODER_A)],
        [0x34, encodeField(String(nonce), exports.ENCODER_A)],
        [0x35, encodeField(page, exports.ENCODER_A)],
        [0x36, encodeField(String(options.ubCode ?? UB_CODE), exports.ENCODER_A)],
        [0x37, encodeField('0', exports.ENCODER_A)],
        [0x38, be(VM_STATE_HASH, 4)],
        [0x20, encodeField('0', exports.ENCODER_A)],
    ]);
    let checksum = 0;
    for (const key of [...fields.keys()].sort((a, b) => a - b)) {
        checksum ^= fields.get(key)[1];
    }
    fields.set(0x20, encodeField(String(checksum), exports.ENCODER_B));
    return packPayload(fields);
}
function gnarlyFields(signedQuery, userAgent, options) {
    const { timestamp, nonce, nonce2, sequence = CALL_SEQUENCE_START } = options;
    const { sdkVersion, scmVersion } = options.versions ?? {
        sdkVersion: exports.DEFAULT_SDK_VERSION,
        scmVersion: exports.DEFAULT_SCM_VERSION,
    };
    const body = options.body ?? Buffer.alloc(0);
    const queryMd5 = md5Hex(signedQuery);
    const bodyMd5 = md5Hex(body);
    const agentMd5 = md5Hex(userAgent);
    const env = options.envCode ?? ENV_CODE;
    const ub = options.ubCode ?? UB_CODE;
    const mixed = mixState(timestamp, nonce, env);
    const covered = [
        0,
        env,
        ub,
        queryMd5,
        bodyMd5,
        agentMd5,
        timestamp,
        0,
        nonce,
        sdkVersion,
        scmVersion,
        CALL_SEQUENCE_START,
        sequence,
        sequence,
        mixed,
        nonce2,
    ];
    const first = foldChecksum(covered, 2);
    const second = foldChecksum([...covered, first], 1);
    return new Map([
        [0x00, be(second, 4)],
        [0x01, be(env, 2)],
        [0x02, be(ub, 2)],
        [0x03, Buffer.from(queryMd5, 'ascii')],
        [0x04, Buffer.from(bodyMd5, 'ascii')],
        [0x05, Buffer.from(agentMd5, 'ascii')],
        [0x06, be(timestamp, 4)],
        [0x08, be(nonce, 4)],
        [0x09, Buffer.from(sdkVersion, 'ascii')],
        [0x0a, Buffer.from(scmVersion, 'ascii')],
        [0x0b, be(CALL_SEQUENCE_START, 2)],
        [0x0c, be(sequence, 2)],
        [0x0d, be(sequence, 2)],
        [0x0e, be(mixed, 4)],
        [0x0f, be(nonce2, 4)],
        [0x10, be(first, 4)],
    ]);
}
function gnarlyPayload(signedQuery, userAgent, options) {
    return packPayload(gnarlyFields(signedQuery, userAgent, options), options.order, true);
}
function signRequest(pairs, options) {
    const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
    const nonce = options.nonce ?? clockNonce();
    const nonce2 = options.nonce2 ?? ~clockNonce() >>> 0;
    const sequence = options.sequence ?? CALL_SEQUENCE_START;
    const msToken = options.msToken ?? '';
    const versions = {
        sdkVersion: options.sdkVersion ?? exports.DEFAULT_SDK_VERSION,
        scmVersion: options.scmVersion ?? exports.DEFAULT_SCM_VERSION,
    };
    const query = encodeQuery(pairs);
    const dynosaur = seal(dynosaurPayload(query, options.userAgent, {
        timestamp,
        nonce,
        sequence,
        versions,
        page: options.page,
        envCode: options.envCode,
        ubCode: options.ubCode,
    }), randomKey());
    const sealedQuery = `${query}&${exports.DYNOSAUR_PARAM}=${dynosaur}&${exports.MS_TOKEN_PARAM}=${msToken}`;
    const gnarly = seal(gnarlyPayload(sealedQuery, options.userAgent, {
        body: options.body,
        timestamp,
        nonce,
        nonce2,
        sequence,
        versions,
    }), randomKey());
    const parameters = {
        [exports.DYNOSAUR_PARAM]: dynosaur,
        [exports.MS_TOKEN_PARAM]: msToken,
        [exports.BOGUS_PARAM]: exports.BOGUS_VALUE,
        [exports.GNARLY_PARAM]: gnarly,
    };
    const signed = `${sealedQuery}&${exports.BOGUS_PARAM}=${exports.BOGUS_VALUE}&${exports.GNARLY_PARAM}=${gnarly}`;
    return { query: signed, parameters };
}
function extractSignatureParameters(signedQuery) {
    const out = {};
    for (const part of signedQuery.split('&')) {
        const eq = part.indexOf('=');
        if (eq <= 0)
            continue;
        const key = part.slice(0, eq);
        if (key === exports.DYNOSAUR_PARAM || key === exports.GNARLY_PARAM || key === exports.BOGUS_PARAM) {
            out[key] = part.slice(eq + 1);
        }
    }
    return out;
}
//# sourceMappingURL=tiktok-sign.js.map