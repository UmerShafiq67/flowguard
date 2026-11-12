# StudySprint

**Your personal exam coach: know what to study, understand it, practice it, and remember it.**

StudySprint is being built as one independent study workspace where a student can add their own subjects, topics, exams, study time, and learning material.

## Core experience

- Unlimited custom subjects and topics
- Exam dates and countdowns
- Adaptive daily study plan
- Focus sessions
- Weak-topic tracking
- Review and progress history
- AI Tutor workspace
- Text questions and image-based questions
- Practice and revision workflows
- Local persistence so a refresh does not erase the student's plan
- Responsive browser experience

## Important honesty

The browser UI can run without an AI account, but real AI responses require a server-side provider configuration. API secrets must never be placed in browser JavaScript.

The tutor server expects:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

These are environment variables only.

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

A feature is not considered complete merely because a button exists. The feature must have a real working path and be tested.

## Security

- Never commit API keys, tokens, passwords, cookies, or database credentials.
- Keep AI/provider credentials server-side.
- Do not expose secrets through browser JavaScript.
