# Agent Conversation Persistence TODO

## 结论

聊天历史上下文的数据库持久化建议放在 API 层或 API 的 application service 层，不要放在 `packages/agent` 内部。

`packages/agent` 应保持尽量无状态，职责是接收当前输入、历史消息、system prompt、tools、RAG context，然后返回模型结果。API 层负责鉴权、根据 `conversationId` 加载历史消息、调用 Agent、保存用户消息和助手回复。

这样做的原因：

- Agent 包可以被 CLI、测试、worker、API 等不同入口复用。
- 数据库事务、用户权限、conversation 归属校验更适合在 API 层处理。
- 后续如果更换存储、增加多租户、增加消息审计，不需要污染 Agent 核心逻辑。
- Agent 更容易测试，因为它只依赖明确传入的 messages，而不是隐式访问数据库。

## 推荐调用流程

1. API 接收 `conversationId` 和用户 `input`。
2. API 校验用户身份和 conversation 归属。
3. 如果没有 `conversationId`，API 创建新的 conversation。
4. API 从数据库加载该 conversation 的历史 messages。
5. API 将历史 messages 和当前用户 input 传给 `packages/agent`。
6. Agent 返回 assistant output、finishReason、usage、tool calls 等结果。
7. API 在数据库中保存本轮 user message 和 assistant message。
8. API 返回 `conversationId`、assistant output、sources、usage 等数据。

## 数据库设计 TODO

- [ ] 在 `packages/database/src/schema.ts` 新增 `agent_conversations` 表。
- [ ] 在 `packages/database/src/schema.ts` 新增 `agent_messages` 表。
- [ ] 生成 Drizzle migration。
- [ ] 确认 SQLite foreign key 已启用，目前 `packages/database/src/index.ts` 已执行 `PRAGMA foreign_keys = ON`。
- [ ] 为 conversation 查询增加必要索引。
- [ ] 为 message 按 conversation 加载增加必要索引。

## conversations 表建议

表名建议：`agent_conversations`

字段建议：

```ts
export const agent_conversations = sqliteTable("agent_conversations", {
  id: text("id").primaryKey(),
  title: text("title"),
  userId: text("user_id"),
  model: text("model").notNull(),
  mode: text("mode").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
})
```

字段说明：

- `id`：conversationId，API 返回给客户端。
- `title`：会话标题，可以后续由模型自动生成。
- `userId`：当前项目如果还没有用户系统，可以先 nullable；后续鉴权完成后必须写入。
- `model`：本会话默认使用的模型。
- `mode`：例如 `chat`、`rag`。
- `status`：例如 `active`、`archived`。
- `createdAt`：创建时间。
- `updatedAt`：最后消息时间。
- `deletedAt`：软删除时间。

## messages 表建议

表名建议：`agent_messages`

字段建议：

```ts
export const agent_messages = sqliteTable("agent_messages", {
  id: text("id").primaryKey(),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => agent_conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  parts: text("parts"),
  model: text("model"),
  finishReason: text("finish_reason"),
  usage: text("usage"),
  toolCalls: text("tool_calls"),
  sources: text("sources"),
  createdAt: text("created_at").notNull(),
})
```

字段说明：

- `id`：message id。
- `conversationId`：所属 conversation。
- `role`：`system`、`user`、`assistant`、`tool`。
- `content`：简单文本内容，便于列表展示和调试。
- `parts`：可选 JSON 字符串，保存 AI SDK message parts 或多模态内容。
- `model`：assistant 消息实际使用的模型。
- `finishReason`：模型结束原因。
- `usage`：JSON 字符串，保存 token usage。
- `toolCalls`：JSON 字符串，保存工具调用记录。
- `sources`：JSON 字符串，保存 RAG source 快照。
- `createdAt`：消息创建时间。

## 索引 TODO

- [ ] 给 `agent_conversations.userId` 建索引，便于按用户查询会话列表。
- [ ] 给 `agent_conversations.updatedAt` 建索引，便于按最近更新时间排序。
- [ ] 给 `agent_messages.conversationId` 建索引，便于加载历史消息。
- [ ] 给 `agent_messages.createdAt` 建索引，保证消息按创建时间排序。
- [ ] 如果后续有多租户，给 `tenantId` 建索引。

## API 设计 TODO

- [ ] 新增 `apps/api/src/modules/agent/index.ts`。
- [ ] 新增 `apps/api/src/modules/agent/agent.service.ts`。
- [ ] 新增 `apps/api/src/plugins/agent.ts`，负责创建 Agent 实例。
- [ ] 在 `apps/api/src/index.ts` 挂载 agent module。
- [ ] 新增 `POST /agents/conversations` 创建 conversation。
- [ ] 新增 `GET /agents/conversations` 查询 conversation 列表。
- [ ] 新增 `GET /agents/conversations/:conversationId/messages` 加载历史消息。
- [ ] 新增 `POST /agents/conversations/:conversationId/messages` 继续对话。
- [ ] 可选：新增 `POST /agents/conversations/:conversationId/messages/stream` 流式继续对话。
- [ ] 可选：新增 `DELETE /agents/conversations/:conversationId` 软删除 conversation。

