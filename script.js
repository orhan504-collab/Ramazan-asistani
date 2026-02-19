document.addEventListener("deviceready", function() {
    // Android izinlerini açılışta zorla iste
    const permissions = cordova.plugins.permissions;
    permissions.requestPermission(permissions.ACCESS_FINE_LOCATION, function(status) {
        if (status.hasPermission) {
            konumAl();
        } else {
            document.getElementById('sehir').innerText = "Konum İzni Reddedildi";
        }
    }, function() {
        console.error("İzin istenirken hata oluştu");
    });
}, false);

function konumAl() {
    const sehirEtiketi = document.getElementById('sehir');
    const hataEtiketi = document.getElementById('hata-mesaji');
    sehirEtiketi.innerText = "Konum aranıyor...";

    navigator.geolocation.getCurrentPosition(vakitleriGetir, function(err) {
        sehirEtiketi.innerText = "Konum Alınamadı";
        hataEtiketi.innerText = "GPS sinyali zayıf veya izin verilmedi.";
        // Eğer GPS çalışmazsa İstanbul'u varsayılan olarak yükle (Boş kalmasın)
        varsayilanYukle(41.0082, 28.9784, "İstanbul (Varsayılan)");
    }, {
        enableHighAccuracy: false, // Daha kolay konum bulması için false yaptık
        timeout: 10000,
        maximumAge: 60000
    });
}

// Şehir seçme butonu için yedek fonksiyon
function manuelSehir() {
    let sehir = prompt("Hangi şehrin vaktini görmek istersiniz?", "İstanbul");
    if (sehir) {
        fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${sehir}&method=13`)
            .then(res => res.json())
            .then(data => vakitleriGoster(data.data.timings, `📍 ${sehir}`));
    }
}

async function vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    varsayilanYukle(lat, lng, "📍 Mevcut Konumunuz");
}

async function varsayilanYukle(lat, lng, baslik) {
    const bugun = new Date();
    const dateStr = `${bugun.getDate()}-${bugun.getMonth() + 1}-${bugun.getFullYear()}`;
    try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=13`);
        const data = await response.json();
        vakitleriGoster(data.data.timings, baslik);
    } catch (e) {
        document.getElementById('sehir').innerText = "Bağlantı Hatası!";
    }
}

function vakitleriGoster(timings, baslik) {
    document.getElementById('imsak-vakit').innerText = timings.Imsak;
    document.getElementById('iftar-vakit').innerText = timings.Maghrib;
    document.getElementById('sehir').innerText = baslik;
    document.getElementById('hata-mesaji').innerText = "";
    geriSayimiBaslat(timings.Maghrib);
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
        document.getElementById('kalan-sure').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
if (!window.cordova) konumAl();
