import Capacitor
import HalcyaRules
import UIKit
import UserNotifications

/// Rappel de fin d'essai sur iPhone (I6) : même plugin, mêmes méthodes que `TrialReminderPlugin.java` d'Android, vu
/// de `src/services/trialReminder.js`. Une seule notification, programmée d'avance (iOS ne réveille pas l'app) ;
/// la toucher ouvre la gestion des abonnements d'Apple.
@objc(TrialReminderPlugin)
public class TrialReminderPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TrialReminderPlugin"
    public let jsName = "TrialReminder"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "schedule", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestNotifications", returnType: CAPPluginReturnPromise),
    ]

    /// { at, title, body, url } remplace le rappel prévu ; rend { notifications }.
    @objc func schedule(_ call: CAPPluginCall) {
        var input: [String: Any] = [:]
        if let at = call.getDouble("at") { input["at"] = at }
        if let title = call.getString("title") { input["title"] = title }
        if let body = call.getString("body") { input["body"] = body }
        if let url = call.getString("url") { input["url"] = url }
        guard let reminder = TrialReminderRule.reminder(input) else {
            call.reject("rappel invalide")
            return
        }
        TrialReminderNotifications.schedule(reminder) { notifications in
            call.resolve(["notifications": notifications])
        }
    }

    @objc func cancel(_ call: CAPPluginCall) {
        TrialReminderNotifications.cancel()
        call.resolve()
    }

    @objc func requestNotifications(_ call: CAPPluginCall) {
        NotificationAuthorization.request(call)
    }
}

/// La notification du rappel de fin d'essai : une seule à la fois, sans action (le toucher ouvre la page d'Apple).
enum TrialReminderNotifications {
    static let category = "trial-reminder"
    static let urlKey = "url"

    static func schedule(_ reminder: TrialReminderRule.Reminder, _ done: @escaping (Bool) -> Void) {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [TrialReminderRule.identifier])
        if let delay = TrialReminderRule.delay(reminder, nowMs: Date().timeIntervalSince1970 * 1000) {
            let content = UNMutableNotificationContent()
            content.title = reminder.title
            content.body = reminder.body
            content.categoryIdentifier = category
            if let url = reminder.url { content.userInfo = [urlKey: url.absoluteString] }
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: delay, repeats: false)
            center.add(UNNotificationRequest(identifier: TrialReminderRule.identifier, content: content, trigger: trigger))
        }
        center.getNotificationSettings { done(NotificationAuthorization.allowed($0)) }
    }

    static func cancel() {
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [TrialReminderRule.identifier])
        center.removeDeliveredNotifications(withIdentifiers: [TrialReminderRule.identifier])
    }

    /// Toucher sur la notification : la gestion des abonnements d'Apple s'ouvre. Vrai s'il s'agissait de ce rappel.
    static func opened(_ response: UNNotificationResponse) -> Bool {
        let content = response.notification.request.content
        guard content.categoryIdentifier == category else { return false }
        if response.actionIdentifier == UNNotificationDefaultActionIdentifier,
           let url = TrialReminderRule.manageURL(content.userInfo[urlKey] as? String) {
            DispatchQueue.main.async { UIApplication.shared.open(url) }
        }
        return true
    }
}
