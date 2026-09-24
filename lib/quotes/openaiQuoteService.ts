import { structuredQuoteResultJsonSchema } from "./resultSchema";
import { getLockedQuoteInstructions } from "./promptInstructions";
import type {
  QuoteInput,
  QuotePricingContext,
  QuoteType,
  StructuredQuoteResult,
} from "./types";
import { validateStructuredQuoteResult } from "./validation";

type OpenAIConstructor = new (options: { apiKey: string }) => {
  responses: {
    create: (params: Record<string, unknown>) => Promise<any>;
  };
};

async function loadOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Add it to the server environment before generating quotes."
    );
  }

  try {
    const dynamicImport = new Function(
      "specifier",
      "return import(specifier)"
    ) as (specifier: string) => Promise<any>;
    const mod = await dynamicImport("openai");
    const OpenAI = (mod.default || mod.OpenAI) as OpenAIConstructor;
    return new OpenAI({ apiKey });
  } catch (err: any) {
    throw new Error(
      `OpenAI SDK is not available. Run npm install openai before using quote generation. ${String(
        err?.message || err
      )}`
    );
  }
}

function extractOutputText(response: any) {
  if (typeof response?.output_text === "string") {
    return response.output_text;
  }

  const pieces: string[] = [];
  for (const item of response?.output || []) {
    for (const content of item?.content || []) {
      if (typeof content?.text === "string") pieces.push(content.text);
    }
  }

  return pieces.join("").trim();
}

export async function generateQuoteWithOpenAI(args: {
  quoteType: QuoteType;
  input: QuoteInput;
  pricingContext: QuotePricingContext;
}): Promise<StructuredQuoteResult> {
  const client = await loadOpenAIClient();
  const model = process.env.OPENAI_QUOTE_MODEL || "gpt-5";

  const response = await client.responses.create({
    model,
    store: false,
    instructions: getLockedQuoteInstructions(args.quoteType),
    input: JSON.stringify(
      {
        quote_type: args.quoteType,
        validated_employee_input: args.input,
        deterministic_context: args.pricingContext,
      },
      null,
      2
    ),
    text: {
      format: {
        type: "json_schema",
        name: "apex_quote_result",
        strict: true,
        schema: structuredQuoteResultJsonSchema,
      },
    },
    temperature: 0.2,
  });

  const outputText = extractOutputText(response);
  if (!outputText) {
    throw new Error("OpenAI returned an empty quote response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(outputText);
  } catch {
    throw new Error("OpenAI returned malformed JSON.");
  }

  return validateStructuredQuoteResult(parsed, args.quoteType);
}
