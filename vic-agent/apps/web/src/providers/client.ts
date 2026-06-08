import { Client } from "@langchain/langgraph-sdk";
import { assertAllowedApiUrl } from "@/lib/url-allowlist";

export function createClient(apiUrl: string, apiKey: string | undefined) {
  // Never construct a client (which would send the API key) for an untrusted host.
  assertAllowedApiUrl(apiUrl);
  return new Client({
    apiKey,
    apiUrl,
  });
}
