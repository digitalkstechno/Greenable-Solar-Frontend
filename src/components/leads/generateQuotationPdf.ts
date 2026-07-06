import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to draw a small smiley face bullet
const drawSmileyBullet = (doc: jsPDF, x: number, y: number) => {
  doc.setLineWidth(0.7);
  doc.setDrawColor(0, 0, 0);

  // Outer circle
  doc.circle(x, y - 3, 3.5, 'D');

  // Eyes
  doc.setFillColor(0, 0, 0);
  doc.circle(x - 1.2, y - 4.2, 0.3, 'FD');
  doc.circle(x + 1.2, y - 4.2, 0.3, 'FD');

  // Smile (U-shape curve via 3 lines)
  doc.line(x - 1.2, y - 2.2, x - 0.4, y - 1.6);
  doc.line(x - 0.4, y - 1.6, x + 0.4, y - 1.6);
  doc.line(x + 0.4, y - 1.6, x + 1.2, y - 2.2);
};

// Helper to draw a right-pointing triangle bullet
const drawArrowBullet = (doc: jsPDF, x: number, y: number) => {
  doc.setFillColor(0, 0, 0);
  // Triangle pointing right: (x, y-7), (x+5, y-3.5), (x, y)
  doc.triangle(x, y - 7, x + 5, y - 3.5, x, y, 'F');
};

// Parse HTML string with <mark> tags into plain text + highlighted ranges
const parseHighlightedText = (html: string): { text: string; highlighted: boolean }[] => {
  if (!html) return [{ text: '', highlighted: false }];
  const cleanedHtml = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  const segments: { text: string; highlighted: boolean }[] = [];
  const regex = /<mark[^>]*>(.*?)<\/mark>|([^<]+)/g;
  let match;
  while ((match = regex.exec(cleanedHtml)) !== null) {
    if (match[1] !== undefined) {
      segments.push({ text: match[1], highlighted: true });
    } else if (match[2] !== undefined && match[2] !== '') {
      segments.push({ text: match[2], highlighted: false });
    }
  }
  return segments.length ? segments : [{ text: cleanedHtml.replace(/<[^>]+>/g, ''), highlighted: false }];
};

// Render a line with mixed normal/highlighted segments at a given Y position, centered
const renderMixedLine = (
  doc: jsPDF,
  segments: { text: string; highlighted: boolean }[],
  centerX: number,
  y: number,
  fontSize: number,
  baseFontStyle: string
) => {
  doc.setFont('helvetica', baseFontStyle);
  doc.setFontSize(fontSize);

  // Calculate total width of the line first (for centering)
  let totalWidth = 0;
  segments.forEach(seg => {
    totalWidth += doc.getTextWidth(seg.text);
  });

  // 1. Draw all highlights first
  let cursorX = centerX - totalWidth / 2;
  segments.forEach(seg => {
    const segWidth = doc.getTextWidth(seg.text);
    if (seg.highlighted) {
      doc.setFillColor(255, 255, 0);
      doc.rect(cursorX - 1, y - fontSize + 1, segWidth + 2, fontSize + 2, 'F');
    }
    cursorX += segWidth;
  });

  // 2. Draw all text next (on top of highlights)
  cursorX = centerX - totalWidth / 2;
  segments.forEach(seg => {
    const segWidth = doc.getTextWidth(seg.text);
    doc.setTextColor(0, 0, 0);
    doc.text(seg.text, cursorX, y);
    cursorX += segWidth;
  });
};

