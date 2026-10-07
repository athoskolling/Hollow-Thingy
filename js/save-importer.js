/*
 * Hollow Knight Companion — SAVE IMPORTER (PC user#.dat)
 * -----------------------------------------------------------------
 * Format (same approach as the open-source tools bloodorca/hollow and
 * ReznoRMichael/hollow-knight-completion-check):
 *   [22-byte C# BinaryFormatter header] [7-bit length prefix] [Base64 text] [0x0B]
 *   Base64 → AES-256-ECB (key "UKu52ePUBwetZ9wNX88o54dnfKRu0T1l") → PKCS#7 → UTF-8 JSON
 *   JSON = { playerData: {...}, sceneData: { persistentBoolItems: [...] , ... } }
 * Everything runs locally in the browser. Nothing is uploaded and the file is
 * never modified. Progress is only changed after the user confirms the preview.
 */
(function (root) {
  'use strict';

  var CSHARP_HEADER = [0, 1, 0, 0, 0, 255, 255, 255, 255, 1, 0, 0, 0, 0, 0, 0, 0, 6, 1, 0, 0, 0];
  var KEY_TEXT = 'UKu52ePUBwetZ9wNX88o54dnfKRu0T1l';

  /* ---------------- minimal AES (decrypt only, 128/192/256) ---------------- */
  var SBOX = [], INV = [], RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
  (function init() {
    var p = 1, q = 1;
    do {
      p = p ^ ((p << 1) & 0xff) ^ (p & 0x80 ? 0x1b : 0);
      q ^= q << 1; q ^= q << 2; q ^= q << 4; q &= 0xff; if (q & 0x80) q ^= 0x09;
      var x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
      x = (x ^ 0x63) & 0xff;
      SBOX[p] = x; INV[x] = p;
    } while (p !== 1);
    SBOX[0] = 0x63; INV[0x63] = 0;
  })();
  function xt(a) { return ((a << 1) ^ (a & 0x80 ? 0x1b : 0)) & 0xff; }
  function mul(a, b) { var r = 0; while (b) { if (b & 1) r ^= a; a = xt(a); b >>= 1; } return r; }
  function expandKey(key) {
    var nk = key.length / 4, nr = nk + 6, w = [];
    for (var i = 0; i < nk; i++) w.push([key[4 * i], key[4 * i + 1], key[4 * i + 2], key[4 * i + 3]]);
    for (i = nk; i < 4 * (nr + 1); i++) {
      var t = w[i - 1].slice();
      if (i % nk === 0) { t = [SBOX[t[1]] ^ RCON[i / nk - 1], SBOX[t[2]], SBOX[t[3]], SBOX[t[0]]]; }
      else if (nk > 6 && i % nk === 4) { t = t.map(function (b) { return SBOX[b]; }); }
      w.push([w[i - nk][0] ^ t[0], w[i - nk][1] ^ t[1], w[i - nk][2] ^ t[2], w[i - nk][3] ^ t[3]]);
    }
    return { w: w, nr: nr };
  }
  function decryptBlock(ks, inp, off, out) {
    var s = new Array(16), r, c, i, w = ks.w, nr = ks.nr;
    for (i = 0; i < 16; i++) s[i] = inp[off + i] ^ w[nr * 4 + (i >> 2)][i & 3];
    for (r = nr - 1; r >= 0; r--) {
      // InvShiftRows
      var t = s.slice();
      for (c = 0; c < 4; c++) for (var row = 0; row < 4; row++) s[c * 4 + row] = t[((c - row + 4) % 4) * 4 + row];
      // InvSubBytes + AddRoundKey
      for (i = 0; i < 16; i++) s[i] = INV[s[i]] ^ w[r * 4 + (i >> 2)][i & 3];
      // InvMixColumns
      if (r > 0) for (c = 0; c < 4; c++) {
        var a0 = s[c * 4], a1 = s[c * 4 + 1], a2 = s[c * 4 + 2], a3 = s[c * 4 + 3];
        s[c * 4] = mul(a0, 14) ^ mul(a1, 11) ^ mul(a2, 13) ^ mul(a3, 9);
        s[c * 4 + 1] = mul(a0, 9) ^ mul(a1, 14) ^ mul(a2, 11) ^ mul(a3, 13);
        s[c * 4 + 2] = mul(a0, 13) ^ mul(a1, 9) ^ mul(a2, 14) ^ mul(a3, 11);
        s[c * 4 + 3] = mul(a0, 11) ^ mul(a1, 13) ^ mul(a2, 9) ^ mul(a3, 14);
      }
    }
    for (i = 0; i < 16; i++) out[off + i] = s[i];
  }
  function aesEcbDecrypt(keyBytes, data) {
    if (data.length % 16) throw new Error('Ciphertext is not a multiple of 16 bytes.');
    var ks = expandKey(Array.prototype.slice.call(keyBytes)), out = new Uint8Array(data.length);
    for (var off = 0; off < data.length; off += 16) decryptBlock(ks, data, off, out);
    return out;
  }

  /* ---------------- decoding pipeline ---------------- */
  function utf8Encode(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str);
    return Uint8Array.from(Buffer.from(str, 'utf8'));
  }
  function utf8Decode(bytes) {
    if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(bytes);
    return Buffer.from(bytes).toString('utf8');
  }
  function base64ToBytes(b64) {
    b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
    if (typeof atob === 'function') {
      var bin = atob(b64), out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    }
    return Uint8Array.from(Buffer.from(b64, 'base64'));
  }
  function stripHeader(bytes) {
    for (var i = 0; i < CSHARP_HEADER.length; i++) {
      if (bytes[i] !== CSHARP_HEADER[i]) throw new Error('Not a Hollow Knight PC save (unexpected header).');
    }
    var p = CSHARP_HEADER.length, len = 0, shift = 0, b;
    do { b = bytes[p++]; len |= (b & 0x7f) << shift; shift += 7; } while (b & 0x80 && shift < 35);
    var body = bytes.subarray(p, p + len);
    if (body.length !== len) throw new Error('Save file is truncated.');
    return body;
  }
  function unpad(bytes) {
    var n = bytes[bytes.length - 1];
    if (n < 1 || n > 16) throw new Error('Bad padding — wrong key or corrupted file.');
    return bytes.subarray(0, bytes.length - n);
  }
  /** Decode the raw bytes of user#.dat into the save JSON object. */
  function decode(arrayBufferOrBytes) {
    var bytes = arrayBufferOrBytes instanceof Uint8Array ? arrayBufferOrBytes : new Uint8Array(arrayBufferOrBytes);
    var text;
    if (bytes[0] === 0x7b) { // already-decoded JSON text (e.g. from bloodorca's editor)
      text = utf8Decode(bytes);
    } else {
      var b64 = utf8Decode(stripHeader(bytes));
      var plain = unpad(aesEcbDecrypt(utf8Encode(KEY_TEXT), base64ToBytes(b64)));
      text = utf8Decode(plain);
    }
    var json = JSON.parse(text);
    if (!json || !json.playerData) throw new Error('Decoded file has no playerData — not a Hollow Knight save.');
    return json;
  }

  /* ---------------- mapping to the companion's items ---------------- */
  function sceneActivated(save, id, scene) {
    var arr = (save.sceneData && save.sceneData.persistentBoolItems) || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id && arr[i].sceneName === scene) return arr[i].activated === true;
    return false;
  }
  function has(pd, k) { return Object.prototype.hasOwnProperty.call(pd, k); }

  /** Evaluate one item mapping. Returns true / false / null (unknown — field absent). */
  function evalMapping(m, save) {
    var pd = save.playerData;
    if (m.pd) return has(pd, m.pd) ? pd[m.pd] === true : null;
    if (m.pdGte) return has(pd, m.pdGte[0]) ? Number(pd[m.pdGte[0]]) >= m.pdGte[1] : null;
    if (m.any) { var known = m.any.filter(function (k) { return has(pd, k); }); return known.length ? known.some(function (k) { return pd[k] === true; }) : null; }
    if (m.allOf) { return m.allOf.every(function (k) { return has(pd, k); }) ? m.allOf.every(function (k) { return pd[k] === true; }) : null; }
    if (m.scene) return sceneActivated(save, m.scene[0], m.scene[1]);
    if (m.door) return has(pd, m.door) ? !!(pd[m.door] && pd[m.door].completed) : null;
    if (m.custom) {
      var lvl = has(pd, 'grimmChildLevel') ? Number(pd.grimmChildLevel) : null;
      switch (m.custom) {
        case 'grimmchild': return lvl === null ? null : (pd.gotCharm_40 === true && lvl >= 1 && lvl <= 4);
        case 'carefree': return lvl === null ? null : (pd.gotCharm_40 === true && lvl === 5);
        case 'flame1': return lvl === null ? null : (lvl >= 2 && lvl <= 5);
        case 'flame2': return lvl === null ? null : (pd.killedGrimm === true || lvl >= 3);
        case 'flame3': return lvl === null ? null : lvl === 4;
        case 'nkg': return lvl === null ? null : lvl === 4;
        case 'banish': return lvl === null ? null : lvl === 5;
        case 'thk': // only safe to infer when the Void Heart was never obtained
          if (!has(pd, 'killedHollowKnight')) return null;
          if (pd.killedHollowKnight === true && pd.gotShadeCharm !== true) return true;
          return pd.killedHollowKnight === true ? null : false;
      }
    }
    return null;
  }

  function analyze(save, DATA, currentChecks) {
    var pd = save.playerData;
    var changes = [], unknown = [], detected = {};
    DATA.ITEMS.forEach(function (it) {
      if (!it.save || it.derived) return;
      var v = evalMapping(it.save, save);
      if (v === null) { unknown.push(it); return; }
      detected[it.id] = v;
      var cur = currentChecks[it.id] === true;
      if (cur !== v) changes.push({ id: it.id, name: it.name, from: cur, to: v, completion: it.completion, type: it.type });
    });
    var shardCount = has(pd, 'maxHealthBase') ? (Number(pd.maxHealthBase) - 5) * 4 + (Number(pd.heartPieces) || 0) : null;
    var vesselCount = has(pd, 'MPReserveMax') ? Math.round(Number(pd.MPReserveMax) / 33) * 3 + (Number(pd.vesselFragments) || 0) : null;
    var charms = 0; for (var n = 1; n <= 40; n++) if (pd['gotCharm_' + n] === true) charms++;
    var summary = {
      completionPercentage: has(pd, 'completionPercentage') ? Number(pd.completionPercentage) : null,
      playTimeHours: has(pd, 'playTime') ? Math.round(Number(pd.playTime) / 360) / 10 : null,
      geo: has(pd, 'geo') ? Number(pd.geo) : null,
      essence: has(pd, 'dreamOrbs') ? Number(pd.dreamOrbs) : null,
      grubs: has(pd, 'grubsCollected') ? Number(pd.grubsCollected) : null,
      nailLevel: has(pd, 'nailSmithUpgrades') ? Number(pd.nailSmithUpgrades) : null,
      charms: charms, notches: has(pd, 'charmSlots') ? Number(pd.charmSlots) : null,
      shards: shardCount, vesselFragments: vesselCount,
      ore: has(pd, 'ore') ? Number(pd.ore) : null, simpleKeys: has(pd, 'simpleKeys') ? Number(pd.simpleKeys) : null,
      dreamers: { herrah: pd.hegemolDefeated === true, lurien: pd.lurienDefeated === true, monomon: pd.monomonDefeated === true },
      version: pd.version || null, steelSoul: pd.permadeathMode === 1 || pd.permadeathMode === 2
    };
    // sanity check: shard/vessel counts from the save vs individual detections
    var detShards = DATA.ITEMS.filter(function (i) { return i.type === 'mask' && detected[i.id]; }).length;
    var detVessels = DATA.ITEMS.filter(function (i) { return i.type === 'vessel' && detected[i.id]; }).length;
    var notes = [];
    if (shardCount !== null && shardCount !== detShards) notes.push('Save reports ' + shardCount + ' Mask Shards, ' + detShards + ' were matched individually — review the Mask Shard list.');
    if (vesselCount !== null && vesselCount !== detVessels) notes.push('Save reports ' + vesselCount + ' Vessel Fragments, ' + detVessels + ' were matched individually — review the Vessel list.');
    if (pd.killedHollowKnight === true && pd.gotShadeCharm === true) notes.push('The Hollow Knight was defeated while owning the Void Heart — the ending flag was NOT changed automatically. Set it manually.');
    return { summary: summary, changes: changes, unknown: unknown, detected: detected, notes: notes };
  }

  root.HK = root.HK || {};
  root.HK.SaveImporter = { decode: decode, analyze: analyze, evalMapping: evalMapping, aesEcbDecrypt: aesEcbDecrypt, KEY_TEXT: KEY_TEXT, CSHARP_HEADER: CSHARP_HEADER };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.HK.SaveImporter;
})(typeof window !== 'undefined' ? window : globalThis);
