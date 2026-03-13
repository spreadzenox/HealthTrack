# Benchmark: Remote providers (image → ingredients + quantities)

This document compares **remote** options for the workflow: **image of plate/meal → list of ingredients with estimated quantities**, for use in a **phone app** (model runs on server or in the cloud).

---

## 1. Providers compared

| Provider | Model | Where it runs | Latency (typical) | Cost (approx.) |
|----------|--------|----------------|-------------------|----------------|
| **OpenAI** | GPT-4o (vision) | OpenAI cloud | ~1–3 s | ~$0.01–0.03 per image (input + output) |
| **Google Gemini** | Gemini 1.5 Flash / Pro | Google cloud | ~1–4 s | Free tier generous; paid per token |
| **Local** | BLIP-2 / InstructBLIP | Your server (GPU) | ~2–10 s | Server cost only |

- **OpenAI** and **Gemini** are **multimodal APIs**: you send the image + prompt, they return text. No GPU to manage; best for a phone app with a remote backend.
- **Local** runs your own VLM (e.g. on a single GPU server). No per-call API cost, but you pay for the machine and maintenance.

---

## 2. How to run the benchmark

1. **Backend and keys**
   - From project root: `cd backend`
   - Install: `pip install -r requirements.txt`
   - Set API keys (at least one):
     - `OPENAI_API_KEY=sk-...`
     - `GEMINI_API_KEY=...` or `GOOGLE_API_KEY=...`

2. **Run on one image**
   ```bash
   cd backend
   python benchmark_providers.py path/to/plate.jpg
   python benchmark_providers.py path/to/plate.jpg --providers openai gemini
   ```

3. **Optional: JSON output**
   ```bash
   python benchmark_providers.py path/to/plate.jpg --json
   ```

The script measures **latency** (time to first token / full response) and prints the **parsed list** (ingredient + quantity) for each provider so you can compare quality on the same image.

---

## 3. Criteria for “best” for your use case

- **Quality**: Correct ingredients and plausible quantities (small/medium portion, “~X g”, etc.).
- **Latency**: Fast enough for a mobile user (e.g. &lt; 5 s end-to-end).
- **Cost**: Sustainable for your usage (e.g. per user per day).
- **Reliability**: Uptime, rate limits, no need to maintain GPU for cloud options.

**Recommendation for a phone app with remote backend:**  
Use **OpenAI (GPT-4o)** or **Gemini (1.5 Flash)** as primary. Both are multimodal, easy to integrate, and avoid running your own GPU. Run the benchmark script on a few representative plate images and compare latency + quality; then choose one (or both with a fallback).

---

## 4. API usage (for the mobile app)

The backend exposes a single endpoint used by the app:

- **POST /api/predict**  
  - Body: multipart form with `file` = image file.  
  - Query (optional): `?provider=openai` or `?provider=gemini` or `?provider=local`.  
  - Response: `{ "provider": "openai", "items": [ { "ingredient": "...", "quantity": "..." }, ... ] }`.

The mobile app uploads the photo to this endpoint and displays the `items` list.

---

## 5. References

- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
- Internal: `backend/benchmark_providers.py`, `backend/providers/`.
