/* Byte-mode QR codes, error correction level L, drawn on a canvas. */
(function (root) {
  const ECC = [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28];
  const BLOCKS = [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8];
  const TOTAL = [-1, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346, 404, 466, 532, 581, 655, 733, 815, 901, 991, 1085];
  const REMAINDER = [-1, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3];
  const ALIGN = [
    [],
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90]
  ];

  function mul(a, b) {
    let result = 0;
    while (b) {
      if (b & 1) result ^= a;
      a <<= 1;
      if (a & 0x100) a ^= 0x11d;
      b >>= 1;
    }
    return result;
  }

  const EXP = [];
  (function initField() {
    let value = 1;
    for (let i = 0; i < 255; i += 1) {
      EXP[i] = value;
      value = mul(value, 2);
    }
  })();

  function rsDiv(data, degree) {
    const gen = [];
    let poly = [1];
    for (let i = 0; i < degree; i += 1) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = EXP[i];
      for (let j = 0; j < poly.length; j += 1) {
        next[j] ^= poly[j];
        next[j + 1] ^= mul(poly[j], factor);
      }
      poly = next;
    }
    for (let i = 0; i < poly.length; i += 1) gen.push(poly[i]);
    const result = data.concat(new Array(degree).fill(0));
    for (let i = 0; i < data.length; i += 1) {
      const factor = result[i];
      if (!factor) continue;
      for (let j = 1; j < gen.length; j += 1) {
        result[i + j] ^= mul(gen[j], factor);
      }
    }
    return result.slice(data.length);
  }

  function bitsToBytes(bits) {
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      let value = 0;
      for (let j = 0; j < 8; j += 1) value = (value << 1) | (bits[i + j] || 0);
      bytes.push(value);
    }
    return bytes;
  }

  function appendBits(bits, value, length) {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  }

  function chooseVersion(length) {
    for (let version = 1; version <= 20; version += 1) {
      const blocks = BLOCKS[version];
      const dataBytes = TOTAL[version] - ECC[version] * blocks;
      const capacity = dataBytes - (version < 10 ? 2 : 3);
      if (length <= capacity) return version;
    }
    throw new Error("QR text is too long.");
  }

  function dataCodewords(text, version) {
    const bits = [];
    const bytes = Array.from(new TextEncoder().encode(text));
    appendBits(bits, 0x4, 4);
    appendBits(bits, bytes.length, version < 10 ? 8 : 16);
    bytes.forEach((byte) => appendBits(bits, byte, 8));
    const capacity = (TOTAL[version] - ECC[version] * BLOCKS[version]) * 8;
    appendBits(bits, 0, Math.min(4, capacity - bits.length));
    while (bits.length % 8) bits.push(0);
    const pads = [0xec, 0x11];
    let pad = 0;
    while (bits.length < capacity) {
      appendBits(bits, pads[pad], 8);
      pad ^= 1;
    }
    return bitsToBytes(bits);
  }

  function interleave(data, version) {
    const blocks = BLOCKS[version];
    const eccLen = ECC[version];
    const dataLen = data.length;
    const shortLen = Math.floor(dataLen / blocks);
    const longCount = dataLen % blocks;
    const shortCount = blocks - longCount;
    const group = [];
    let offset = 0;
    for (let i = 0; i < blocks; i += 1) {
      const len = shortLen + (i >= shortCount ? 1 : 0);
      const block = data.slice(offset, offset + len);
      offset += len;
      group.push({ data: block, ecc: rsDiv(block, eccLen) });
    }
    const out = [];
    const max = shortLen + (longCount ? 1 : 0);
    for (let i = 0; i < max; i += 1) {
      group.forEach((block) => {
        if (i < block.data.length) out.push(block.data[i]);
      });
    }
    for (let i = 0; i < eccLen; i += 1) group.forEach((block) => out.push(block.ecc[i]));
    return out;
  }

  function createMatrix(version) {
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => Array(size).fill(false));
    const reserved = Array.from({ length: size }, () => Array(size).fill(false));
    function set(row, col, dark, hold) {
      modules[row][col] = dark;
      if (hold) reserved[row][col] = true;
    }
    function finder(row, col) {
      for (let r = -1; r <= 7; r += 1) {
        for (let c = -1; c <= 7; c += 1) {
          const y = row + r;
          const x = col + c;
          if (y < 0 || x < 0 || y >= size || x >= size) continue;
          const edge = r < 0 || c < 0 || r > 6 || c > 6;
          const box = r === 0 || c === 0 || r === 6 || c === 6;
          const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          set(y, x, !edge && (box || core), true);
        }
      }
    }
    finder(0, 0);
    finder(0, size - 7);
    finder(size - 7, 0);
    for (let i = 8; i < size - 8; i += 1) {
      const dark = i % 2 === 0;
      set(6, i, dark, true);
      set(i, 6, dark, true);
    }
    const positions = ALIGN[version];
    positions.forEach((row) => {
      positions.forEach((col) => {
        if (row < 9 && col < 9) return;
        if (row < 9 && col > size - 10) return;
        if (row > size - 10 && col < 9) return;
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            const dark = Math.max(Math.abs(r), Math.abs(c)) !== 1;
            set(row + r, col + c, dark, true);
          }
        }
      });
    });
    set(size - 8, 8, true, true);
    for (let i = 0; i < 9; i += 1) {
      if (!reserved[8][i]) set(8, i, false, true);
      if (!reserved[i][8]) set(i, 8, false, true);
    }
    for (let i = 0; i < 8; i += 1) {
      set(8, size - 1 - i, false, true);
      set(size - 1 - i, 8, false, true);
    }
    if (version >= 7) {
      for (let i = 0; i < 6; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          set(i, size - 11 + j, false, true);
          set(size - 11 + j, i, false, true);
        }
      }
    }
    return { modules, reserved, size };
  }

  function placeData(matrix, codewords, remainder) {
    const bits = [];
    codewords.forEach((byte) => appendBits(bits, byte, 8));
    for (let i = 0; i < remainder; i += 1) bits.push(0);
    const { modules, reserved, size } = matrix;
    let index = 0;
    let upward = true;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col -= 1;
      for (let step = 0; step < size; step += 1) {
        const row = upward ? size - 1 - step : step;
        for (let offset = 0; offset < 2; offset += 1) {
          const x = col - offset;
          if (reserved[row][x]) continue;
          modules[row][x] = index < bits.length ? bits[index] === 1 : false;
          index += 1;
        }
      }
      upward = !upward;
    }
  }

  function maskBit(mask, row, col) {
    switch (mask) {
      case 0: return (row + col) % 2 === 0;
      case 1: return row % 2 === 0;
      case 2: return col % 3 === 0;
      case 3: return (row + col) % 3 === 0;
      case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
      case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
      case 6: return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
      default: return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    }
  }

  function applyMask(matrix, mask) {
    const { modules, reserved, size } = matrix;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!reserved[row][col] && maskBit(mask, row, col)) modules[row][col] = !modules[row][col];
      }
    }
  }

  function formatBits(mask) {
    let value = (1 << 3) | mask;
    let rem = value << 10;
    for (let i = 14; i >= 10; i -= 1) {
      if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10);
    }
    return ((value << 10) | rem) ^ 0x5412;
  }

  function versionBits(version) {
    let rem = version << 12;
    for (let i = 17; i >= 12; i -= 1) {
      if ((rem >>> i) & 1) rem ^= 0x1f25 << (i - 12);
    }
    return (version << 12) | rem;
  }

  function drawFormat(matrix, mask) {
    const bits = formatBits(mask);
    const { size } = matrix;
    const positions = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    for (let i = 0; i < 15; i += 1) {
      matrix.modules[positions[i][0]][positions[i][1]] = ((bits >>> i) & 1) === 1;
    }
    for (let i = 0; i < 8; i += 1) {
      matrix.modules[8][size - 1 - i] = ((bits >>> i) & 1) === 1;
    }
    for (let i = 8; i < 15; i += 1) {
      matrix.modules[size - 15 + i][8] = ((bits >>> i) & 1) === 1;
    }
    if (matrix.version < 7) return;
    const info = versionBits(matrix.version);
    for (let i = 0; i < 18; i += 1) {
      const dark = ((info >>> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = i % 3;
      matrix.modules[row][size - 11 + col] = dark;
      matrix.modules[size - 11 + col][row] = dark;
    }
  }

  function penalty(modules) {
    const size = modules.length;
    let score = 0;
    for (let row = 0; row < size; row += 1) {
      let run = 1;
      for (let col = 1; col < size; col += 1) {
        if (modules[row][col] === modules[row][col - 1]) run += 1;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
    for (let col = 0; col < size; col += 1) {
      let run = 1;
      for (let row = 1; row < size; row += 1) {
        if (modules[row][col] === modules[row - 1][col]) run += 1;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      if (run >= 5) score += run - 2;
    }
    let dark = 0;
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) if (modules[row][col]) dark += 1;
    }
    score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return score;
  }

  function build(text, onlyMask) {
    const version = chooseVersion(text.length);
    const codewords = interleave(dataCodewords(text, version), version);
    let best = null;
    let bestScore = Infinity;
    const masks = onlyMask == null ? [0, 1, 2, 3, 4, 5, 6, 7] : [onlyMask];
    masks.forEach((mask) => {
      const matrix = createMatrix(version);
      matrix.version = version;
      placeData(matrix, codewords, REMAINDER[version]);
      applyMask(matrix, mask);
      drawFormat(matrix, mask);
      const score = penalty(matrix.modules);
      if (score < bestScore) {
        best = matrix.modules;
        bestScore = score;
      }
    });
    return best;
  }

  function draw(canvas, text) {
    const modules = build(text);
    const size = modules.length;
    const quiet = 4;
    const scale = 6;
    const full = (size + quiet * 2) * scale;
    canvas.width = full;
    canvas.height = full;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, full, full);
    context.fillStyle = "#111";
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        if (!modules[row][col]) continue;
        context.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
      }
    }
  }

  root.CinemarkQr = { draw };
})(window);
