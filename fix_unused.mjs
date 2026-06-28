import fs from 'fs';
import { execSync } from 'child_process';

const files = [
    'src/pages/FormsListPage.tsx',
    'src/pages/LoginPage.tsx',
    'src/pages/QRScannerFormPage.tsx',
    'src/pages/RegisterPage.tsx'
];

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/} catch \(err\) {/g, '} catch {');
    content = content.replace(/} catch \(error\) {/g, '} catch {');
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed unused vars');