// Split a segments array (with highlight info) into lines that fit maxWidth
const wrapSegmentsToLines = (
  doc: jsPDF,
  segments: { text: string; highlighted: boolean }[],
  maxWidth: number,
  fontSize: number,
  baseFontStyle: string
): { text: string; highlighted: boolean }[][] => {
  // Flatten into words while preserving highlight flag
  const words: { text: string; highlighted: boolean }[] = [];
  segments.forEach(seg => {
    const parts = seg.text.split(/(\s+)/).filter(p => p !== '');
    parts.forEach(p => words.push({ text: p, highlighted: seg.highlighted }));
  });

  const lines: { text: string; highlighted: boolean }[][] = [];
  let currentLine: { text: string; highlighted: boolean }[] = [];
  let currentWidth = 0;

  doc.setFontSize(fontSize);

  doc.setFont('helvetica', baseFontStyle);
  words.forEach(word => {
    const wWidth = doc.getTextWidth(word.text);
    if (currentWidth + wWidth > maxWidth && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
      if (word.text.trim() === '') return; // skip leading space on new line
    }
    currentLine.push(word);
    currentWidth += wWidth;
  });
  if (currentLine.length > 0) lines.push(currentLine);

  return lines.length ? lines : [[{ text: '', highlighted: false }]];
};

