import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import connectDB from "../config/database";

type GuestFilters = {
  isAttending?: boolean | null;
  dinnerParticipation?: boolean | null;
  brunchParticipation?: boolean | null;
  needsAccommodation?: boolean | null;
  dinnerChoice?: "raclette" | "pierreChaudde" | null;
  dessertChoice?: "sorbet" | "tarteMyrille" | null;
};

const systemPrompt = `You are an assistant for a wedding admin dashboard. You can query a MongoDB guests collection via tools to answer questions about guests, attendance, meals, and accommodations. Always be concise and answer in French. If needed, call tools to fetch exact numbers or lists.`;

const tools = [
  {
    type: "function" as const,
    function: {
      name: "get_guest_stats",
      description: "Return aggregated stats of guests given optional filters.",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              isAttending: { type: ["boolean", "null"] },
              dinnerParticipation: { type: ["boolean", "null"] },
              brunchParticipation: { type: ["boolean", "null"] },
              needsAccommodation: { type: ["boolean", "null"] },
              dinnerChoice: {
                type: ["string", "null"],
                enum: ["raclette", "pierreChaudde", null],
              },
              dessertChoice: {
                type: ["string", "null"],
                enum: ["sorbet", "tarteMyrille", null],
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_guests",
      description:
        "List guests matching filters with an optional limit (default 20).",
      parameters: {
        type: "object",
        properties: {
          filters: {
            type: "object",
            properties: {
              isAttending: { type: ["boolean", "null"] },
              dinnerParticipation: { type: ["boolean", "null"] },
              brunchParticipation: { type: ["boolean", "null"] },
              needsAccommodation: { type: ["boolean", "null"] },
              dinnerChoice: {
                type: ["string", "null"],
                enum: ["raclette", "pierreChaudde", null],
              },
              dessertChoice: {
                type: ["string", "null"],
                enum: ["sorbet", "tarteMyrille", null],
              },
            },
            additionalProperties: false,
          },
          limit: { type: "number", minimum: 1, maximum: 200 },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_guest_by_email",
      description: "Find a guest by exact email.",
      parameters: {
        type: "object",
        properties: {
          email: { type: "string" },
        },
        required: ["email"],
      },
    },
  },
];

const buildMongoQuery = (filters: GuestFilters = {}) => {
  const query: Record<string, unknown> = {};
  if (filters.isAttending !== undefined)
    query.isAttending = filters.isAttending;
  if (filters.dinnerParticipation !== undefined)
    query.dinnerParticipation = filters.dinnerParticipation;
  if (filters.brunchParticipation !== undefined)
    query.brunchParticipation = filters.brunchParticipation;
  if (filters.needsAccommodation !== undefined)
    query.needsAccommodation = filters.needsAccommodation;
  if (filters.dinnerChoice !== undefined)
    query.dinnerChoice = filters.dinnerChoice;
  if (filters.dessertChoice !== undefined)
    query.dessertChoice = filters.dessertChoice;
  return query;
};

const toolImpl = {
  get_guest_stats: async (args: { filters?: GuestFilters }) => {
    const db = await connectDB();
    const guests = db.collection("guests");
    const query = buildMongoQuery(args?.filters ?? {});
    const docs = await guests.find(query).toArray();
    const total = docs.length;
    const attending = docs.filter((g: any) => g.isAttending === true).length;
    const dinner = docs.filter(
      (g: any) => g.dinnerParticipation === true
    ).length;
    const brunch = docs.filter(
      (g: any) => g.brunchParticipation === true
    ).length;
    const needsAcc = docs.filter(
      (g: any) => g.needsAccommodation === true
    ).length;
    const guestCountSum = docs
      .filter((g: any) => g.isAttending === true)
      .reduce((sum: number, g: any) => sum + (g.guestCount || 0), 0);
    const byDinnerChoice = docs.reduce(
      (acc: Record<string, number>, g: any) => {
        const key = g.dinnerChoice ?? "unknown";
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {}
    );
    return {
      total,
      attending,
      dinner,
      brunch,
      needsAcc,
      guestCountSum,
      byDinnerChoice,
    };
  },
  list_guests: async (args: { filters?: GuestFilters; limit?: number }) => {
    const db = await connectDB();
    const guests = db.collection("guests");
    const query = buildMongoQuery(args?.filters ?? {});
    const limit = Math.min(Math.max(args?.limit ?? 20, 1), 200);
    const docs = await guests
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .project({
        lastName: 1,
        firstName: 1,
        email: 1,
        isAttending: 1,
        guestCount: 1,
        dinnerParticipation: 1,
        brunchParticipation: 1,
        dinnerChoice: 1,
        dessertChoice: 1,
        needsAccommodation: 1,
      })
      .toArray();
    return { items: docs };
  },
  get_guest_by_email: async (args: { email: string }) => {
    const db = await connectDB();
    const guests = db.collection("guests");
    const doc = await guests.findOne({ email: args.email });
    return { guest: doc };
  },
};

export const chatWithAI = async (userMessage: string) => {
  if (!process.env.OPENAI_API_KEY) {
    return {
      reply: "Clé OpenAI manquante. Veuillez configurer OPENAI_API_KEY.",
    };
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];

  // First call: see if tools are needed
  const first = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    tools,
    tool_choice: "auto",
    temperature: 0.2,
  });

  const choice = first.choices[0];
  const assistantMsg = choice.message;
  const toolCalls = assistantMsg.tool_calls;

  if (!toolCalls || toolCalls.length === 0) {
    return { reply: assistantMsg.content ?? "" };
  }

  // Include the assistant tool call message in the history
  messages.push({
    role: "assistant",
    content: assistantMsg.content ?? "",
    tool_calls: toolCalls.map((tc) => ({
      id: tc.id,
      type: "function",
      function: { name: tc.function.name, arguments: tc.function.arguments },
    })),
  });

  // Execute tool calls sequentially and append results
  for (const call of toolCalls) {
    const name = call.function.name as keyof typeof toolImpl;
    try {
      const args = call.function.arguments
        ? JSON.parse(call.function.arguments)
        : {};
      const result = await (toolImpl[name] as any)(args);
      messages.push({
        role: "tool",
        content: JSON.stringify(result),
        tool_call_id: call.id,
      } as ChatCompletionMessageParam);
    } catch (err: any) {
      messages.push({
        role: "tool",
        content: JSON.stringify({
          error: true,
          message: err?.message || "Tool error",
        }),
        tool_call_id: call.id,
      } as ChatCompletionMessageParam);
    }
  }

  // Second call: final answer using tool outputs
  const second = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages,
    temperature: 0.2,
  });

  const finalChoice = second.choices[0];
  return { reply: finalChoice.message.content ?? "" };
};
