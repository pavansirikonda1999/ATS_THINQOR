Environment variables
=====================

Preferred: create a file named `.env` in this folder with the following keys. The app loads `.env` if `python-dotenv` is installed, otherwise it falls back to `config.env`.

Required Keys:

- DB_HOST (default: localhost)
- DB_USER (default: root)
- DB_PASSWORD
- DB_NAME (default: ats_system)
- GEMINI_API_KEY (required for AI chat - get free key from https://aistudio.google.com/app/apikey)

Optional Keys:

- LLM_MODEL (default: gemini-2.5-flash)
  - Available Gemini models:
    - `gemini-2.5-flash` (recommended, fast, free tier)
    - `gemini-1.5-pro` (more capable, better for complex tasks)
    - `gemini-pro` (legacy model)

Security notes:

- Do not commit `.env` or any real secrets.
- `config.env` is provided for local development convenience. Prefer using `.env` and ensure your VCS ignores it.
- The AI chat feature requires GEMINI_API_KEY to function. Without it, a mock response will be returned.
- Google Gemini API offers generous free tier limits - perfect for development and small-scale production use.


