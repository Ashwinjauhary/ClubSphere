import jsPDF from 'jspdf';
import type { GeneratedReport } from '../types';

export const generateReportPDF = async (
    title: string,
    content: GeneratedReport,
    posterUrl?: string,
    letterheadHeader?: string,
    letterheadFooter?: string
) => {
    const doc = new jsPDF();
    let yPos = 20;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let sectionNumber = 1;

    const addText = async (text: string, fontSize = 12, fontStyle = 'normal', color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', fontStyle);
        doc.setTextColor(color[0], color[1], color[2]);

        const splitText = doc.splitTextToSize(text, pageWidth - (2 * margin));
        const textHeight = splitText.length * 6;
        const footerSpace = letterheadFooter ? 25 : 20;

        if (yPos + textHeight > pageHeight - footerSpace) {
            doc.addPage();
            await addLetterhead();
            yPos = letterheadHeader ? 35 : margin;
        }

        doc.text(splitText, margin, yPos);
        yPos += textHeight + 5;
    };

    const loadImage = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    resolve(canvas.toDataURL("image/jpeg"));
                } else {
                    reject("Canvas context failed");
                }
            };
            img.onerror = () => reject("Image load failed");
        });
    };

    const addLetterhead = async (isFirstPage = false) => {
        // Add header letterhead
        if (letterheadHeader) {
            try {
                const headerImg = await loadImage(letterheadHeader);
                doc.addImage(headerImg, 'PNG', 0, 0, pageWidth, 25);
            } catch (err) {
                console.warn("Failed to load header letterhead", err);
            }
        }

        // Add footer letterhead
        if (letterheadFooter) {
            try {
                const footerImg = await loadImage(letterheadFooter);
                doc.addImage(footerImg, 'PNG', 0, pageHeight - 20, pageWidth, 20);
            } catch (err) {
                console.warn("Failed to load footer letterhead", err);
            }
        }

        // Add page number in footer (skip first page)
        if (!isFirstPage) {
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
    };

    // === COVER PAGE ===
    await addLetterhead(true);

    // College/Institution Name (if no letterhead, show text)
    const startY = letterheadHeader ? 30 : 10;
    if (!letterheadHeader) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text('PSIT KANPUR', pageWidth / 2, 15, { align: 'center' });
    }

    // Main title area with background
    doc.setFillColor(0, 51, 102);
    doc.rect(0, startY, pageWidth, 60, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title.toUpperCase(), pageWidth - 40);
    const titleY = startY + 25;
    doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Event Report', pageWidth / 2, titleY + 20, { align: 'center' });

    // Poster Image on Cover
    const posterY = startY + 70;
    if (posterUrl) {
        try {
            const posterImg = await loadImage(posterUrl);
            const posterWidth = 120;
            const posterHeight = 80;
            const posterX = (pageWidth - posterWidth) / 2;
            doc.addImage(posterImg, 'JPEG', posterX, posterY, posterWidth, posterHeight);
            yPos = posterY + posterHeight + 10;
        } catch (err) {
            console.warn("Failed to load poster image", err);
            yPos = 100;
        }
    } else {
        yPos = 100;
    }

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

    // === CONTENT PAGES ===
    doc.addPage();
    await addLetterhead();
    yPos = letterheadHeader ? 35 : margin;

    // Table of Contents
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 51, 102);
    doc.text('Table of Contents', margin, yPos);
    yPos += 15;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0);
    const tocItems = [
        '1. Introduction',
        '2. Objectives',
        '3. Program Outcomes Mapping',
        '4. Event Flow & Highlights',
        '5. Outcomes & Conclusion',
        '6. Impact Analysis'
    ];

    if (content.customSections && content.customSections.length > 0) {
        content.customSections.forEach((section, idx) => {
            tocItems.push(`${7 + idx}. ${section.title}`);
        });
    }

    if (content.images && content.images.length > 0) {
        tocItems.push(`${tocItems.length + 1}. Event Gallery`);
    }

    tocItems.forEach(item => {
        doc.text(item, margin + 5, yPos);
        yPos += 8;
    });

    // Start Main Content
    doc.addPage();
    yPos = margin;

    // Sections
    addText(`${sectionNumber++}. Introduction`, 16, 'bold', [0, 51, 102]);
    addText(content.introduction);
    yPos += 8;

    addText(`${sectionNumber++}. Objectives`, 16, 'bold', [0, 51, 102]);
    addText(content.objectivesContent);
    yPos += 8;

    addText(`${sectionNumber++}. Program Outcomes (PO) Mapping`, 16, 'bold', [0, 51, 102]);
    addText(content.poJustification);
    yPos += 8;

    addText(`${sectionNumber++}. Event Flow & Highlights`, 16, 'bold', [0, 51, 102]);
    addText(content.flowContent);
    yPos += 8;

    addText(`${sectionNumber++}. Outcomes & Conclusion`, 16, 'bold', [0, 51, 102]);
    addText(content.conclusion);
    yPos += 8;

    addText(`${sectionNumber++}. Impact Analysis`, 16, 'bold', [0, 100, 0]);
    addText(content.impactAnalysis);
    yPos += 8;

    // Custom Sections
    if (content.customSections && content.customSections.length > 0) {
        for (const section of content.customSections) {
            addText(`${sectionNumber++}. ${section.title}`, 16, 'bold', [102, 0, 102]);
            addText(section.content);
            yPos += 8;
        }
    }

    // Images
    if (content.images && content.images.length > 0) {
        doc.addPage();
        yPos = margin;
        addText(`${sectionNumber}. Event Gallery`, 16, 'bold', [0, 51, 102]);
        yPos += 10;

        for (const imgData of content.images) {
            try {
                if (yPos > pageHeight - 120) {
                    doc.addPage();
                    yPos = margin;
                }

                const base64Img = await loadImage(imgData.url);
                const imgWidth = pageWidth - (2 * margin);
                const imgHeight = 100;

                doc.addImage(base64Img, 'JPEG', margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 5;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(100);
                doc.text(imgData.caption || "Event Photo", margin, yPos);
                yPos += 15;
            } catch (err) {
                console.warn("Failed to load PDF image", err);
            }
        }
    }

    doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
};
