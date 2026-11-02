// Encodeur CBOR minimal, pour fabriquer des objets de test (le relais n'encode jamais de CBOR).
function head(major, n) {
  if (n < 24) return Buffer.from([(major << 5) | n])
  if (n < 0x100) return Buffer.from([(major << 5) | 24, n])
  if (n < 0x10000) return Buffer.from([(major << 5) | 25, n >> 8, n & 0xff])
  const b = Buffer.alloc(5)
  b[0] = (major << 5) | 26
  b.writeUInt32BE(n, 1)
  return b
}

export function encodeCbor(v) {
  if (v === false) return Buffer.from([0xf4])
  if (v === true) return Buffer.from([0xf5])
  if (v === null) return Buffer.from([0xf6])
  if (typeof v === 'number') return v >= 0 ? head(0, v) : head(1, -1 - v)
  if (Buffer.isBuffer(v)) return Buffer.concat([head(2, v.length), v])
  if (typeof v === 'string') {
    const b = Buffer.from(v, 'utf8')
    return Buffer.concat([head(3, b.length), b])
  }
  if (Array.isArray(v)) return Buffer.concat([head(4, v.length), ...v.map(encodeCbor)])
  const entries = v instanceof Map ? [...v] : Object.entries(v)
  return Buffer.concat([head(5, entries.length), ...entries.flatMap(([k, x]) => [encodeCbor(k), encodeCbor(x)])])
}
