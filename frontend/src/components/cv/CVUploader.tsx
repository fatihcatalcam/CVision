import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface CVUploaderProps {
  onUploadSuccess: (cvId: number) => void;
}

export function CVUploader({ onUploadSuccess }: CVUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (selectedFile: File): boolean => {
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Only PDF and TXT are supported.');
      return false;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 5MB.');
      return false;
    }
    return true;
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const triggerFileUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/cvs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('CV Uploaded successfully!');
      onUploadSuccess(response.data.id);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to upload CV');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
            transition-all duration-300 flex flex-col items-center justify-center min-h-[250px]
            ${isDragging 
              ? 'border-[var(--color-primary)] bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
              : 'border-[var(--color-card-border)] hover:border-[var(--color-muted)] hover:bg-[rgba(255,255,255,0.02)]'
            }
          `}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.txt"
            className="hidden"
          />
          <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-blue-500/20 text-[var(--color-primary)]' : 'bg-zinc-800 text-[var(--color-muted)]'}`}>
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Upload your CV</h3>
          <p className="text-[var(--color-muted)] mb-4">
            Drag and drop your file here, or click to browse
          </p>
          <div className="flex gap-4 text-xs font-medium text-[var(--color-muted-foreground)]">
            <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">PDF</span>
            <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">TXT</span>
            <span className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700">Max 5MB</span>
          </div>
        </div>
      ) : (
        <div className="border border-[var(--color-card-border)] rounded-2xl p-6 bg-[rgba(24,24,27,0.5)] flex flex-col items-center animate-in slide-up">
          <div className="flex items-center gap-4 w-full p-4 bg-zinc-900 rounded-xl border border-[var(--color-card-border)] mb-6">
            <div className="p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg">
              <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-white font-medium truncate">{file.name}</h4>
              <p className="text-[var(--color-muted)] text-sm">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.includes('pdf') ? 'PDF Document' : 'Text File'}
              </p>
            </div>
            {!isUploading && (
              <button 
                onClick={() => setFile(null)}
                className="p-2 text-[var(--color-muted)] hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <Button 
            className="w-full max-w-sm" 
            onClick={triggerFileUpload}
            isLoading={isUploading}
            disabled={isUploading}
          >
            {isUploading ? 'Uploading & Preparing...' : 'Run Analysis Engine'}
          </Button>
        </div>
      )}
    </div>
  );
}
