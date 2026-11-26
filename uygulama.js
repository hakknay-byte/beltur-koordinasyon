/*
 * BELTUR Koordinasyon — uygulama kabuğu.
 * Portalı (Apps Script) bir pencere içinde açar, bilgisayara "uygulama" olarak yüklenebilmesini ve
 * Firebase Cloud Messaging ile Windows bildirimi alınmasını sağlar.
 * Portal ile haberleşme yalnızca *.googleusercontent.com (Apps Script) kökeninden gelen mesajlarladır.
 */
(function (g) {
  'use strict';

  var durum = yeniDurum();

  function yeniDurum() {
    return { portalKaynak: null, portalKoken: null, token: null, bekleyenIs: null, kurulumOlayi: null, kayit: null, mesajlasma: null,
      tokenIstegi: null, izinBekleniyor: false };
  }

  function ayar() { return g.KABUK_AYARLARI || {}; }

  function bag() {
    return g.KABUK_BAGIMLILIKLARI || {
      sw: g.navigator.serviceWorker,
      Bildirim: g.Notification,
      firebase: g.firebase,
      konum: g.location,
      izinler: g.navigator.permissions
    };
  }

  function ayarTamamMi(A) {
    var f = A.firebase || {};
    var hepsi = [A.portalAdresi, A.vapidAnahtari, f.apiKey, f.projectId, f.messagingSenderId, f.appId].join('|');
    return !!(A.portalAdresi && A.vapidAnahtari && f.apiKey) && hepsi.indexOf('BURAYA') === -1;
  }

  function portalKokenUygunMu(koken) {
    try {
      var u = new URL(koken);
      return u.protocol === 'https:' && /\.googleusercontent\.com$/.test(u.hostname);
    } catch (e) {
      return false;
    }
  }

  function portalaGonder(m) {
    if (!durum.portalKaynak) return;
    var ileti = { kaynak: 'beltur-kabuk' };
    for (var k in m) ileti[k] = m[k];
    try { durum.portalKaynak.postMessage(ileti, durum.portalKoken); } catch (e) {}
  }

  function serit(html) {
    var s = document.getElementById('kabukSerit');
    if (!s) return;
    if (!html) { s.className = 'hidden'; s.innerHTML = ''; return; }
    s.className = '';
    s.innerHTML = html;
  }

  function seritGuncelle() {
    var B = bag();
    var parcalar = [];
    if (!B.Bildirim || !B.sw) {
      serit('<span>Bu tarayıcı masaüstü bildirimlerini desteklemiyor. Lütfen Chrome veya Edge kullanın.</span>');
      return;
    }
    if (durum.izinBekleniyor && B.Bildirim.permission === 'default') {
      parcalar.push('<span>İzin bekleniyor: açılan pencerede "İzin ver" deyin. Pencere görünmüyorsa pencerenin sağ üstündeki zil simgesine tıklayıp "İzin ver" seçin.</span>');
    } else if (B.Bildirim.permission === 'default') {
      parcalar.push('<span>Görev bildirimlerini almak için izin verin.</span><button id="izinVerBtn" type="button">Bildirimlere İzin Ver</button>');
    } else if (B.Bildirim.permission === 'denied') {
      parcalar.push('<span>Bildirimler engellenmiş. Pencerenin sağ üstündeki zil (veya adres çubuğundaki kilit) simgesinden "Bildirimler: İzin ver" seçin.</span>');
    }
    if (durum.kurulumOlayi) parcalar.push('<button id="yukleBtn" type="button" class="ikincil">Uygulamayı Yükle</button>');
    serit(parcalar.join(''));
    var izin = document.getElementById('izinVerBtn');
    if (izin) izin.onclick = izinIste;
    var yukle = document.getElementById('yukleBtn');
    if (yukle) yukle.onclick = function () {
      var olay = durum.kurulumOlayi;
      durum.kurulumOlayi = null;
      if (olay) olay.prompt();
      seritGuncelle();
    };
  }

  function izinIste() {
    var B = bag();
    durum.izinBekleniyor = true;
    seritGuncelle();
    return Promise.resolve(B.Bildirim.requestPermission()).then(function (p) {
      durum.izinBekleniyor = false;
      seritGuncelle();
      if (p === 'granted') return tokenAl();
    }, function () {
      durum.izinBekleniyor = false;
      seritGuncelle();
    });
  }

  /* İzin, şerit düğmesi dışında (başlık çubuğundaki zil, site ayarları) verilirse de yakalanır. */
  function izinDegisiminiIzle() {
    var B = bag();
    if (!B.izinler || !B.izinler.query) return;
    B.izinler.query({ name: 'notifications' }).then(function (d) {
      d.onchange = function () {
        durum.izinBekleniyor = false;
        seritGuncelle();
        if (B.Bildirim.permission === 'granted' && !durum.token) {
          tokenAl().catch(function (err) { console.error('Bildirim kaydı başarısız:', err); });
        }
      };
    }).catch(function () {});
  }

  function onMesaj(yuk) {
    var d = (yuk && yuk.data) || {};
    if (!durum.kayit) return;
    durum.kayit.showNotification(d.baslik || 'BELTUR Koordinasyon', {
      body: d.mesaj || '',
      icon: 'simge-v3-192.png',
      badge: 'simge-v3-192.png',
      tag: d.isId || ('b' + Date.now()),
      data: { link: d.link || '', isId: d.isId || '' }
    });
  }

  function tokenAl() {
    if (!durum.tokenIstegi) {
      durum.tokenIstegi = tokenIste().then(function (x) { durum.tokenIstegi = null; return x; },
        function (err) { durum.tokenIstegi = null; throw err; });
    }
    return durum.tokenIstegi;
  }

  function tokenIste() {
    var A = ayar();
    var B = bag();
    return Promise.resolve(durum.kayit || B.sw.register('firebase-messaging-sw.js')).then(function (kayit) {
      durum.kayit = kayit;
      if (!durum.mesajlasma) {
        if (!g.__kabukFirebaseBaslatildi || g.KABUK_BAGIMLILIKLARI) {
          B.firebase.initializeApp(A.firebase);
          g.__kabukFirebaseBaslatildi = true;
        }
        durum.mesajlasma = B.firebase.messaging();
        durum.mesajlasma.onMessage(onMesaj);
      }
      return durum.mesajlasma.getToken({ vapidKey: A.vapidAnahtari, serviceWorkerRegistration: kayit });
    }).then(function (token) {
      durum.token = token || null;
      if (durum.token) portalaGonder({ tip: 'fcmToken', token: durum.token });
    });
  }

  function mesajIsle(e) {
    if (!e || !portalKokenUygunMu(e.origin)) return;
    var d = e.data || {};
    if (d.kaynak !== 'beltur-portal') return;
    if (d.tip === 'hazir') {
      durum.portalKaynak = e.source;
      durum.portalKoken = e.origin;
      if (durum.token) portalaGonder({ tip: 'fcmToken', token: durum.token });
      if (durum.bekleyenIs) {
        portalaGonder({ tip: 'isAc', isId: durum.bekleyenIs });
        durum.bekleyenIs = null;
      }
    }
  }

  function swMesaji(e) {
    var d = e && e.data;
    if (d && d.tip === 'isAc' && d.isId) portalaGonder({ tip: 'isAc', isId: d.isId });
  }

  function baslat() {
    var A = ayar();
    var B = bag();
    var oncekiKurulum = durum.kurulumOlayi;
    durum = yeniDurum();
    durum.kurulumOlayi = oncekiKurulum;
    try { durum.bekleyenIs = new URLSearchParams((B.konum && B.konum.search) || '').get('is'); } catch (e) {}
    if (!ayarTamamMi(A)) {
      serit('<span>Kurulum tamamlanmamış: ayarlar.js dosyasındaki Firebase ve portal bilgilerini doldurun.</span>');
      return Promise.resolve();
    }
    var cerceve = document.getElementById('portal');
    if (cerceve && cerceve.getAttribute('src') !== A.portalAdresi) cerceve.setAttribute('src', A.portalAdresi);
    if (B.sw && B.sw.addEventListener) B.sw.addEventListener('message', swMesaji);
    seritGuncelle();
    izinDegisiminiIzle();
    if (B.Bildirim && B.Bildirim.permission === 'granted') {
      return tokenAl().catch(function (err) { console.error('Bildirim kaydı başarısız:', err); });
    }
    return Promise.resolve();
  }

  g.addEventListener('message', mesajIsle);
  g.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    durum.kurulumOlayi = e;
    seritGuncelle();
  });
  g.addEventListener('appinstalled', function () {
    durum.kurulumOlayi = null;
    seritGuncelle();
  });

  g.KABUK = { baslat: baslat, mesajIsle: mesajIsle, tokenAl: tokenAl, portalKokenUygunMu: portalKokenUygunMu };
  if (!g.KABUK_TEST) baslat();
})(window);
