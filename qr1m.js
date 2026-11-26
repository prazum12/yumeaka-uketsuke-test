/* 夢アカのネームプレート用の、小さなQRコード作成。
   対応するのは「バージョン1・誤り訂正M・バイトモード」だけ（14文字まで）。
   中身は「yumeaka:管理番号」で、名前や連絡先は入れない。
   外部の部品は使っていない。 */
(function (root) {
  var SIZE = 21, DATA_LEN = 16, ECC_LEN = 10;

  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 0xFF; }
  function divisor(degree) { var r = []; for (var i = 0; i < degree - 1; i++) r.push(0); r.push(1); var rt = 1;
    for (var k = 0; k < degree; k++) { for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], rt); if (j + 1 < r.length) r[j] ^= r[j + 1]; } rt = mul(rt, 2); } return r; }
  function remainder(data, div) { var r = div.map(function () { return 0; });
    data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= mul(c, f); }); }); return r; }

  function make(text) {
    var bytes = []; for (var i = 0; i < text.length; i++) { var c = text.charCodeAt(i); if (c > 0x7F) return null; bytes.push(c); }
    if (bytes.length > 14) return null;
    var bits = [];
    function put(v, n) { for (var k = n - 1; k >= 0; k--) bits.push((v >>> k) & 1); }
    put(4, 4); put(bytes.length, 8); bytes.forEach(function (b) { put(b, 8); });
    var cap = DATA_LEN * 8; put(0, Math.min(4, cap - bits.length)); while (bits.length % 8) bits.push(0);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (var p = 0; p < bits.length; p += 8) { var v = 0; for (var q = 0; q < 8; q++) v = (v << 1) | bits[p + q]; data.push(v); }
    var all = data.concat(remainder(data, divisor(ECC_LEN)));

    var m = [], fn = [];
    for (var y = 0; y < SIZE; y++) { m.push([]); fn.push([]); for (var x = 0; x < SIZE; x++) { m[y].push(false); fn[y].push(false); } }
    function setF(x, y, d) { m[y][x] = !!d; fn[y][x] = true; }
    for (var t = 0; t < SIZE; t++) { setF(6, t, t % 2 === 0); setF(t, 6, t % 2 === 0); }
    function finder(cx, cy) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
      if (xx >= 0 && xx < SIZE && yy >= 0 && yy < SIZE) setF(xx, yy, d !== 2 && d !== 4); } }
    finder(3, 3); finder(SIZE - 4, 3); finder(3, SIZE - 4);
    function format(mask) { var d = mask, rem = d; for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      var b = ((d << 10) | rem) ^ 0x5412; function bit(i) { return ((b >>> i) & 1) !== 0; }
      for (var i2 = 0; i2 <= 5; i2++) setF(8, i2, bit(i2));
      setF(8, 7, bit(6)); setF(8, 8, bit(7)); setF(7, 8, bit(8));
      for (var i3 = 9; i3 < 15; i3++) setF(14 - i3, 8, bit(i3));
      for (var i4 = 0; i4 < 8; i4++) setF(SIZE - 1 - i4, 8, bit(i4));
      for (var i5 = 8; i5 < 15; i5++) setF(8, SIZE - 15 + i5, bit(i5));
      setF(8, SIZE - 8, true); }
    format(0);
    var n = 0;
    for (var right = SIZE - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (var vert = 0; vert < SIZE; vert++) for (var j = 0; j < 2; j++) { var x2 = right - j, up = ((right + 1) & 2) === 0, y2 = up ? SIZE - 1 - vert : vert;
        if (!fn[y2][x2] && n < all.length * 8) { m[y2][x2] = ((all[n >>> 3] >>> (7 - (n & 7))) & 1) !== 0; n++; } } }
    function maskAt(k, x, y) { switch (k) { case 0: return (x + y) % 2 === 0; case 1: return y % 2 === 0; case 2: return x % 3 === 0; case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; case 5: return x * y % 2 + x * y % 3 === 0; case 6: return (x * y % 2 + x * y % 3) % 2 === 0; default: return ((x + y) % 2 + x * y % 3) % 2 === 0; } }
    function apply(k) { for (var y = 0; y < SIZE; y++) for (var x = 0; x < SIZE; x++) if (!fn[y][x] && maskAt(k, x, y)) m[y][x] = !m[y][x]; }
    function penalty() { var s = 0, dark = 0, x, y;
      for (y = 0; y < SIZE; y++) { var run = 1; for (x = 1; x < SIZE; x++) { if (m[y][x] === m[y][x - 1]) { run++; if (run === 5) s += 3; else if (run > 5) s++; } else run = 1; } }
      for (x = 0; x < SIZE; x++) { var run2 = 1; for (y = 1; y < SIZE; y++) { if (m[y][x] === m[y - 1][x]) { run2++; if (run2 === 5) s += 3; else if (run2 > 5) s++; } else run2 = 1; } }
      for (y = 0; y < SIZE - 1; y++) for (x = 0; x < SIZE - 1; x++) { var c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) s += 3; }
      for (y = 0; y < SIZE; y++) for (x = 0; x < SIZE; x++) if (m[y][x]) dark++;
      s += Math.floor(Math.abs(dark * 20 - SIZE * SIZE * 10) / (SIZE * SIZE)) * 10; return s; }
    var best = 0, bestScore = Infinity;
    for (var k = 0; k < 8; k++) { apply(k); format(k); var sc = penalty(); if (sc < bestScore) { bestScore = sc; best = k; } apply(k); }
    apply(best); format(best);
    return { size: SIZE, dark: function (x, y) { return m[y][x]; }, rows: m };
  }
  root.YumeQR = { make: make };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.YumeQR;
})(typeof window !== 'undefined' ? window : this);
