/**
 * 语料入口。corpus.generated.ts 由 `npm run corpus` 生成，不进 Git。
 * 这里只做类型收窄与派生数据，方便测试与函数复用同一份来源。
 */
import { corpusData } from './corpus.generated';
import type { SourceRef } from './prompt';

export interface CorpusSource extends SourceRef {
  text: string;
}

export interface Corpus {
  generatedAt: string;
  characterCount: number;
  estimatedTokens: number;
  sources: CorpusSource[];
  material: string;
}

export const corpus: Corpus = corpusData;

/** 下发给模型的白名单键，与 prompt 里声明的一致。 */
export const corpusSourceKeys: string[] = corpus.sources.map((source) => source.key);

/** 回给前端时只暴露 key / title / url，不带语料正文。 */
export const corpusSourceRefs: SourceRef[] = corpus.sources.map(({ key, title, url }) => ({
  key,
  title,
  url,
}));
