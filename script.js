// İl-İlçe Verisi (Türkiye)
async function ilYukle() {
    const ilSelect = document.getElementById('il-select');
    try {
        const res = await fetch('https://openapi.izmir.bel.tr/api/ibb/cografi/iller'); // Örnek açık kaynak il listesi
        // Not: Gerçek uygulamada sabit bir JSON listesi kullanmak daha hızlıdır.
        const iller = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya"]; // Örnek liste
        iller.forEach(il => ilSelect.innerHTML += `<option value="${il}">${il}</option>`);
    } catch(e) {}
}

document.addEventListener("deviceready", () => {
    // İzinleri Zorla İste
    const permissions = cordova.plugins.permissions;
    permissions.requestPermissions([
        permissions.ACCESS_FINE_LOCATION,
        permissions.POST_NOTIFICATIONS
    ], () => {
        themeGuncelle();
        konumAl();
        ilYukle();
    });
}, false);

function themeGuncelle() {
    const saat = new Date().getHours();
    const bg = document.querySelector('.sky-overlay');
    if(saat >= 6 && saat < 17) bg.style.background = "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)";
    else if(saat >= 17 && saat < 20) bg.style.background = "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)";
    else bg.style.background = "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)";
}

function konumAl() {
    navigator.geolocation.getCurrentPosition(pos => {
        vakitleriCek(pos.coords.latitude, pos.coords.longitude, "📍 Mevcut Konum");
    }, () => vakitleriCek(41.0082, 28.9784, "İstanbul (Varsayılan)"));
}

async function vakitleriCek(lat, lng, baslik) {
    const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13`);
    const data = await res.json();
    const bugunIdx = new Date().getDate() - 1;
    const v = data.data[bugunIdx].timings;

    document.getElementById('imsak-v').innerText = v.Imsak.split(' ')[0];
    document.getElementById('iftar-v').innerText = v.Maghrib.split(' ')[0];
    document.getElementById('sehir-ilce').innerText = baslik;

    sayaçBaslat(v.Maghrib.split(' ')[0]);
    alarmKur(v.Maghrib.split(' ')[0]);
}

function alarmKur(iftarVakti) {
    const [saat, dk] = iftarVakti.split(':');
    const simdi = new Date();
    const hedef = new Date();
    hedef.setHours(saat, dk - 10, 0); // 10 dakika önce

    if (hedef > simdi) {
        cordova.plugins.notification.local.schedule({
            title: "İftara Az Kaldı!",
            text: "İftar vaktine son 10 dakika. Sofralar hazırlansın!",
            trigger: { at: hedef },
            foreground: true
        });
    }
}

function sayaçBaslat(iftar) {
    setInterval(() => {
        const fark = new Date().setHours(iftar.split(':')[0], iftar.split(':')[1], 0) - new Date();
        if(fark < 0) { document.getElementById('kalan-sure').innerText = "00:00:00"; return; }
        const h = Math.floor(fark/3600000), m = Math.floor((fark%3600000)/60000), s = Math.floor((fark%60000)/1000);
        document.getElementById('kalan-sure').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

function toggleLocationPicker() {
    const m = document.getElementById('location-picker');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}
