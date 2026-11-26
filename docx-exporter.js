// -----------------------------------------------------------------------------
// EAP Online Compiler — Pure Vanilla JS OpenXML (.docx) Report Generator
// Builds genuine Microsoft Word .docx archives (ZIP + WordprocessingML + 300 DPI
// DrawingML PNG images + native Word tables & shaded code blocks) 100% offline
// with ZERO external dependencies. Works in browser (file:// & https://) & Node.
// -----------------------------------------------------------------------------

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.EAPDocx = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. UTF-8 & CRC-32 & Minimal Spec-Compliant ZIP Archive Builder (STORE mode)
  // ---------------------------------------------------------------------------
  const CRC_TABLE = (function () {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      t[n] = c >>> 0;
    }
    return t;
  }());

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) {
      c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    }
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function encodeUTF8(str) {
    if (typeof TextEncoder === 'function') {
      return new TextEncoder().encode(String(str || ''));
    }
    const s = unescape(encodeURIComponent(String(str || '')));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  // entries: [{ name: 'word/document.xml', data: Uint8Array | string }]
  function buildZipBytes(entries) {
    const prepared = entries.map((e) => {
      const nameBytes = encodeUTF8(e.name);
      const dataBytes = e.data instanceof Uint8Array ? e.data : encodeUTF8(e.data);
      const crc = crc32(dataBytes);
      return { nameBytes, dataBytes, crc };
    });

    let localTotal = 0;
    let centralTotal = 0;
    for (const p of prepared) {
      localTotal += 30 + p.nameBytes.length + p.dataBytes.length;
      centralTotal += 46 + p.nameBytes.length;
    }

    const totalLen = localTotal + centralTotal + 22;
    const out = new Uint8Array(totalLen);
    const dv = new DataView(out.buffer);

    const now = new Date();
    const dosTime = ((now.getHours() & 0x1F) << 11) | ((now.getMinutes() & 0x3F) << 5) | ((now.getSeconds() >> 1) & 0x1F);
    const dosDate = (((Math.max(1980, now.getFullYear()) - 1980) & 0x7F) << 9) | (((now.getMonth() + 1) & 0x0F) << 5) | (now.getDate() & 0x1F);

    let offset = 0;
    const localOffsets = [];

    // Write Local File Headers + Payloads
    for (const p of prepared) {
      localOffsets.push(offset);
      dv.setUint32(offset, 0x04034b50, true);      // Local file header signature
      dv.setUint16(offset + 4, 20, true);          // Version needed (2.0)
      dv.setUint16(offset + 6, 0x0800, true);      // General purpose bit flag: UTF-8 filenames
      dv.setUint16(offset + 8, 0, true);           // Compression method: 0 (STORE)
      dv.setUint16(offset + 10, dosTime, true);
      dv.setUint16(offset + 12, dosDate, true);
      dv.setUint32(offset + 14, p.crc, true);
      dv.setUint32(offset + 18, p.dataBytes.length, true);
      dv.setUint32(offset + 22, p.dataBytes.length, true);
      dv.setUint16(offset + 26, p.nameBytes.length, true);
      dv.setUint16(offset + 28, 0, true);          // Extra field length
      offset += 30;
      out.set(p.nameBytes, offset);
      offset += p.nameBytes.length;
      out.set(p.dataBytes, offset);
      offset += p.dataBytes.length;
    }

    const centralStart = offset;

    // Write Central Directory Headers
    for (let i = 0; i < prepared.length; i++) {
      const p = prepared[i];
      dv.setUint32(offset, 0x02014b50, true);      // Central file header signature
      dv.setUint16(offset + 4, 20, true);          // Version made by
      dv.setUint16(offset + 6, 20, true);          // Version needed
      dv.setUint16(offset + 8, 0x0800, true);      // UTF-8 flag
      dv.setUint16(offset + 10, 0, true);          // Compression: STORE
      dv.setUint16(offset + 12, dosTime, true);
      dv.setUint16(offset + 14, dosDate, true);
      dv.setUint32(offset + 16, p.crc, true);
      dv.setUint32(offset + 20, p.dataBytes.length, true);
      dv.setUint32(offset + 24, p.dataBytes.length, true);
      dv.setUint16(offset + 28, p.nameBytes.length, true);
      dv.setUint16(offset + 30, 0, true);          // Extra length
      dv.setUint16(offset + 32, 0, true);          // Comment length
      dv.setUint16(offset + 34, 0, true);          // Disk number
      dv.setUint16(offset + 36, 0, true);          // Internal attrs
      dv.setUint32(offset + 38, 0, true);          // External attrs
      dv.setUint32(offset + 42, localOffsets[i], true);
      offset += 46;
      out.set(p.nameBytes, offset);
      offset += p.nameBytes.length;
    }

    const centralSize = offset - centralStart;

    // End of Central Directory Record (EOCD)
    dv.setUint32(offset, 0x06054b50, true);
    dv.setUint16(offset + 4, 0, true);
    dv.setUint16(offset + 6, 0, true);
    dv.setUint16(offset + 8, prepared.length, true);
    dv.setUint16(offset + 10, prepared.length, true);
    dv.setUint32(offset + 12, centralSize, true);
    dv.setUint32(offset + 16, centralStart, true);
    dv.setUint16(offset + 20, 0, true);

    return out;
  }

  // ---------------------------------------------------------------------------
  // 2. XML & PNG Geometry Helpers
  // ---------------------------------------------------------------------------
  function escXml(str) {
    // Strip control chars illegal in XML 1.0 (except \t, \n, \r)
    return String(str == null ? '' : str)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function readPngDimensions(pngBytes) {
    if (!pngBytes || pngBytes.length < 24) return { width: 1200, height: 800 };
    if (pngBytes[0] !== 0x89 || pngBytes[1] !== 0x50 || pngBytes[2] !== 0x4E || pngBytes[3] !== 0x47) {
      return { width: 1200, height: 800 };
    }
    const dv = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
    const width = dv.getUint32(16, false) || 1200;
    const height = dv.getUint32(20, false) || 800;
    return { width, height };
  }

  // Convert pixel dimensions to Word EMUs (1 cm = 360,000 EMUs) fitting A4 content width (~16.6 cm)
  function computeImageEmuSize(pxW, pxH, maxCmW = 16.5, maxCmH = 19.5) {
    const maxEmuW = Math.round(maxCmW * 360000);
    const maxEmuH = Math.round(maxCmH * 360000);
    const safeW = Math.max(1, pxW);
    const safeH = Math.max(1, pxH);
    // Natural size assuming 220 DPI (so small diagrams aren't stretched huge, while wide diagrams fit A4)
    const natEmuW = Math.round((safeW / 220) * 914400);
    const natEmuH = Math.round((safeH / 220) * 914400);
    const scale = Math.min(1, maxEmuW / Math.max(1, natEmuW), maxEmuH / Math.max(1, natEmuH));
    // Also ensure very high-DPI (e.g. 3x scale) images fill ~85-100% width cleanly
    let cx = Math.round(natEmuW * scale);
    let cy = Math.round(natEmuH * scale);
    if (cx < 2800000 && safeW > 500) {
      const boost = Math.min(maxEmuW / cx, maxEmuH / cy);
      cx = Math.round(cx * boost);
      cy = Math.round(cy * boost);
    }
    return { cx, cy };
  }

  // ---------------------------------------------------------------------------
  // 3. WordprocessingML Block Builders
  // ---------------------------------------------------------------------------
  function buildParagraphXml(text, opts = {}) {
    const align = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
    const spacingAfter = opts.spaceAfter !== undefined ? opts.spaceAfter : 120;
    const spacingBefore = opts.spaceBefore !== undefined ? opts.spaceBefore : 0;
    const keepNext = opts.keepNext ? '<w:keepNext/>' : '';
    const pBorders = opts.bottomBorder
      ? `<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="4" w:color="${opts.bottomBorder}"/></w:pBdr>`
      : '';
    const shading = opts.fill ? `<w:shd w:val="clear" w:color="auto" w:fill="${opts.fill}"/>` : '';

    const font = opts.mono ? 'Consolas' : 'Calibri';
    const sz = opts.sizePt ? Math.round(opts.sizePt * 2) : 21; // half-points (10.5pt default)
    const bold = opts.bold ? '<w:b/><w:bCs/>' : '';
    const italic = opts.italic ? '<w:i/><w:iCs/>' : '';
    const color = opts.color ? `<w:color w:val="${opts.color}"/>` : '<w:color w:val="0F172A"/>';

    const lines = String(text == null ? '' : text).replace(/\r\n/g, '\n').split('\n');
    const runs = lines.map((ln, idx) => {
      const br = idx > 0 ? '<w:br/>' : '';
      return `${br}<w:t xml:space="preserve">${escXml(ln)}</w:t>`;
    }).join('');

    return `<w:p>
      <w:pPr>${keepNext}${align}${pBorders}${shading}<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}" w:line="260" w:lineRule="auto"/></w:pPr>
      <w:r>
        <w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/>${bold}${italic}${color}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr>
        ${runs}
      </w:r>
    </w:p>`;
  }

  function buildHeadingXml(title, level = 1) {
    if (level === 1) {
      return buildParagraphXml(title, {
        bold: true,
        sizePt: 16,
        color: '1E3A8A',
        spaceBefore: 60,
        spaceAfter: 80,
        bottomBorder: '2563EB',
        keepNext: true
      });
    }
    return buildParagraphXml(title, {
      bold: true,
      sizePt: 12.5,
      color: '0F172A',
      spaceBefore: 220,
      spaceAfter: 90,
      bottomBorder: 'CBD5E1',
      keepNext: true
    });
  }

  function buildCodeBlockXml(codeText, withLineNumbers = true) {
    const rawLines = String(codeText || '').replace(/\r\n/g, '\n').replace(/\s+$/, '').split('\n');
    const padWidth = String(rawLines.length).length;

    // Render inside a clean 1-cell bordered & shaded Word table so page breaks work naturally in Word!
    const lineRuns = rawLines.map((ln, idx) => {
      const br = idx > 0 ? '<w:br/>' : '';
      const numPrefix = withLineNumbers
        ? `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:color w:val="64748B"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>${br}<w:t xml:space="preserve">${escXml(String(idx + 1).padStart(padWidth, ' ') + ' | ')}</w:t></w:r>`
        : (br ? `<w:r>${br}</w:r>` : '');
      const expanded = ln.replace(/\t/g, '  ');
      return `${numPrefix}<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:cs="Consolas"/><w:color w:val="0F172A"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr><w:t xml:space="preserve">${escXml(expanded)}</w:t></w:r>`;
    }).join('');

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="18" w:space="0" w:color="2563EB"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="120" w:type="dxa"/>
          <w:left w:w="160" w:type="dxa"/>
          <w:bottom w:w="120" w:type="dxa"/>
          <w:right w:w="140" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="5000" w:type="pct"/><w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/></w:tcPr>
          <w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="230" w:lineRule="auto"/></w:pPr>${lineRuns}</w:p>
        </w:tc>
      </w:tr>
    </w:tbl>`;
  }

  function buildTableXml(headers, rows, opts = {}) {
    if (!Array.isArray(headers) || headers.length === 0) return '';
    const colPct = Math.floor(5000 / headers.length);

    const headerCells = headers.map((h) => `
      <w:tc>
        <w:tcPr>
          <w:tcW w:w="${colPct}" w:type="pct"/>
          <w:shd w:val="clear" w:color="auto" w:fill="E2E8F0"/>
        </w:tcPr>
        <w:p>
          <w:pPr><w:spacing w:before="40" w:after="40"/></w:pPr>
          <w:r>
            <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:b/><w:bCs/><w:color w:val="0F172A"/><w:sz w:val="19"/><w:szCs w:val="19"/></w:rPr>
            <w:t xml:space="preserve">${escXml(h)}</w:t>
          </w:r>
        </w:p>
      </w:tc>`).join('');

    const bodyRows = (rows || []).map((r, rIdx) => {
      const zebraFill = rIdx % 2 === 1 ? '<w:shd w:val="clear" w:color="auto" w:fill="F8FAFC"/>' : '';
      const cells = headers.map((_, cIdx) => {
        const val = r[cIdx] !== undefined ? String(r[cIdx]) : '';
        const isMonoCol = Boolean(opts.monoColumns && opts.monoColumns.includes(cIdx));
        const font = isMonoCol ? 'Consolas' : 'Calibri';
        return `
          <w:tc>
            <w:tcPr><w:tcW w:w="${colPct}" w:type="pct"/>${zebraFill}</w:tcPr>
            <w:p>
              <w:pPr><w:spacing w:before="30" w:after="30"/></w:pPr>
              <w:r>
                <w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:cs="${font}"/><w:color w:val="0F172A"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr>
                <w:t xml:space="preserve">${escXml(val)}</w:t>
              </w:r>
            </w:p>
          </w:tc>`;
      }).join('');
      return `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells}</w:tr>`;
    }).join('');

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="64748B"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="64748B"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="64748B"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="64748B"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
        </w:tblBorders>
        <w:tblCellMar>
          <w:top w:w="60" w:type="dxa"/>
          <w:left w:w="100" w:type="dxa"/>
          <w:bottom w:w="60" w:type="dxa"/>
          <w:right w:w="100" w:type="dxa"/>
        </w:tblCellMar>
      </w:tblPr>
      <w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr>${headerCells}</w:tr>
      ${bodyRows}
    </w:tbl>`;
  }

  function buildImageParagraphXml(relId, docPrId, name, cx, cy, caption) {
    const imgP = `<w:p>
      <w:pPr><w:jc w:val="center"/><w:spacing w:before="100" w:after="60"/></w:pPr>
      <w:r>
        <w:drawing>
          <wp:inline distT="0" distB="0" distL="0" distR="0"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
            <wp:extent cx="${cx}" cy="${cy}"/>
            <wp:effectExtent l="0" t="0" r="0" b="0"/>
            <wp:docPr id="${docPrId}" name="${escXml(name)}"/>
            <wp:cNvGraphicFramePr>
              <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
            </wp:cNvGraphicFramePr>
            <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
              <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:nvPicPr>
                    <pic:cNvPr id="${docPrId}" name="${escXml(name)}"/>
                    <pic:cNvPicPr/>
                  </pic:nvPicPr>
                  <pic:blipFill>
                    <a:blip r:embed="${relId}"/>
                    <a:stretch><a:fillRect/></a:stretch>
                  </pic:blipFill>
                  <pic:spPr>
                    <a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>
                    <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                  </pic:spPr>
                </pic:pic>
              </a:graphicData>
            </a:graphic>
          </wp:inline>
        </w:drawing>
      </w:r>
    </w:p>`;

    const capP = caption
      ? buildParagraphXml(caption, { align: 'center', italic: true, sizePt: 9.5, color: '475569', spaceAfter: 160 })
      : '';
    return imgP + capP;
  }

  // ---------------------------------------------------------------------------
  // 4. High-Level .docx Document Assembler
  // spec: {
  //   title: string,
  //   subtitle?: string,
  //   sections: Array<
  //     | { type: 'heading', text: string }
  //     | { type: 'paragraph', text: string, italic?: boolean, bold?: boolean }
  //     | { type: 'code', title?: string, code: string, lineNumbers?: boolean }
  //     | { type: 'table', title?: string, headers: string[], rows: string[][], monoColumns?: number[] }
  //     | { type: 'image', title?: string, pngBytes: Uint8Array, caption?: string }
  //   >
  // }
  // ---------------------------------------------------------------------------
  function buildDocxBytes(spec = {}) {
    const bodyXmlParts = [];
    const mediaEntries = [];
    const imageRels = [];
    let imgCounter = 0;

    if (spec.title) {
      bodyXmlParts.push(buildHeadingXml(spec.title, 1));
    }
    if (spec.subtitle) {
      bodyXmlParts.push(buildParagraphXml(spec.subtitle, { italic: true, sizePt: 10, color: '475569', spaceAfter: 160 }));
    }

    for (const sec of spec.sections || []) {
      if (!sec) continue;
      if (sec.title) {
        bodyXmlParts.push(buildHeadingXml(sec.title, 2));
      }
      if (sec.type === 'heading') {
        bodyXmlParts.push(buildHeadingXml(sec.text || '', 2));
      } else if (sec.type === 'paragraph') {
        bodyXmlParts.push(buildParagraphXml(sec.text || '', {
          bold: sec.bold,
          italic: sec.italic,
          fill: sec.fill,
          sizePt: sec.sizePt || 10.5
        }));
      } else if (sec.type === 'code') {
        bodyXmlParts.push(buildCodeBlockXml(sec.code || '', sec.lineNumbers !== false));
        bodyXmlParts.push(buildParagraphXml('', { spaceAfter: 80 }));
      } else if (sec.type === 'table') {
        bodyXmlParts.push(buildTableXml(sec.headers || [], sec.rows || [], { monoColumns: sec.monoColumns }));
        bodyXmlParts.push(buildParagraphXml('', { spaceAfter: 80 }));
      } else if (sec.type === 'image' && sec.pngBytes && sec.pngBytes.length > 24) {
        imgCounter++;
        const relId = `rIdImg${imgCounter}`;
        const mediaFile = `image${imgCounter}.png`;
        mediaEntries.push({ name: `word/media/${mediaFile}`, data: sec.pngBytes });
        imageRels.push(
          `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaFile}"/>`
        );
        const dims = readPngDimensions(sec.pngBytes);
        const emu = computeImageEmuSize(dims.width, dims.height);
        bodyXmlParts.push(buildImageParagraphXml(relId, imgCounter, mediaFile, emu.cx, emu.cy, sec.caption || ''));
      }
    }

    // A4 Page Setup (21.0 x 29.7 cm = 11906 x 16838 dxa, 2.0 cm margins = 1134 dxa)
    bodyXmlParts.push(`<w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>`);

    const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

    const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

    const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
  ${imageRels.join('\n  ')}
</Relationships>`;

    const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="21"/>
        <w:szCs w:val="21"/>
        <w:lang w:val="el-GR" w:eastAsia="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;

    const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${bodyXmlParts.join('\n')}
  </w:body>
</w:document>`;

    return buildZipBytes([
      { name: '[Content_Types].xml', data: contentTypesXml },
      { name: '_rels/.rels', data: rootRelsXml },
      { name: 'word/_rels/document.xml.rels', data: docRelsXml },
      { name: 'word/styles.xml', data: stylesXml },
      { name: 'word/document.xml', data: documentXml },
      ...mediaEntries
    ]);
  }

  // Browser helper: rasterize an SVG string/element into Uint8Array PNG bytes at 3x scale
  function svgToPngBytes(svgStringOrEl, scale = 3) {
    return new Promise((resolve, reject) => {
      try {
        let svgText = typeof svgStringOrEl === 'string'
          ? svgStringOrEl
          : (svgStringOrEl && typeof XMLSerializer === 'function' ? new XMLSerializer().serializeToString(svgStringOrEl) : '');
        if (!svgText) return reject(new Error('Κενό SVG'));
        if (!svgText.includes('xmlns="http://www.w3.org/2000/svg"')) {
          svgText = svgText.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }

        let w = 900;
        let h = 550;
        const wMatch = svgText.match(/<svg[^>]*\bwidth=["']([0-9.]+)(?:px)?["']/i);
        const hMatch = svgText.match(/<svg[^>]*\bheight=["']([0-9.]+)(?:px)?["']/i);
        if (wMatch && parseFloat(wMatch[1]) > 0) w = parseFloat(wMatch[1]);
        if (hMatch && parseFloat(hMatch[1]) > 0) h = parseFloat(hMatch[1]);
        const vbMatch = svgText.match(/<svg[^>]*\bviewBox=["']([0-9.\s,-]+)["']/i);
        if ((!wMatch || !hMatch) && vbMatch) {
          const parts = vbMatch[1].trim().split(/[\s,]+/).map(Number);
          if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
            w = parts[2];
            h = parts[3];
          }
        }

        const base64Uri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgText)));
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const actualW = img.naturalWidth || w;
            const actualH = img.naturalHeight || h;
            const effScale = Math.min(scale, 4200 / Math.max(1, actualW, actualH));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(actualW * effScale);
            canvas.height = Math.round(actualH * effScale);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(effScale, effScale);
            ctx.drawImage(img, 0, 0, actualW, actualH);
            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Αποτυχία δημιουργίας PNG blob'));
              blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf))).catch(reject);
            }, 'image/png');
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error('Αποτυχία μετατροπής SVG σε PNG'));
        img.src = base64Uri;
      } catch (err) {
        reject(err);
      }
    });
  }

  function downloadDocx(spec, filename = 'eap-ergasia.docx') {
    const bytes = buildDocxBytes(spec);
    const blob = new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return bytes;
  }

  return {
    crc32,
    buildZipBytes,
    readPngDimensions,
    computeImageEmuSize,
    buildDocxBytes,
    svgToPngBytes,
    downloadDocx
  };
}));