## API 入参建议

继续对话接口建议：

```ts
type CreateAgentMessageRequest = {
  input: string
  mode?: "chat" | "rag"
}
```

不建议第一版允许客户端直接传：

- `systemPrompt`
- `tools`
- `maxSteps`
- `model`
- 任意历史 messages

这些参数应该先由服务端控制，避免越权、成本失控和 prompt 注入风险。

## API 返回建议

```ts
type CreateAgentMessageResponse = {
  conversationId: string
  message: {
    id: string
    role: "assistant"
    content: string
    createdAt: string
  }
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
  sources?: unknown[]
  finishReason?: string
}
```

## Application Service TODO

- [ ] 实现 `AgentConversationService.createConversation()`。
- [ ] 实现 `AgentConversationService.listConversations()`。
- [ ] 实现 `AgentConversationService.getMessages(conversationId)`。
- [ ] 实现 `AgentConversationService.sendMessage(conversationId, input)`。
- [ ] `sendMessage` 内部先保存 user message，再调用 Agent，再保存 assistant message。
- [ ] 如果 Agent 调用失败，保留 user message 还是回滚，需要明确策略。
- [ ] 更新 conversation 的 `updatedAt`。
- [ ] 后续支持自动生成 conversation title。

## 事务策略 TODO

- [ ] 创建 conversation 和第一条 user message 应在一个事务中完成。
- [ ] 普通非流式调用可以在 Agent 成功后保存 assistant message。
- [ ] 如果希望失败时不留下 user message，可以把 user message 保存放到 Agent 成功之后，但这会降低审计完整性。
- [ ] 推荐第一版保留 user message，并在 assistant message 中保存失败状态或不创建 assistant message。
- [ ] 流式接口不要在每个 token 上写数据库，应该在流结束后一次性保存 assistant message。

## Agent 包改造 TODO

- [ ] 保持 `packages/agent` 不直接依赖 database。
- [ ] 让 `AgentRunInput.messages` 成为主要上下文输入。
- [ ] 明确 `context` 和 `messages` 是否保留两个字段；建议最终只保留 `messages`。
- [ ] 在 Agent 返回值中补充 `usage`。
- [ ] 在 Agent 返回值中补充 `toolCalls`。
- [ ] RAG 模式返回 `sources`。
- [ ] 支持外部传入 `AbortSignal`，便于 API 层超时控制。

## 历史消息裁剪 TODO

- [ ] 限制每次发送给模型的最大消息条数，例如最近 20 条。
- [ ] 限制每条 message 最大字符数。
- [ ] 限制总上下文最大字符数或 token 数。
- [ ] 后续增加 summary message，用于压缩长会话。
- [ ] RAG context 和聊天历史要分别计算预算，避免互相挤占。

## 权限和安全 TODO

- [ ] 所有 conversation 查询必须校验 `userId` 或调用方身份。
- [ ] 用户只能访问自己的 conversation。
- [ ] 不允许客户端覆盖 system prompt。
- [ ] 不允许客户端直接指定工具。
- [ ] 限制 `input` 最大长度。
- [ ] 限制单个 conversation 的最大消息数。
- [ ] 限制用户每日调用次数或 token 用量。
- [ ] 对 RAG sources 做权限过滤。

## 流式接口 TODO

- [ ] 确定使用纯文本流还是 SSE。
- [ ] 如果使用纯文本流，结束后需要在服务端聚合完整 assistant output 并保存。
- [ ] 如果使用 SSE，定义 `text-delta`、`finish`、`error` 事件。
- [ ] 流式请求断开时，决定是否保存 partial assistant message。
- [ ] 给流式请求增加最大连接时长。

## 测试 TODO

- [ ] 测试创建 conversation。
- [ ] 测试继续对话时能加载历史 messages。
- [ ] 测试用户不能访问其他用户 conversation。
- [ ] 测试 Agent 失败时数据库状态符合预期。
- [ ] 测试消息按 `createdAt` 正确排序。
- [ ] 测试超长 input 被拒绝。
- [ ] 测试删除 conversation 后 messages 被 cascade 删除或软删除逻辑正确。

## 推荐第一版最小落地范围

- [ ] 新增 `agent_conversations` 表。
- [ ] 新增 `agent_messages` 表。
- [ ] 新增非流式 `POST /agents/conversations/:conversationId/messages`。
- [ ] 新增 `GET /agents/conversations/:conversationId/messages`。
- [ ] API 层加载最近 20 条历史消息传给 Agent。
- [ ] API 层保存 user message 和 assistant message。
- [ ] 暂不开放 system prompt、tools、maxSteps、model 给客户端。
- [ ] 暂不做 summary 压缩。
- [ ] 暂不做流式持久化。
