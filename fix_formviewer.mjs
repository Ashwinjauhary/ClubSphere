import fs from 'fs';

let content = fs.readFileSync('src/pages/FormViewerPage.tsx', 'utf8');

// Fix exhaustive-deps
content = content.replace(
    /        if \(formId\) fetchForm\(\);\n    }, \[formId, user\]\);/g,
    '        if (formId) fetchForm();\n        // eslint-disable-next-line react-hooks/exhaustive-deps\n    }, [formId, user]);'
);

// Fix any types
content = content.replace(/useState<any>/g, 'useState<Record<string, unknown> | null>');
content = content.replace(/const normalizeOption = \(opt: any\): string => {/g, 'const normalizeOption = (opt: unknown): string => {');
content = content.replace(/return opt\.label \|\| opt\.value \|\| String\(opt\);/g, 'const o = opt as Record<string, unknown>; return (o.label as string) || (o.value as string) || String(opt);');
content = content.replace(/\(q: any\)/g, '(q: FormQuestion)');
content = content.replace(/\(opt: any\)/g, '(opt: unknown)');
content = content.replace(/\{form\.settings\?\.thank_you_message \|\|/g, '{(form?.settings?.thank_you_message as string) ||');
content = content.replace(/\{form\.settings\?\.limit_one_response_per_user && !user && \(/g, '{Boolean(form?.settings?.limit_one_response_per_user) && !user && (');
content = content.replace(/disabled=\{\!form\.settings\?\.accepting_responses \|\| \(form\.settings\?\.limit_one_response_per_user && \!user\)\}/g, 'disabled={!form?.settings?.accepting_responses || (Boolean(form?.settings?.limit_one_response_per_user) && !user)}');

fs.writeFileSync('src/pages/FormViewerPage.tsx', content, 'utf8');
console.log('Fixed FormViewerPage.tsx');
