# StudySprint

**Your personal exam coach: know what to study, understand it, practice it, and remember it.**

StudySprint is being built as one independent study workspace where a student can add their own subjects, topics, exams, study time, and learning material.

## Core experience

- Unlimited custom subjects and topics with add/remove/rename/reorder controls
- Exam dates and countdowns
- Adaptive daily study plan
- Focus sessions
- Weak-topic tracking
- Review and progress history
- AI Tutor workspace
- Text questions and image-based questions
- Tutor modes for explanation, quizzes, practice and revision
- Image and PDF attachments are accepted by the tutor endpoint; the default local Ollama setup currently handles text and image requests, while local PDF extraction is intentionally disabled until a document-extraction layer is added
- Local persistence so a refresh does not erase the student's plan
- Responsive browser experience

## Important honesty

The browser UI can run without an AI account. By default, real AI responses use a local Ollama server, so no paid API account or API key is required.

Default local AI configuration:
- `AI_PROVIDER=ollama`
- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_MODEL=gemma3:1b`

Start Ollama separately with `ollama serve`, then start StudySprint with `npm start`.

OpenAI remains an optional provider. If `AI_PROVIDER=openai`, configure:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

These are environment variables only and must never be placed in browser JavaScript.

## Development

Run the deterministic study-core tests:

```bash
npm test
```

Run the web app/server:

```npm start```

Then open the forwarded port from your development environment.

## Product principle

StudySprint should not be another generic chatbot, flashcard clone, or calendar. Its job is to connect the whole learning loop:

**exam → plan → learn → practice → mistakes → review → updated plan**

A feature is not considered complete merely because a button exists. The feature must have a real working path, validation, persistence, and a tested path.

## Security

- Never commit API keys, tokens, passwords, cookies, or database credentials.
- Keep AI/provider credentials server-side.
- Do not expose secrets through browser JavaScript.
