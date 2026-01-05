export type ExtractResult = {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  images?: string[];
  mainImage?: string;
};

export type ProviderResponse = {
  result: ExtractResult;
  source: string;
  blocked?: boolean;
  needsHeadless?: boolean;
};

export type Provider = {
  matches(url: URL): boolean;
  extract(url: URL): Promise<ProviderResponse>;
};
