const safeText = (value: unknown) => String(value ?? '')
  .replace(/[^\u0020-\u007E]/gu, '')
  .replace(/[\\()]/g, '\\$&');

const wrapLine = (text: string, maxChars = 88) => {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > maxChars) {
      if (line) lines.push(line);
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

export const createPdfBytes = (title: string, lines: string[]) => {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;
  const lineHeight = 15;
  const pages: string[][] = [[]];

  const pushLine = (line = '') => {
    if (pages[pages.length - 1].length >= 48) pages.push([]);
    pages[pages.length - 1].push(line);
  };

  lines.forEach(line => {
    if (!line) pushLine('');
    else wrapLine(line).forEach(pushLine);
  });

  const objects: string[] = ['', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const addObject = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const pageIds: number[] = [];
  pages.forEach((pageLines, pageIndex) => {
    const streamLines = [
      'BT',
      '/F1 18 Tf',
      `${margin} ${pageHeight - margin} Td`,
      `(${safeText(pageIndex === 0 ? title : `${title} continued`)}) Tj`,
      '/F1 10 Tf',
      `0 -${lineHeight + 10} Td`,
    ];
    pageLines.forEach(line => {
      streamLines.push(`(${safeText(line)}) Tj`);
      streamLines.push(`0 -${lineHeight} Td`);
    });
    streamLines.push('ET');
    const stream = streamLines.join('\n');
    const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const pageId = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[0] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
};
