const MODEL = "@cf/google/gemma-4-26b-a4b-it";
const CORS = "*";

function headers(extra = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": CORS,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    ...extra
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: headers() });
}

function clean(value, max = 5000) {
  return String(value ?? "").trim().slice(0, max);
}

function contextText(context) {
  const subjects = Array.isArray(context?.subjects)
    ? context.subjects.slice(0, 20).map(s => ({
        name: clean(s?.name, 120),
        topics: Array.isArray(s?.topics)
          ? s.topics.slice(0, 30).map(t => ({
              name: clean(t?.name, 160),
              confidence: Number(t?.confidence) || 0
            }))
          : []
      }))
    : [];
  const exams = Array.isArray(context?.exams)
    ? context.exams.slice(0, 20).map(e => ({
        name: clean(e?.name, 160),
        date: clean(e?.date, 30),
        subjectId: clean(e?.subjectId, 80)
      }))
    : [];
  const task = context?.currentTask
    ? {
        subject: clean(context.currentTask.subject, 120),
        topic: clean(context.currentTask.topic, 160),
        examDate: clean(context.currentTask.examDate, 30),
        minutes: Number(context.currentTask.minutes) || 0
      }
    : null;
  return JSON.stringify({ subjects, exams, currentTask: task });
}

function systemPrompt(mode) {
  return [
    "You are StudySprint Tutor, an exam-study coach.",
    "Teach, don't just dump an answer.",
    "For normal explanations, stay under 120 words unless the student explicitly asks for detail.",
    "Use 3-6 short bullets or short paragraphs. Never write a giant paragraph.",
    "Start with the direct answer or main idea.",
    "If a topic is naturally visual (for example photosynthesis, cells, circuits, geometry, graphs, cycles), include exactly one line in this format when helpful: VISUAL: photosynthesis",
    "Only use one of these visual names when appropriate: photosynthesis, water-cycle, cell, circuit, triangle.",
    "The VISUAL line is a UI instruction, not part of the explanation. Do not explain the marker.",
    "Use simple examples or formulas when useful.",
    "For problem-solving, explain the reasoning and encourage the student to try.",
    "Use StudySprint context only when relevant.",
    "Never invent facts or claim to have seen an attachment that was not supplied.",
    "End with at most one short check question when it helps learning.",
    "Current mode: " + clean(mode, 40) + "."
  ].join(" ");
}

function makeMessages(body) {
  const mode = clean(body.mode || "Explain simply", 40) || "Explain simply";
  let message = clean(body.message, 5000);

  const attachment = body.attachment && typeof body.attachment === "object" ? body.attachment : null;
  if (attachment) {
    const type = clean(attachment.type, 120).toLowerCase();
    const name = clean(attachment.name, 180);
    const data = String(attachment.data || "");
    const isImage = type.startsWith("image/");
    const isPdf = type === "application/pdf" || /\\.pdf$/i.test(name);
    if (!data || (!isImage && !isPdf)) {
      return { error: "StudySprint supports image and PDF attachments only." };
    }
    if (data.length > 10_500_000) {
      return { error: "That file is too large. Please use an image or PDF under 8 MB." };
    }
  }

  message = message || "Please help me study.";
  message += "\n\nStudySprint context:\n" + contextText(body.context || {});

  const messages = [{ role: "system", content: systemPrompt(mode) }];
  for (const item of (Array.isArray(body.history) ? body.history : []).slice(-8)) {
    const text = clean(item?.text, 2500);
    if (text) messages.push({
      role: item?.role === "assistant" ? "assistant" : "user",
      content: text
    });
  }
  if (attachment) {
    const type = clean(attachment.type, 120).toLowerCase();
    const name = clean(attachment.name, 180) || "study-material";
    const data = String(attachment.data || "");
    const content = [{ type: "text", text: message }];
    if (type.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: data } });
    } else {
      content.push({
        type: "file",
        file: { filename: name, file_data: data }
      });
    }
    messages.push({ role: "user", content });
  } else {
    messages.push({ role: "user", content: message });
  }
  return { messages };
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: headers() });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "StudySprint",
        aiProvider: "cloudflare-workers-ai",
        aiConfigured: Boolean(env.AI)
      });
    }

    if (request.method === "POST" && url.pathname === "/api/tutor") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON request." }, 400);
      }

      if (!body || typeof body !== "object") {
        return json({ error: "Invalid request." }, 400);
      }

      if (!clean(body.message, 5000) && !body.attachment) {
        return json({ error: "Add a question or study material." }, 400);
      }

      if (!env.AI) {
        return json({ error: "StudySprint AI is not connected yet." }, 503);
      }

      const built = makeMessages(body);
      if (built.error) return json({ error: built.error }, 415);

      try {
        const result = await env.AI.run(MODEL, {
          messages: built.messages,
          max_tokens: 500,
          temperature: 0.2,
          chat_template_kwargs: { enable_thinking: false }
        });

        const text = clean(
          result?.response ||
          result?.choices?.[0]?.message?.content ||
          result?.result?.response,
          8000
        );

        if (!text) return json({ error: "The AI returned an empty answer. Try again." }, 502);

        return json({
          text,
          provider: "cloudflare-workers-ai",
          model: MODEL
        });
      } catch (error) {
        return json({
          error: clean(error?.message || "Cloudflare AI could not answer right now.", 600)
        }, 502);
      }
    }

    return json({ error: "Not found." }, 404);
  }
};
