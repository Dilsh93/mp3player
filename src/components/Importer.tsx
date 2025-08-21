"use client";

import { usePlayerStore } from "@/store/playerStore";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { useCallback, useState } from "react";

let Capacitor: any = null;
let FilePicker: any = null;
try {
  // Optional native imports when running under Capacitor
  // These are dynamic so web build won't fail
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Capacitor = require("@capacitor/core").Capacitor;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  // Optional dependency: only used in native builds if installed in the app project
  try { FilePicker = require("@capawesome/capacitor-file-picker").FilePicker; } catch { FilePicker = null; }
} catch {}

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
        {Capacitor?.isNativePlatform?.() && FilePicker ? (
          <button
            type="button"
            onClick={async () => {
              if (!FilePicker) return;
              setIsImporting(true);
              try {
                const result = await FilePicker.pickFiles({ types: ["audio/*"], multiple: true, readData: true });
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


