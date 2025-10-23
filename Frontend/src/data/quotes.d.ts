declare module '@/data/quotes.json' {
  interface Quote {
    text: string;
    author: string;
  }

  interface QuotesData {
    quotes: Quote[];
  }

  const quotesData: QuotesData;
  export default quotesData;
}

