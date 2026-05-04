/**
 * .what = finds first record with target content from async iterator
 * .why = cloudflare api filters by name+type but not content, so we filter client-side
 */
export const findFirstRecordByContent = async <
  T extends { content?: string | null },
>(
  records: AsyncIterable<T>,
  targetContent: string,
): Promise<T | null> => {
  for await (const record of records) {
    if (record.content === targetContent) return record;
  }
  return null;
};
