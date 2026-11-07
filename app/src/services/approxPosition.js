/**
 * Position approximative pour la météo (Sources et accueil) : lue une fois, sans haute précision, acceptée jusqu'à
 * une heure d'âge. Le lieu gardé est ensuite arrondi à ≈ 10 km par enableWeather (services/weatherSync.js).
 */
export function getApproxPosition() {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('unavailable'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      reject,
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 3600 * 1000 },
    )
  })
}
