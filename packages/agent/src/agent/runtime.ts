import { generateText, isStepCount, streamText } from 'ai'
import { getSystemPrompt, prepareMessages } from './messages'
import type { AgentRunInput, AgentRunResult, AgentRuntimeOptions } from './types'

export function runAgent(input: AgentRunInput, options: AgentRuntimeOptions): Promise<AgentRunResult> {
  return generateText({
    model: options.model,
    system: getSystemPrompt(input),
    messages: prepareMessages(input, options.limits),
    tools: input.tools ?? options.tools,
    stopWhen: isStepCount(options.limits.maxSteps),
    abortSignal: input.abortSignal,
  })
}

export function streamAgent(input: AgentRunInput, options: AgentRuntimeOptions) {
  return streamText({
    model: options.model,
    system: getSystemPrompt(input),
    messages: prepareMessages(input, options.limits),
    tools: input.tools ?? options.tools,
    stopWhen: isStepCount(options.limits.maxSteps),
    abortSignal: input.abortSignal,
  })
}
