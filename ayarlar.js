/*
 * Uygulama kabuğu ayarları — KURULUM-UYGULAMA.md dosyasındaki adımlara göre "BURAYA" yazan yerleri doldurun.
 * Bu değerler gizli değildir (Firebase web yapılandırması herkese açık olacak şekilde tasarlanmıştır).
 * Gizli olan servis hesabı anahtarı buraya DEĞİL, Apps Script'in Komut dosyası özelliklerine yazılır.
 */
self.KABUK_AYARLARI = {
  // Apps Script → Dağıt → Web uygulaması adresi (…/exec ile biter)
  portalAdresi: 'https://script.google.com/macros/s/AKfycbx67MG3bNiF8a5VizQiqf9IHcUOLDUxeOWIWso7HLI2HIzAy0AgZ45-wk73UXcnwSUp/exec',

  // Firebase → Proje ayarları → Cloud Messaging → Web Push sertifikaları → Anahtar çifti
  vapidAnahtari: 'BPkQ1U01VPiBni-GOieHIYBeCLBSgrF5ncVRpHpL5kLnVtQ7PhaEjemKFDgAnOxIjVRCcaoZI_di82-7tkg4DpA',

  // Firebase → Proje ayarları → Genel → Uygulamalarınız → (web uygulaması) → firebaseConfig
  firebase: {
    apiKey: 'AIzaSyBBIOerQgsv-_01iGJ5pE6LPWt19_Wsva4',
    authDomain: 'beltur-koordinasyon.firebaseapp.com',
    projectId: 'beltur-koordinasyon',
    storageBucket: 'beltur-koordinasyon.firebasestorage.app',
    messagingSenderId: '86231681217',
    appId: '1:86231681217:web:0db328a117a6d2630b2c40'
  }
};
