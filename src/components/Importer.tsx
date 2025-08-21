"use client";

import { usePlayerStore } from "@/store/playerStore";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

// Lazy, optional native modules (kept as any to avoid type deps and lint issues)
const getNative = () => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cap: any = (window as any).Capacitor || undefined;
    // Only attempt require when running in a native WebView context and module exists
    if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const mod = require("@capawesome/capacitor-file-picker");
        return { cap, filePicker: mod?.FilePicker } as const;
      } catch {
        return { cap, filePicker: null } as const;
      }
    }
  } catch {}
  return { cap: null, filePicker: null } as const;
};

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
      className={`rounded-2xl border border-dashed p-5 text-center transition-colors neon-import neon-card ${
        isDragActive ? "border-black dark:border-white bg-black/5 dark:bg-white/10" : "border-black/20 dark:border-white/20"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex items-center justify-center gap-3">
        <Upload className="size-5" />
        <div className="text-sm">Drag and drop audio files here</div>
      </div>
      <div className="mt-4">
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
        {(() => { const { cap, filePicker } = getNative(); return cap && filePicker; })() ? (
          <button
            type="button"
            onClick={async () => {
              const { filePicker } = getNative();
              if (!filePicker) return;
              setIsImporting(true);
              try {
                const result = await filePicker.pickFiles({ types: ["audio/*"], multiple: true, readData: true });
                const files: File[] = [];
                for (const item of result.files || []) {
                  if (item.data) {
                    const byteCharacters = atob(item.data);
                    const byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const blob = new Blob([new Uint8Array(byteNumbers)], { type: item.mimeType || "audio/mpeg" });
                    files.push(new File([blob], item.name || "track.mp3", { type: blob.type }));
                  }
                }
                if (files.length) await importFiles(files);
              } catch {
                // ignore cancellations
              } finally {
                setIsImporting(false);
              }
            }}
            className="ml-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg neon-btn"
          >
            Use native picker
          </button>
        ) : null}
      </div>
    </div>
  );
}


