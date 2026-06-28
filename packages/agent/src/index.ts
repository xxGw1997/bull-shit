import { createOpenAI } from "@ai-sdk/openai";
import { generateText, isStepCount, streamText, type ToolSet } from "ai";
import {
  getRuntimeEnv,
  readRequiredEnv,
  type AgentResponse,
  type RuntimeEnv,
} from "@cyper-me/shared";
import { buildMessages, getSystemPrompt } from "./agent/messages";
import type {
  AgentRunInput,
  AgentService,
  AgentServiceOptions,
} from "./agent/types";
import { getWeather } from "./tools/get-weather";

const DEFAULT_MAX_STEPS = 10;
const defaultTools = { getWeather } satisfies ToolSet;

export function createAgentService(options: AgentServiceOptions): AgentService {
  const provider = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl,
  });
  const languageModel = provider(options.model);
  const tools = options.tools ?? defaultTools;
  const maxSteps = options.maxSteps ?? DEFAULT_MAX_STEPS;

  async function runText(input: AgentRunInput): Promise<AgentResponse> {
    const messages = buildMessages(input);
    const result = await generateText({
      model: languageModel,
      system: getSystemPrompt(input),
      messages,
      tools,
      stopWhen: isStepCount(maxSteps),
    });

    return {
      output: result.text,
      context: [...messages, ...result.responseMessages],
      finishReason: result.finishReason,
    };
  }

  return {
    run: runText,
    runText,
    streamText(input) {
      const result = streamText({
        model: languageModel,
        system: getSystemPrompt(input),
        messages: buildMessages(input),
        tools,
      });

      return result.toTextStreamResponse();
    },
  };
}

export function createAgentServiceFromEnv(
  env: RuntimeEnv = getRuntimeEnv(),
): AgentService {
  return createAgentService({
    apiKey: readRequiredEnv(env, "API_KEY"),
    baseUrl: readRequiredEnv(env, "BASE_URL"),
    model: readRequiredEnv(env, "MODEL"),
  });
}

export type {
  AgentRunInput,
  AgentService,
  AgentServiceOptions,
} from "./agent/types";


/**
// TEST
async function main() {
  const BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const API_KEY = "";
  const MODEL = "qwen3.6-flash";
  
  const agent = createAgentService({
    apiKey: API_KEY!,
    baseUrl: BASE_URL!,
    model: MODEL!,
  });
  
  const res = await agent.run({
    input: "what the weather in nanchang?",
  });
  console.log("🟢:", res.output);
}

main();
*/