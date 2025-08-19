"use client";

import { usePlayerStore } from "@/store/playerStore";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

export default function Importer() {
  const importFiles = usePlayerStore((s) => s.importFiles);
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setIsImporting(true);
      try {
        await importFiles(accepted);
      } finally {
        setIsImporting(false);
      }
    },
    [importFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, noClick: true, accept: { "audio/*": [] } });

  return (
    <div
      {...getRootProps()}
      className={`rounded-2xl border border-dashed p-4 sm:p-6 text-center transition-colors neon-import neon-card ${
        isDragActive ? "border-black dark:border-white bg-black/5 dark:bg-white/10" : "border-black/20 dark:border-white/20"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-3">
        <Upload className="size-5" />
        <div className="text-sm">Drag and drop audio files here</div>
      </div>
      <div className="mt-3">
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-black text-white dark:bg-white dark:text-black cursor-pointer hover:opacity-90 neon-btn">
          <Upload className="size-4" />
          <span>{isImporting ? "Importing..." : "Choose files"}</span>
          <input
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={async (e) => {
              const files = Array.from(e.target.files || []);
              if (files.length === 0) return;
              setIsImporting(true);
              try {
                await importFiles(files);
              } finally {
                setIsImporting(false);
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}


