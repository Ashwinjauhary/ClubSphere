import { Document, Paragraph, HeadingLevel, AlignmentType, Packer } from 'docx';
import { saveAs } from 'file-saver';
import type { GeneratedReport } from '../types';

export const generateReportDOCX = async (title: string, content: GeneratedReport, clubName?: string) => {
    const sections = [];
    let sectionNumber = 1;

    // Cover Page
    sections.push(
        new Paragraph({
            text: title.toUpperCase(),
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 200 }
        }),
        new Paragraph({
            text: 'Event Report',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: clubName || 'ClubSphere',
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        }),
        new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        }),
        new Paragraph({ text: '', pageBreakBefore: true })
    );

    // Table of Contents (simplified)
    sections.push(
        new Paragraph({
            text: 'Table of Contents',
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 }
        }),
        new Paragraph({ text: '1. Introduction' }),
        new Paragraph({ text: '2. Objectives' }),
        new Paragraph({ text: '3. Program Outcomes Mapping' }),
        new Paragraph({ text: '4. Event Flow & Highlights' }),
        new Paragraph({ text: '5. Outcomes & Conclusion' }),
        new Paragraph({ text: '6. Impact Analysis' })
    );

    if (content.customSections && content.customSections.length > 0) {
        content.customSections.forEach((section, idx) => {
            sections.push(new Paragraph({ text: `${7 + idx}. ${section.title}` }));
        });
    }

    sections.push(new Paragraph({ text: '', pageBreakBefore: true }));

    // Main Content
    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Introduction`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.introduction,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Objectives`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.objectivesContent,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Program Outcomes (PO) Mapping`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.poJustification,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Event Flow & Highlights`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.flowContent,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Outcomes & Conclusion`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.conclusion,
            spacing: { after: 200 }
        })
    );

    sections.push(
        new Paragraph({
            text: `${sectionNumber++}. Impact Analysis`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 }
        }),
        new Paragraph({
            text: content.impactAnalysis,
            spacing: { after: 200 }
        })
    );

    // Custom Sections
    if (content.customSections && content.customSections.length > 0) {
        for (const section of content.customSections) {
            sections.push(
                new Paragraph({
                    text: `${sectionNumber++}. ${section.title}`,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 200, after: 100 }
                }),
                new Paragraph({
                    text: section.content,
                    spacing: { after: 200 }
                })
            );
        }
    }

    // Image Gallery Section (Note: Images require special handling in docx)
    if (content.images && content.images.length > 0) {
        sections.push(
            new Paragraph({
                text: `${sectionNumber}. Event Gallery`,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 100 }
            })
        );

        content.images.forEach(img => {
            sections.push(
                new Paragraph({
                    text: img.caption || 'Event Photo',
                    spacing: { after: 100 }
                })
            );
        });
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: sections
        }]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${title.replace(/\s+/g, '_')}_Report.docx`);
};
