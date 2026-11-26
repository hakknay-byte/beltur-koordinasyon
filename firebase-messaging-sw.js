/*
 * Arka plan bildirim servisi: uygulama penceresi kapalıyken gelen bildirimleri Windows bildirimi olarak gösterir.
 * Sunucu yalnızca "data" içeren mesaj gönderir (baslik, mesaj, isId, link); bildirimi burada biz oluştururuz.
 */
importScripts('ayarlar.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp(self.KABUK_AYARLARI.firebase);
var mesajlasma = firebase.messaging();

mesajlasma.onBackgroundMessage(function (yuk) {
  var d = (yuk && yuk.data) || {};
  return self.registration.showNotification(d.baslik || 'BELTUR Koordinasyon', {
    body: d.mesaj || '',
    icon: 'simge-v3-192.png',
    badge: 'simge-v3-192.png',
    tag: d.isId || ('b' + Date.now()),
    data: { link: d.link || '', isId: d.isId || '' }
  });
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var veri = e.notification.data || {};
  var hedef = new URL(veri.link || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (pencereler) {
    for (var i = 0; i < pencereler.length; i++) {
      var p = pencereler[i];
      if (p.url.indexOf(self.registration.scope) === 0 && 'focus' in p) {
        p.postMessage({ tip: 'isAc', isId: veri.isId || '' });
        return p.focus();
      }
    }
    return self.clients.openWindow(hedef);
  }));
});
