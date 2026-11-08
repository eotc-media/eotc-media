// EOTC Media service worker: makes the site installable as an app and shows
// reading plan reminders. It deliberately caches nothing, so every page is
// always the live site.

self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || "EOTC Media", {
      body: data.body || "",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin))
      if (open) return open.focus().then((w) => w.navigate(url))
      return self.clients.openWindow(url)
    }),
  )
})
