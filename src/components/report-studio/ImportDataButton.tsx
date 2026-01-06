import { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { parseImportFile, type ImportedData } from '../../utils/importParser';

interface ImportDataButtonProps {
    onImport: (data: ImportedData) => void;
}

export const ImportDataButton = ({ onImport }: ImportDataButtonProps) => {
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const data = await parseImportFile(file);
            onImport(data);
            alert(`✅ Successfully imported data from ${file.name}!`);
        } catch (error) {
            console.error('Import error:', error);
            alert(`❌ Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsImporting(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="flex items-center gap-3">
            <input
                ref={fileInputRef}
                type="file"
                accept=".json,.md,.txt,.markdown"
                onChange={handleFileChange}
                className="hidden"
                disabled={isImporting}
            />
            <Button
                variant="outline"
                className="w-full"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
            >
                {isImporting ? (
                    <>
                        <FileText className="h-4 w-4 mr-2 animate-pulse" />
                        Importing...
                    </>
                ) : (
                    <>
                        <Upload className="h-4 w-4 mr-2" />
                        Quick Import
                    </>
                )}
            </Button>
            <span className="text-xs text-gray-500">
                Upload .json, .md, or .txt file
            </span>
        </div>
    );
};