const stripHtml = (html: string) => (html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');

export const generateQuotationPdf = (q: any, lead: any) => {
  console.log('PDF generation started', q, lead);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // PAGE 1
  let currY = 30;

  // Logo (Top-Right)
  try {
    doc.addImage('/logo/greeneable-logo.png', 'PNG', pageWidth - 40 - 150, 25, 150, 45);
  } catch (e) {
    console.error('Logo load failed', e);
  }

  // QUOTATION heading
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('QUOTATION', pageWidth / 2, 90, { align: 'center' });
  const qWidth = doc.getTextWidth('QUOTATION');
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - qWidth / 2, 93, pageWidth / 2 + qWidth / 2, 93);

  // SR.NO row
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  const dateObj = q.date ? new Date(q.date) : new Date();
  const dayStr = String(dateObj.getDate()).padStart(2, '0');
  const monthStr = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yearStr = dateObj.getFullYear();
  const formattedDate = `${dayStr}/${monthStr}/${yearStr}`;

  const srNoText = `SR.NO. : KS/${yearStr}/${q.id || '—'}`;
  const dateText = `DATE : ${formattedDate}`;
  const salesText = `SALES PERSON-${(lead?.assignedTo?.fullName || '-').toUpperCase()}`;
  const contactText = `CONTACT NO-${lead?.contact || ''}`;

  // Measure max width of right block items so they are perfectly left-aligned to the right margin (40pt)
  const rightMaxWidth = Math.max(
    doc.getTextWidth(dateText),
    doc.getTextWidth(salesText),
    doc.getTextWidth(contactText)
  );
  const rightX = pageWidth - 40 - rightMaxWidth;

  // Row 1: SR.NO. (left) and DATE (right)
  doc.text(srNoText, 40, 115);
  const srNoWidth = doc.getTextWidth(srNoText);
  doc.setLineWidth(0.5);
  doc.line(40, 117, 40 + srNoWidth, 117);

  doc.text(dateText, rightX, 115);
  const dateTextWidth = doc.getTextWidth(dateText);
  doc.line(rightX, 117, rightX + dateTextWidth, 117); // Underline date

  // Customer / Sales metadata layout
  currY = 129; // Reduced gap between SR.NO. (115) and To, (129) to 14pt
  const prefixWidth = doc.getTextWidth("ADD. – ");
  const alignX = 40 + prefixWidth; // Align TEST, KATARGAM, and SURAT exactly vertically at this X coordinate

  // Row 2: To, (left) and SALES PERSON (right)
  doc.text('To,', 40, currY);
  doc.text(salesText, rightX, currY);

  // Row 3: Customer Name (left, indented to alignX) and CONTACT NO (right)
  currY += 14;
  doc.text((lead?.fullName || '').trim().toUpperCase(), alignX, currY);
  doc.text(contactText, rightX, currY);

  // Row 4: Address Line 1 (left)
  currY += 14;
  const address = (lead?.address || '').trim();
  const commaIdx = address.indexOf(',');
  let part1 = '';
  let part2 = '';
  if (commaIdx !== -1) {
    part1 = address.substring(0, commaIdx + 1).trim();
    part2 = address.substring(commaIdx + 1).trim();
    doc.text('ADD. – ', 40, currY);
    doc.text(part1.toUpperCase(), alignX, currY);
  } else {
    doc.text('ADD. – ', 40, currY);
    doc.text(address.toUpperCase() || '-', alignX, currY);
  }

  // Row 5: Address Line 2 (left, indented to alignX)
  if (part2) {
    currY += 14;
    doc.text(part2.toUpperCase(), alignX, currY);
  }

  // Row 6: Mobile No (left)
  currY += 14;

  currY += 18; // Reduced space above description paragraph (desc ni upper space remove kr)
  doc.setFontSize(8.0); // Sized slightly down to fit on one line perfectly with indent
  doc.setFont('helvetica', 'normal');

  const line1 = "We are pleasure to give quotation for solar rooftop system to be installing and commissioning your Residential. As per our";
  const line2Start = "discussion with you, we will supply ";
  const kwValue = lead?.kwRequirement || '';
  const kwText = kwValue ? (kwValue.toLowerCase().includes('kw') ? kwValue : `${kwValue} kWp`) : '—';
  const line2End = " Green Energy System.";

  // Print line 1 with first-line indentation
  const firstLineIndent = 70;
  doc.text(line1, 40 + firstLineIndent, currY);

  currY += 15; // Increased line spacing for description

  doc.text(line2Start, 40, currY);
  const wStart = doc.getTextWidth(line2Start);
  const wKw = doc.getTextWidth(kwText);

  // Draw yellow rectangle highlight under the kWp text
  doc.setFillColor(255, 255, 0); // Yellow
  if (kwValue) {
    doc.setFillColor(255, 255, 0);
    doc.rect(40 + wStart, currY - 7.5, wKw, 9.5, 'F');
  }
  doc.setFont('helvetica', 'bold');
  doc.text(kwText, 40 + wStart, currY);
  doc.setFont('helvetica', 'normal'); // Restore back to normal

  doc.text(line2End, 40 + wStart + wKw, currY);
  currY += 25; // Gap before Table 1

  // Table 1: SR.NO / DESCRIPTION / AMOUNT (dynamic from rows)
  // Table 1: SR.NO / DESCRIPTION / AMOUNT columns (dynamic from rows AND options)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const optionsList: string[] = q.options?.length ? q.options : ['AMOUNT (INR)'];
  const amountHeaderLabel = optionsList.map(() => 'AMOUNT (INR)');

  const tableHead = [['SR. NO.', 'DESCRIPTION', ...amountHeaderLabel]];
  const formatAmount = (value: any): string => {
    if (!value || value.toUpperCase() === 'INCLUDED') return value || '';
    const cleanNum = String(value).replace(/[^\d]/g, '');
    if (!cleanNum) return value || '';
    const num = parseInt(cleanNum, 10);
    return num.toLocaleString('en-IN') + '/-';
  };

  const tableBody = (q.rows || []).map((row: any, idx: number) => {
    const isUnitsRow = row.title?.toLowerCase().includes('units generation');
    return [
      letters[idx] || String(idx + 1),
      row.title,
      ...optionsList.map((_, optIdx) => {
        let val = row.values?.[optIdx] || '';
        const hasMark = /<mark\b[^>]*>/i.test(val);
        val = val.replace(/<[^>]*>?/gm, ''); // strip HTML tags
        
        let formattedVal = formatAmount(val);
        
        if (isUnitsRow && val) {
          formattedVal = formattedVal.replace(/\/-$/, '').trim();
          if (formattedVal && !formattedVal.toUpperCase().match(/\s*UNIT(S)?$/i)) {
            formattedVal += ' UNIT';
          }
        }
        
        if (hasMark) {
          return `<mark>${formattedVal}</mark>`;
        }
        return formattedVal;
      })
    ];
  });

  // Build dynamic columnStyles: col 0 = SR.NO, col 1 = DESCRIPTION, remaining = one per option
  let descWidth = 340;
  if (optionsList.length > 2) {
    if (optionsList.length === 3) descWidth = 260;
    else if (optionsList.length === 4) descWidth = 210;
    else if (optionsList.length >= 5) descWidth = 170;
  }

  const fixedWidth = 45 + descWidth; // SR.NO + DESCRIPTION widths reserved
  const availableWidth = pageWidth - 80 - fixedWidth; // 80 = left+right margin (40 each)
  const perAmountColWidth = optionsList.length > 0 ? availableWidth / optionsList.length : availableWidth;

  const dynamicColumnStyles: any = {
    0: { cellWidth: 45, halign: 'center' },
    1: { cellWidth: descWidth, halign: 'center' },
  };
  optionsList.forEach((_, optIdx) => {
    dynamicColumnStyles[2 + optIdx] = { cellWidth: perAmountColWidth, halign: 'center' };
  });

  autoTable(doc, {
    startY: currY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 9,
      cellPadding: 7,
    },
    columnStyles: dynamicColumnStyles,
    margin: { left: 40, right: 40, bottom: 70 },
    rowPageBreak: 'avoid',
    didParseCell: (data: any) => {
      if (typeof data.cell.raw === 'string' && data.cell.raw.includes('<mark>')) {
        data.cell.text = [data.cell.raw.replace(/<[^>]*>?/gm, '')];
      }
    },
    willDrawCell: (data: any) => {
      if (typeof data.cell.raw === 'string' && data.cell.raw.includes('<mark>')) {
        doc.setFillColor(255, 255, 0);
        doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
      }
    },
  });

  currY = (doc as any).lastAutoTable.finalY + 25;

  // BILL OF MATERIALS heading
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF MATERIALS', pageWidth / 2, currY, { align: 'center' });
  const bomTextW = doc.getTextWidth('BILL OF MATERIALS');
  doc.line(pageWidth / 2 - bomTextW / 2, currY + 2, pageWidth / 2 + bomTextW / 2, currY + 2);

  currY += 15;

  // Table 2: BOM (dynamic from bomItems)
  const bomHead = [['SR. NO.', 'DESCRIPTION', 'UOM', 'QTY.', 'SIZE', 'MAKE']];
  // const bomBody = (q.bomItems || []).map((item: any) => {
  //   let makeText = item.make || '';
  //   if (makeText.includes('(') && makeText.toUpperCase().includes('WARRANTY')) {
  //     const openParenIdx = makeText.indexOf('(');
  //     makeText = makeText.substring(0, openParenIdx).trim() + '\n' + makeText.substring(openParenIdx).trim();
  //   }
  //   return [
  //     item.srNo,
  //     item.description,
  //     item.uom,
  //     item.qty,
  //     item.size,
  //     makeText
  //   ];
  // });

  const bomBody = (q.bomItems || []).map((item: any) => [
    stripHtml(item.srNo || ''),
    stripHtml(item.description || ''),
    stripHtml(item.uom || ''),
    stripHtml(item.qty || ''),
    stripHtml(item.size || ''),
    stripHtml(item.make || '')
  ]);

  autoTable(doc, {
    startY: currY,
    head: bomHead,
    body: bomBody,
    theme: 'grid',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      halign: 'center',
      valign: 'middle'
    },
    bodyStyles: {
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      fontStyle: 'normal',
      halign: 'center',
      valign: 'middle'
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 7,
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 120 },
      2: { cellWidth: 40 },
      3: { cellWidth: 55 },
      4: { cellWidth: 135 },
      5: { cellWidth: 140 },
    },
    margin: { left: 40, right: 40, bottom: 70 },
    rowPageBreak: 'avoid',
    willDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index >= 1 && data.column.index <= 5) {
        data.cell.text = [];
      }
    },
    didDrawCell: (data: any) => {
      if (data.section === 'body' && data.column.index >= 1 && data.column.index <= 5) {
        const fieldMap = ['srNo', 'description', 'uom', 'qty', 'size', 'make'];
        const fieldName = fieldMap[data.column.index];
        const rawItem = q.bomItems?.[data.row.index];
        const originalHtml = rawItem ? (rawItem[fieldName] || '') : '';
        const segments = parseHighlightedText(originalHtml);

        const fontSize = data.cell.styles.fontSize || 8;
        const baseFontStyle = data.column.index === 5 ? 'normal' : (data.cell.styles.fontStyle || 'normal');
        const cellPadding = data.cell.styles.cellPadding || 7;
        const maxWidth = data.cell.width - cellPadding * 2;

        const lines = wrapSegmentsToLines(doc, segments, maxWidth, fontSize, baseFontStyle);
        const lineHeight = fontSize * 1.15;
        const totalTextHeight = lines.length * lineHeight;
        const firstLineBaseline = data.cell.y + data.cell.height / 2 - totalTextHeight / 2 + fontSize;
        const centerX = data.cell.x + data.cell.width / 2;

        lines.forEach((lineSegments, lineIdx) => {
          const y = firstLineBaseline + lineIdx * lineHeight;
          renderMixedLine(doc, lineSegments, centerX, y, fontSize, baseFontStyle);
        });
      }
    }
    // }
  });

  // PAGE 2
  doc.addPage();
  let y2 = 50;

  // IMPORTANT THING :-
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const impText = 'IMPORTANT THING :-';
  const impWidth = doc.getTextWidth(impText);

  doc.setFillColor(255, 255, 0); // Yellow
  doc.rect(40, y2 - 9, impWidth, 12, 'F');
  doc.text(impText, 40, y2);
  doc.line(40, y2 + 2, 40 + impWidth, y2 + 2);

  y2 += 22;

  const importantBullets = [
    'ELCB PROVIED BY US (NO EXTRA CHARGES).',
    'WELDING WILL BE DONE WITH A ZINC SPARY AND PRIMER COATING.',
    'CABLE TIE – SS(304).',
    'METER CHARGE INLUDED AS PER (SINGLE PHASE METER)'
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');

  importantBullets.forEach(bullet => {
    drawSmileyBullet(doc, 45, y2);
    doc.text(bullet, 55, y2);
    const bWidth = doc.getTextWidth(bullet);
    doc.setLineWidth(0.5);
    doc.line(55, y2 + 2, 55 + bWidth, y2 + 2);
    y2 += 20;
  });

  y2 += 15;

  // TERMS & CONDITIONS
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS', 40, y2);
  const tcWidth = doc.getTextWidth('TERMS & CONDITIONS');
  doc.setLineWidth(0.5);
  doc.line(40, y2 + 2, 40 + tcWidth, y2 + 2);

  y2 += 22;

  const terms = [
    'Offer Valid up to 7 Days from the Date of quotation.',
    'Price As Per WP Calculation, it may vary.',
    'Dis-com modification is as actual payable by customer.',
    'Inbuilt remote monitoring system for which component such as broadband and sim to be provided by customer whichever applicable.'
  ];

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');

  terms.forEach(term => {
    drawArrowBullet(doc, 45, y2);
    const maxTextWidth = pageWidth - 40 - 55;
    const lines = doc.splitTextToSize(term, maxTextWidth);
    lines.forEach((line: string, lineIdx: number) => {
      doc.text(line, 55, y2 + lineIdx * 13);
    });
    y2 += lines.length * 13 + 7;
  });

  y2 += 15;

  // CUSTOMER SCOPE :
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER SCOPE :', 40, y2);
  const csWidth = doc.getTextWidth('CUSTOMER SCOPE :');
  doc.setLineWidth(0.5);
  doc.line(40, y2 + 2, 40 + csWidth, y2 + 2);

  y2 += 22;

  const scopes = [
    'To Provide shadow free area from 9:00 am To 4:00 pm',
    'System Cleaning Periodically.',
    'Electrical connection to instruments after MCB.',
    'Documents required for Subsidy Process.'
  ];

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');

  scopes.forEach((scope, index) => {
    doc.text(`${index + 1}.`, 45, y2);
    doc.text(scope, 55, y2);
    y2 += 18;
  });

  y2 += 15;

  // REQUIRED DOCUMENTS :
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('REQUIRED DOCUMENTS :', 40, y2);
  const rdWidth = doc.getTextWidth('REQUIRED DOCUMENTS :');
  doc.setLineWidth(0.5);
  doc.line(40, y2 + 2, 40 + rdWidth, y2 + 2);

  y2 += 22;

  const docsList = [
    'Copy of Latest Light Bill',
    'Copy of Latest Tax Bill',
    'Cancel Cheque',
    'Copy of PAN Card',
    'Copy of Aadhar Card',
    '3 Difference Site Photo'
  ];

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');

  docsList.forEach((item, index) => {
    doc.text(`${index + 1}.`, 45, y2);
    doc.text(item, 55, y2);
    y2 += 18;
  });

  y2 += 15;

  // PAYMENT CONDITION :
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT CONDITION :', 40, y2);
  const pcWidth = doc.getTextWidth('PAYMENT CONDITION :');
  doc.setLineWidth(0.5);
  doc.line(40, y2 + 2, 40 + pcWidth, y2 + 2);

  y2 += 22;

  doc.setFontSize(9.5);

  // Bullet 1
  drawArrowBullet(doc, 45, y2);
  doc.setFont('helvetica', 'bold');
  doc.text('40% Advance', 55, y2);
  const wAdv = doc.getTextWidth('40% Advance');
  doc.setFont('helvetica', 'normal');
  doc.text(' with order, Balance before Dispatch.', 55 + wAdv, y2);
  y2 += 20;

  // Bullet 2
  drawArrowBullet(doc, 45, y2);
  doc.setFont('helvetica', 'normal');
  doc.text('Materials Delivery Period 10 to 15 Days after Receiving Advance ', 55, y2);
  const wDelivery = doc.getTextWidth('Materials Delivery Period 10 to 15 Days after Receiving Advance ');
  doc.setFont('helvetica', 'bold');
  doc.text('Payment of 50%', 55 + wDelivery, y2);
  y2 += 20;

  // Bullet 3
  drawArrowBullet(doc, 45, y2);
  doc.setFont('helvetica', 'normal');
  doc.text('10% Payment after Installation Meter', 55, y2);
  y2 += 28;

  // BANK DETAILS
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('BANK DETAILS', 40, y2);
  const bdWidth = doc.getTextWidth('BANK DETAILS');
  doc.setLineWidth(0.5);
  doc.line(40, y2 + 2, 40 + bdWidth, y2 + 2);

  y2 += 14;

  const bankBody = [
    ['ACCOUNT NAME', 'GREENEABLE SOLAR SOLUTION'],
    ['BANK NAME', 'ICICI BANK'],
    ['BRANCH', 'KATARGAM'],
    ['A/C NO.', '183605002898'],
    ['IFS CODE', 'ICIC0001836']
  ];

  autoTable(doc, {
    startY: y2,
    body: bankBody,
    theme: 'grid',
    bodyStyles: {
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle'
    },
    styles: {
      fontSize: 9,
      cellPadding: 6.5,
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 220 }
    },
    margin: { left: 40, bottom: 70 },
    rowPageBreak: 'avoid',
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('GREENEABLE SOLAR SOLUTION', pageWidth / 2, pageHeight - 50, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Add. :- 215, Escon Plaza, Above SBI Bank, Amroli, Surat – 394107.', pageWidth / 2, pageHeight - 38, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('+91-75672 79320 | +91-99131 68126', pageWidth / 2, pageHeight - 28, { align: 'center' });
  }

  doc.save(`Quotation_${lead?.fullName || 'lead'}_${q.id}.pdf`);
};
