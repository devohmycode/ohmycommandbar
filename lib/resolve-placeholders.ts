const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

/** Resolve all dynamic placeholders (async – reads clipboard). */
export async function resolvePlaceholders(body: string): Promise<string> {
  const now = new Date();
  let result = body;

  result = result.replaceAll("{date}", formatDate(now));
  result = result.replaceAll("{time}", formatTime(now));
  result = result.replaceAll("{datetime}", `${formatDate(now)} ${formatTime(now)}`);
  result = result.replaceAll("{day}", DAYS[now.getDay()]);

  if (result.includes("{clipboard}")) {
    try {
      const clip = await navigator.clipboard.readText();
      result = result.replaceAll("{clipboard}", clip);
    } catch {
      result = result.replaceAll("{clipboard}", "");
    }
  }

  // Each {uuid} gets a unique value
  while (result.includes("{uuid}")) {
    result = result.replace("{uuid}", crypto.randomUUID());
  }

  return result;
}

/** Preview placeholders (sync – leaves {clipboard} and {uuid} as-is). */
export function previewPlaceholders(body: string): string {
  const now = new Date();
  let result = body;

  result = result.replaceAll("{date}", formatDate(now));
  result = result.replaceAll("{time}", formatTime(now));
  result = result.replaceAll("{datetime}", `${formatDate(now)} ${formatTime(now)}`);
  result = result.replaceAll("{day}", DAYS[now.getDay()]);

  return result;
}
