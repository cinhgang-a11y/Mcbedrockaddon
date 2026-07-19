export type Section = "addons" | "maps";

export interface CfLinks {
  websiteUrl?: string;
}

export interface CfMod {
  id: number;
  name: string;
  slug: string;
  summary: string;
  downloadCount: number;
  dateModified: string;
  logo?: { url: string; thumbnailUrl?: string } | null;
  screenshots?: { url: string; thumbnailUrl?: string; title?: string }[];
  authors?: { name: string }[];
  links?: CfLinks;
  categories?: { id: number; name: string }[];
}

export interface CfFile {
  id: number;
  fileName: string;
  displayName: string;
  downloadUrl: string | null;
  fileDate: string;
  fileLength: number;
  releaseType: 1 | 2 | 3;
  gameVersions: string[];
  modId: number;
}

export interface Pagination {
  index: number;
  pageSize: number;
  resultCount: number;
  totalCount: number;
}

export interface SearchResponse {
  data: CfMod[];
  pagination?: Pagination;
  warning?: string;
}

export interface FilesResponse {
  data: CfFile[];
  pagination?: Pagination;
}

export interface HealthResponse {
  ok: boolean;
  curseforgeConfigured: boolean;
}
