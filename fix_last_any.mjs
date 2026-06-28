import fs from 'fs';

const files = [
    'src/pages/AIEventManagerPage.tsx',
    'src/pages/ApprovalsPage.tsx',
    'src/pages/EventFeedbackStatsPage.tsx',
    'src/pages/FormStatsPage.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace specific any patterns in these files
    content = content.replace(/: any/g, ': Record<string, unknown>');
    content = content.replace(/<any/g, '<Record<string, unknown>');
    content = content.replace(/as any/g, 'as Record<string, unknown>');
    
    fs.writeFileSync(file, content, 'utf8');
});
console.log('Replaced any in 4 remaining files');
