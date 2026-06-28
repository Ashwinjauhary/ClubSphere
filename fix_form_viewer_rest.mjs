import fs from 'fs';

let content = fs.readFileSync('src/pages/FormViewerPage.tsx', 'utf8');

content = content.replace(
    /        if \(formId\) fetchForm\(\);\n    }, \[formId, user\]\);/g,
    '        if (formId) fetchForm();\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [formId, user]);'
);

content = content.replace(/const onSubmit = async \(formData: any\) => {/g, 'const onSubmit = async (formData: Record<string, unknown>) => {');
content = content.replace(/\(opt: any, idx: number\)/g, '(opt: unknown, idx: number)');

fs.writeFileSync('src/pages/FormViewerPage.tsx', content, 'utf8');
console.log('Fixed FormViewerPage types');
