export type EcbReferenceRate = { date: string; rate: number };

export function parseEcbReferenceRatesXml(xml: string, currency = "INR") {
  const observations: EcbReferenceRate[] = [];
  const datePattern = /<Cube\s+time=["'](\d{4}-\d{2}-\d{2})["'][^>]*>([\s\S]*?)<\/Cube>/g;
  const currencyPattern = new RegExp(
    `<Cube\\s+currency=["']${currency.toUpperCase()}["']\\s+rate=["']([0-9.]+)["']\\s*\\/>`,
  );
  for (const match of xml.matchAll(datePattern)) {
    const rateMatch = match[2]?.match(currencyPattern);
    const rate = Number(rateMatch?.[1]);
    if (match[1] && Number.isFinite(rate) && rate > 0) observations.push({ date: match[1], rate });
  }
  return observations.sort((left, right) => left.date.localeCompare(right.date));
}
