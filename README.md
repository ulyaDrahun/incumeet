# Incumeet

**AI-powered meeting intelligence — turn raw transcripts into clear summaries, decisions, and action items in seconds.**

Incumeet is a web app that helps professionals get more out of every meeting. Instead of re-reading long transcripts or re-watching recordings, upload your meeting transcript and Incumeet's AI will generate a structured summary, surface key decisions, and pull out action items per person — even inferring sensible next steps when participants don't explicitly assign them.

## ✨ Features

- **Transcript-based AI summaries** — Upload a meeting transcript and get a concise summary, decisions, and per-person action items powered by modern LLMs.
- **Folder-first organization** — Group meetings into folders (e.g. by client, project, or team). Folders can be searched, sorted, and shared.
- **Calendar view** — See all your meetings on a 24h timeline with overlap handling. Add meetings directly from the calendar, including creating new folders inline.
- **Pinned & priority items** — Mark important meetings with a red pin (top of list) or yellow star (priority).
- **Action item tracking** — Tick off action items as they're completed. Progress is saved per meeting and persists across sessions.
- **Editable summaries & notes** — Refine the AI output, add your own meeting notes, and edit the transcript when needed.
- **Email-ready summaries** — Generate a clean, formatted HTML summary you can copy and share with attendees.
- **Authentication & private workspaces** — Each user has their own secure workspace; meetings and folders are private by default.
- **Light & dark mode** — Minimalist Notion/SharePoint-inspired UI that looks great in both themes.

## 🧭 How to use it

1. **Sign up / sign in** on the landing page.
2. **Create a folder** for the project, client, or team you're meeting about.
3. **Upload a transcript** ("New Meeting" → paste or upload your transcript and pick a folder).
4. **Generate the AI summary** — Incumeet produces a summary, list of decisions, and action items grouped by person.
5. **Refine** — edit the summary, add manual notes, tick off completed action items, and pin or star important meetings.
6. **Share** — copy the formatted summary to email it to attendees, or share folders with collaborators.
7. **Browse** — use the dashboard, folder views, or calendar to find past meetings quickly.

## 🛠️ Tech stack

- **Frontend:** React + TypeScript + Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Lovable Cloud (managed Supabase) — Postgres with Row Level Security, Auth, and Edge Functions
- **AI:** Lovable AI Gateway (Google Gemini / OpenAI GPT models) for summarization and action-item extraction
- **Build / deploy:** Lovable

## 🚀 Local development

```sh
# 1. Clone
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# 2. Install
npm install

# 3. Run the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## 📦 Deployment

This project is built and hosted on [Lovable](https://lovable.dev). To publish a new version, open the project in Lovable and click **Publish**. Frontend changes go live after publishing; backend changes (database migrations, edge functions) deploy automatically.

---

Built with care to make meetings less of a chore.
