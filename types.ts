
export type FontSize = 'small' | 'medium' | 'large';

export interface TeleprompterSettings {
  speed: number; // Words (characters) per minute
  fontSize: FontSize;
  mirrorMode: boolean;
  showFocusLine: boolean;
  script: string;
}

export enum AppMode {
  EDITOR = 'editor',
  FLOATING = 'floating'
}
