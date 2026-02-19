// Cihaz hazır olduğunda çalışacak ana fonksiyon
document.addEventListener("deviceready", function() {
    console.log("Cihaz hazır...");
    const permissions = cordova.plugins.permissions;
    const list = [
        permissions.ACCESS_FINE_LOCATION,
        permissions.ACCESS_COARSE_LOCATION
    ];

    // İzinleri kontrol et ve iste
    permissions.requestPermissions(list, function(status) {
        if (status.hasPermission) {
            konumAl(); // İzin varsa direkt konum al
        } else {
            alert("Uygulamanın çalışması için konum izni şarttır.");
        }
    }, function() {
        alert("İzin istenirken hata oluştu.");
    });
}, false);

function konumAl() {
    const sehirEtiketi = document.getElementById('sehir');
    const hataEtiketi = document.getElementById('hata-mesaji');
    sehirEtiketi.innerText = "Konum aranıyor...";

    // Daha agresif konum alma ayarları
    navigator.geolocation.getCurrentPosition(vakitleriGetir, function(err) {
        sehirEtiketi.innerText = "Konum alınamadı!";
        hataEtiketi.innerText = "Hata Kodu: " + err.code + " - Lütfen GPS'i ve İnterneti kontrol edin.";
    }, {
        enableHighAccuracy: true, // GPS'i zorla açtırır
        timeout: 20000,           // 20 saniye bekle
        maximumAge: 0             // Eski konumu kullanma
    });
}

async function vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const bugun = new Date();
    const dateStr = `${bugun.getDate()}-${bugun.getMonth() + 1}-${bugun.getFullYear()}`;

    try {
        // API çağrısını yap
        const response = await fetch(`https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=13`);
        const data = await response.json();
        
        const vakitler = data.data.timings;
        document.getElementById('imsak-vakit').innerText = vakitler.Imsak;
        document.getElementById('iftar-vakit').innerText = vakitler.Maghrib;
        document.getElementById('sehir').innerText = "📍 Vakitler Güncellendi";
        document.getElementById('hata-mesaji').innerText = ""; // Hatayı temizle
        
        geriSayimiBaslat(vakitler.Maghrib);
    } catch (error) {
        document.getElementById('sehir').innerText = "Vakitler çekilemedi!";
    }
}

// Geri sayım motoru (Aynı kalabilir)
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

// Sayfa başlığı için tarih
document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
