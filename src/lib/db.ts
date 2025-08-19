import localforage from "localforage";
import { parseBlob, IAudioMetadata } from "music-metadata-browser";

export type TrackId = string;

export type StoredTrack = {
  id: TrackId;
  title: string;
  artist: string;
  album?: string;
  durationSec?: number;
  pictureDataUrl?: string;
  mimeType: string;
  sizeBytes: number;
  addedAt: number;
};

const metaStore = localforage.createInstance({
  name: "mp3player",
  storeName: "trackMeta",
});

const blobStore = localforage.createInstance({
  name: "mp3player",
  storeName: "trackBlobs",
});

export async function getAllTracks(): Promise<StoredTrack[]> {
  const tracks: StoredTrack[] = [];
  await metaStore.iterate<StoredTrack, void>((value) => {
    tracks.push(value);
  });
  // Newest first
  tracks.sort((a, b) => b.addedAt - a.addedAt);
  return tracks;
}

export async function getTrackBlob(id: TrackId): Promise<Blob | null> {
  const blob = await blobStore.getItem<Blob>(id);
  return blob ?? null;
}

export async function removeTrack(id: TrackId): Promise<void> {
  await Promise.all([metaStore.removeItem(id), blobStore.removeItem(id)]);
}

export async function clearAll(): Promise<void> {
  await Promise.all([metaStore.clear(), blobStore.clear()]);
}

function generateId(): TrackId {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uint8ToBase64(uint8: Uint8Array): string {
  let binary = "";
  const len = uint8.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  return btoa(binary);
}

function extractPictureDataUrl(metadata: IAudioMetadata): string | undefined {
  const picture = metadata.common.picture && metadata.common.picture[0];
  if (!picture) return undefined;
  const base64 = uint8ToBase64(picture.data);
  const mime = picture.format || "image/jpeg";
  return `data:${mime};base64,${base64}`;
}

export async function parseAndStoreFiles(files: File[]): Promise<StoredTrack[]> {
  const acceptedMimePrefixes = ["audio/"];
  const imported: StoredTrack[] = [];
  for (const file of files) {
    if (!acceptedMimePrefixes.some((p) => file.type.startsWith(p))) {
      continue;
    }
    try {
      const id = generateId();
      const metadata = await parseBlob(file);
      const title = metadata.common.title || file.name.replace(/\.[^/.]+$/, "");
      const artist = metadata.common.artist || "Unknown Artist";
      const album = metadata.common.album || undefined;
      const durationSec = metadata.format.duration || undefined;
      const pictureDataUrl = extractPictureDataUrl(metadata);
      const track: StoredTrack = {
        id,
        title,
        artist,
        album,
        durationSec,
        pictureDataUrl,
        mimeType: file.type || "audio/mpeg",
        sizeBytes: file.size,
        addedAt: Date.now(),
      };
      await Promise.all([
        metaStore.setItem(id, track),
        blobStore.setItem(id, new Blob([await file.arrayBuffer()], { type: track.mimeType })),
      ]);
      imported.push(track);
    } catch (err) {
      // Skip file on parse error
      // In a real app we might surface a toast here
      // console.error("Failed to import", file.name, err);
      continue;
    }
  }
  return imported;
}


