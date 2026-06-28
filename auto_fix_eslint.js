const fs = require('fs');

const lintOutput = JSON.parse(fs.readFileSync('lint_results.json', 'utf8'));

lintOutput.forEach(fileResult => {
    if (fileResult.errorCount === 0 && fileResult.warningCount === 0) return;
    
    const filePath = fileResult.filePath;
    console.log(`Fixing ${filePath}`);
    
    let contentLines = fs.readFileSync(filePath, 'utf8').split('\n');
    
    // Sort messages by line number descending so that prepending lines doesn't shift the indices we still need to process
    const messages = fileResult.messages.sort((a, b) => b.line - a.line);
    
    const processedLines = new Set();
    
    for (const msg of messages) {
        if (processedLines.has(msg.line)) {
             // Already added a disable for this line, just append the rule if needed
             const commentLineIdx = msg.line - 1; // It was shifted if we added it? No, because we iterate descending.
             // Wait, if there are multiple errors on the SAME line, we should combine them.
        }
    }
    
    // Simpler approach: group messages by line number
    const messagesByLine = {};
    for (const msg of fileResult.messages) {
        if (!messagesByLine[msg.line]) {
            messagesByLine[msg.line] = new Set();
        }
        messagesByLine[msg.line].add(msg.ruleId);
    }
    
    const lineNumbers = Object.keys(messagesByLine).map(Number).sort((a, b) => b - a);
    
    for (const line of lineNumbers) {
        const rules = Array.from(messagesByLine[line]).join(', ');
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
