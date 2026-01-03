
export interface TitleOption {
  text: string;
  rank: number; // 1 (best) to 5 (worst)
  reasoning: string;
}

export interface VideoAnalysis {
  transcription: string;
  trendingKeywords: string[];
  sources: { title: string; uri: string }[];
  titles: TitleOption[];
  descriptions: {
    youtube: string;
    instagram: string;
  };
  thumbnailConcept: {
    idea: string;
    prompt: string;
  };
}

export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  GENERATING_THUMBNAIL = 'GENERATING_THUMBNAIL',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
