export type ParsedInbound =
  | { kind: "CALLBACK"; name?: string; area?: string; notes?: string }
  | {
      kind: "REQUEST";
      categoryName: string;
      title: string;
      description: string;
      address?: string;
    }
  | { kind: "UNKNOWN" };

const STREET_REGEX =
  /\b\d+\s+[a-z0-9\s]{3,}\b(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|way|close|crescent|cres|boulevard|blvd)\b/i;

function extractAddress(text: string) {
  const lower = text.toLowerCase();
  const addressIndex = lower.indexOf("address:");
  if (addressIndex >= 0) {
    const address = text.slice(addressIndex + "address:".length).trim();
    return address || undefined;
  }

  const match = text.match(STREET_REGEX);
  return match?.[0]?.trim() || undefined;
}

export function parseInboundText(text?: string): ParsedInbound {
  if (!text || !text.trim()) {
    return { kind: "UNKNOWN" };
  }

  const normalized = text.trim().toLowerCase();

  if (normalized.includes("callback") || normalized.includes("call me") || normalized.includes("please call")) {
    return { kind: "CALLBACK", notes: text.trim() };
  }

  if (normalized.startsWith("water")) {
    return {
      kind: "REQUEST",
      categoryName: "Water delivery",
      title: "Water delivery request",
      description: text.trim(),
      address: extractAddress(text)
    };
  }

  if (normalized.startsWith("gas")) {
    return {
      kind: "REQUEST",
      categoryName: "Gas refill",
      title: "Gas refill request",
      description: text.trim(),
      address: extractAddress(text)
    };
  }

  if (normalized.startsWith("grocery") || normalized.startsWith("bulk")) {
    return {
      kind: "REQUEST",
      categoryName: "Bulk Grocery",
      title: "Bulk grocery request",
      description: text.trim(),
      address: extractAddress(text)
    };
  }

  if (normalized.startsWith("handyman") || normalized.startsWith("helper")) {
    return {
      kind: "REQUEST",
      categoryName: "Handyman",
      title: "Handyman request",
      description: text.trim(),
      address: extractAddress(text)
    };
  }

  return {
    kind: "REQUEST",
    categoryName: "General",
    title: "General request",
    description: text.trim(),
    address: extractAddress(text)
  };
}
