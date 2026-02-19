document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    // Android'den konum izni iste
    var permissions = cordova.plugins.permissions;
    permissions.requestPermission(permissions.ACCESS_FINE_LOCATION, function(status) {
        if (status.hasPermission) {
            konumAl();
        } else {
            document.getElementById('sehir').innerText = "Konum İzni Gerekli";
        }
    }, function() {
        document.getElementById('sehir').innerText = "İzin Hatası";
    });
}

function konumAl() {
    const sehirEtiketi = document.getElementById('sehir');
    sehirEtiketi.innerText = "Konum aranıyor...";

    navigator.geolocation.getCurrentPosition(vakitleriGetir, function(err) {
        sehirEtiketi.innerText = "Konum bulunamadı!";
        document.getElementById('hata-mesaji').innerText = "Lütfen GPS'i açın.";
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
    });
}

async function vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const bugun = new Date();
    const dateStr = `${bugun.getDate()}-${bugun.getMonth() + 1}-${bugun.getFullYear()}`;

    try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=13`);
        const data = await response.json();
        
        const vakitler = data.data.timings;
        document.getElementById('imsak-vakit').innerText = vakitler.Imsak;
        document.getElementById('iftar-vakit').innerText = vakitler.Maghrib;
        document.getElementById('sehir').innerText = "📍 Mevcut Konumunuz";
        
        geriSayimiBaslat(vakitler.Maghrib);
    } catch (error) {
        document.getElementById('sehir').innerText = "Vakitler alınamadı!";
    }
}

let sayacInterval;
function geriSayimiBaslat(iftarVakti) {
    if(sayacInterval) clearInterval(sayacInterval);
    sayacInterval = setInterval(() => {
        const simdi = new Date();
        const [saat, dk] = iftarVakti.split(':');
        const hedef = new Date();
        hedef.setHours(parseInt(saat), parseInt(dk), 0);

        let fark = hedef - simdi;
        if (fark < 0) {
            document.getElementById('kalan-sure').innerText = "Hayırlı İftarlar!";
            return;
        }

        const h = Math.floor((fark / (1000 * 60 * 60)) % 24);
        const m = Math.floor((fark / 1000 / 60) % 60);
        const s = Math.floor((fark / 1000) % 60);
        document.getElementById('kalan-sure').innerText = 
            `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');

// Tarayıcı testi için (Cordova yoksa)
if (!window.cordova) {
    konumAl();
}
