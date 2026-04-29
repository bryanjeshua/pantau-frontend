"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";

interface Props {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

export default function UploadZone({ onFileSelect, accept, disabled }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    accept: accept ?? {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
    },
  });

  function clearFile(e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedFile(null);
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <File className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>
        </div>
        <button
          onClick={clearFile}
          disabled={disabled}
          className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5 text-primary"
          : disabled
          ? "cursor-not-allowed border-border bg-muted/50 text-muted-foreground"
          : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50 hover:bg-primary/5"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className={`mb-3 h-8 w-8 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
      <p className="text-sm font-medium">
        {isDragActive ? "Lepas file di sini" : "Seret file atau klik untuk pilih"}
      </p>
      <p className="mt-1 text-xs">PDF, XLSX, XLS — maks. 20 MB</p>
    </div>
  );
}
