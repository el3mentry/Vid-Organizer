export interface VideoFile {
  name: string;
  path: string;
  size: number;
  nameWithoutExt: string;
  createdAt: Date;
}

export interface ElectronAPI {
  selectDirectory: () => Promise<string | null>;
  scanVideos: (directory: string) => Promise<VideoFile[]>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
