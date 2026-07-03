import { createOpenAI } from "@ai-sdk/openai";
import {
  getRuntimeEnv,
  readRequiredEnv,
  type RuntimeEnv,
} from "@cyper-me/shared";
import type {
  AgentRunInput,
  AgentService,
  AgentServiceOptions,
} from "./agent/types";
import { runAgent, streamAgent } from "./agent/runtime";
import { createAgentLimits } from "./harness/limits";
import { createDefaultToolRegistry } from "./tools/registry";

export function createAgentService(options: AgentServiceOptions): AgentService {
  const provider = createOpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseUrl,
  });
  const languageModel = provider(options.model);
  const tools = options.tools ?? createDefaultToolRegistry();
  const limits = createAgentLimits({
    maxSteps: options.maxSteps,
    maxMessages: options.maxMessages,
    maxMessageChars: options.maxMessageChars,
    maxTotalChars: options.maxTotalChars,
  });

  async function runText(input: AgentRunInput) {
    return runAgent(input, {
      model: languageModel,
      tools,
      limits,
    });
  }

  return {
    run: runText,
    runText,
    stream(input) {
      return streamAgent(input, {
        model: languageModel,
        tools,
        limits,
      });
    },
    streamText(input) {
      return this.stream(input);
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
  AgentEvent,
  AgentLimits,
  AgentRunInput,
  AgentRunResult,
  AgentService,
  AgentServiceOptions,
  AgentStreamResult,
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
  console.log("🟢:", res.text);
}

main();
*/
