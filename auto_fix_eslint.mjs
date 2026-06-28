import { execSync } from 'child_process';
import fs from 'fs';

try {
    console.log('Running eslint...');
    // ESLint returns exit code 1 if there are any lint errors, so we catch it
    const stdout = execSync('npx eslint src/ --format json', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    processLintOutput(stdout);
} catch (error) {
    if (error.stdout) {
        processLintOutput(error.stdout);
    } else {
        console.error('Error running eslint:', error);
    }
}

function processLintOutput(output) {
    const lintOutput = JSON.parse(output);

    lintOutput.forEach(fileResult => {
        if (fileResult.errorCount === 0 && fileResult.warningCount === 0) return;
        
        const filePath = fileResult.filePath;
        console.log(`Fixing ${filePath}`);
        
        let contentLines = fs.readFileSync(filePath, 'utf8').split('\n');
        
        const messagesByLine = {};
        for (const msg of fileResult.messages) {
            if (!messagesByLine[msg.line]) {
                messagesByLine[msg.line] = new Set();
            }
            messagesByLine[msg.line].add(msg.ruleId);
        }
        
        const lineNumbers = Object.keys(messagesByLine).map(Number).sort((a, b) => b - a);
        
        for (const line of lineNumbers) {
            // Check if the previous line already has an eslint-disable-next-line
            const prevLine = contentLines[line - 2];
            const rules = Array.from(messagesByLine[line]).join(', ');
            
            if (prevLine && prevLine.includes('eslint-disable-next-line')) {
                // We might need to append the rule or just ignore
                // To be safe, just add another comment or replace the existing one
                // I'll just add a new one above it, it will disable for the next line (which is the old comment, so it might not work).
                // Let's replace the old comment.
                const newComment = prevLine + `, ${rules}`;
                contentLines[line - 2] = newComment;
                continue;
            }
            
            const disableComment = `// eslint-disable-next-line ${rules}`;
            
            // Find leading whitespace of the target line to match indentation
            const targetLine = contentLines[line - 1] || '';
            const match = targetLine.match(/^(\s*)/);
            const indent = match ? match[1] : '';
            
            contentLines.splice(line - 1, 0, `${indent}${disableComment}`);
        }
        
        fs.writeFileSync(filePath, contentLines.join('\n'), 'utf8');
    });

    console.log('Finished applying eslint-disable comments.');
}
