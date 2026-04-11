# Benchmark: Remote providers (image → ingredients + quantities)

This document compares **remote** options for the workflow: **image of plate/meal → list of ingredients with estimated quantities**, for use in a **phone app** (model runs in the cloud).

The **HealthTrack app** calls the **Gemini API directly from the device** (user API key in Settings). The steps below are for **your own experiments** if you want to compare OpenAI vs Gemini latency and quality outside the repo (e.g. small scripts using each vendor’s HTTP API).

---

## 1. Providers compared

| Provider | Model | Where it runs | Latency (typical) | Cost (approx.) |
|----------|--------|----------------|-------------------|----------------|
| **OpenAI** | GPT-4o (vision) | OpenAI cloud | ~1–3 s | ~$0.01–0.03 per image (input + output) |
| **Google Gemini** | Gemini 1.5 Flash / Pro | Google cloud | ~1–4 s | Free tier generous; paid per token |
| **Local** | BLIP-2 / InstructBLIP | Your machine or server (GPU) | ~2–10 s | Hardware cost only |

- **OpenAI** and **Gemini** are **multimodal APIs**: you send the image + prompt, they return text. No GPU to manage on the client.
- **Local** runs your own VLM (see [BENCHMARK.md](BENCHMARK.md) and `run_predict.py`). No per-call API cost, but you pay for the machine and maintenance.

---

## 2. How to benchmark (your own script)

1. **API keys** (at least one provider you want to test):
   - `OPENAI_API_KEY=sk-...`
   - `GEMINI_API_KEY=...` or `GOOGLE_API_KEY=...`

2. **Call each API** with the same image and a prompt that asks for structured JSON (ingredient names + quantities).

3. **Compare** latency (time to full response) and the parsed list quality on representative plate photos.

---

## 3. Criteria for “best” for your use case

- **Quality**: Correct ingredients and plausible quantities (small/medium portion, “~X g”, etc.).
- **Latency**: Fast enough for a mobile user (e.g. &lt; 5 s end-to-end).
- **Cost**: Sustainable for your usage (e.g. per user per day).
- **Reliability**: Uptime, rate limits, no need to maintain GPU for cloud options.

**Recommendation for a phone app using cloud vision:**  
**OpenAI (GPT-4o)** or **Gemini** are typical choices. HealthTrack ships with **Gemini from the client** so users do not depend on your servers.

---

## 4. How the HealthTrack app works

- The app uses **`app/src/services/geminiStandalone.js`**: image + prompt → Gemini `generateContent` → parsed ingredients list.
- Meals are stored in **IndexedDB** (`app/src/storage/localHealthStorage.js`).
- Nutrition KPIs use bundled data in **`app/src/data/ingredientsNutrition.json`** (`app/src/services/nutritionKPIs.js`).

---

## 5. References

- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding)
