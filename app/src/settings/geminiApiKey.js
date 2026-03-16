const STORAGE_KEY = 'healthtrack_gemini_api_key'

export function getGeminiApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function setGeminiApiKey(key) {
  try {
    if (key == null || key === '') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, String(key).trim())
    }
  } catch (_) {}
}

export function hasGeminiApiKey() {
  return getGeminiApiKey().length > 0
}
