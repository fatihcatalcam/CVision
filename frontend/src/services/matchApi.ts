import api from './api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface JDResponse {
  id: string;
  title: string | null;
  company: string | null;
  url: string | null;
  created_at: string;
}

export interface FetchUrlResponse {
  supported: boolean;
  extracted_text: string | null;
  message: string | null;
}

export interface GapItem {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}

export interface MatchResponse {
  id: string;
  cv_id: string;
  jd_id: string;
  match_score: number;
  summary: string | null;
  matched_keywords: string[];
  missing_keywords: string[];
  gap_analysis: GapItem[];
  created_at: string;
}

export interface CoverLetterResponse {
  id: string;
  cv_id: string;
  jd_id: string;
  content: string;
  created_at: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function fetchUrlText(url: string): Promise<FetchUrlResponse> {
  const res = await api.post<FetchUrlResponse>('/jd/fetch-url', { url });
  return res.data;
}

export async function saveJD(params: {
  raw_text: string;
  url?: string;
  title?: string;
  company?: string;
}): Promise<JDResponse> {
  const res = await api.post<JDResponse>('/jd/', params);
  return res.data;
}

export async function listJDs(): Promise<JDResponse[]> {
  const res = await api.get<JDResponse[]>('/jd/');
  return res.data;
}

export async function createMatch(cvId: string, jdId: string): Promise<MatchResponse> {
  const res = await api.post<MatchResponse>('/match/', { cv_id: cvId, jd_id: jdId });
  return res.data;
}

export async function getMatch(matchId: string): Promise<MatchResponse> {
  const res = await api.get<MatchResponse>(`/match/${matchId}`);
  return res.data;
}

export async function createCoverLetter(cvId: string, jdId: string): Promise<CoverLetterResponse> {
  const res = await api.post<CoverLetterResponse>('/cover-letter/', { cv_id: cvId, jd_id: jdId });
  return res.data;
}
