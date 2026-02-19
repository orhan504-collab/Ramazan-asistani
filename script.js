const sehirEtiketi = document.getElementById('sehir');
const imsakEtiketi = document.getElementById('imsak-vakit');
const iftarEtiketi = document.getElementById('iftar-vakit');
const sayacEtiketi = document.getElementById('kalan-sure');

// 1. Konum Bilgisini Al
function konumAl() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(vakitleriGetir, hataMesaji);
    } else {
        sehirEtiketi.innerText = "Konum desteklenmiyor.";
    }
}

// 2. API'den Vakitleri Çek
async funtion vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const date = new Date().getDate() + "-" + (new Date().getMonth() + 1) + "-" + new Date().getFullYear();

    sehirEtiketi.innerText = "Vakitler Hesaplanıyor...";

    try {
        const response = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lng}&method=13`);
        const data = await response.json();
        
        const vakitler = data.data.timings;
        imsakEtiketi.innerText = vakitler.Imsak;
        iftarEtiketi.innerText = vakitler.Maghrib;
        sehirEtiketi.innerText = "📍 Mevcut Konumunuz";
        
        geriSayimiBaslat(vakitler.Maghrib);
    } catch (error) {
        sehirEtiketi.innerText = "Hata oluştu!";
    }
}

function hataMesaji() {
    sehirEtiketi.innerText = "Konum izni verilmedi.";
}

// 3. Geri Sayım Motoru
function geriSayimiBaslat(iftarVakti) {
    setInterval(() => {
        const simdi = new Date();
        const [saat, dk] = iftarVakti.split(':');
        const hedef = new Date();
        hedef.setHours(saat, dk, 0);

        let fark = hedef - simdi;

        if (fark < 0) {
            sayacEtiketi.innerText = "Hayırlı İftarlar!";
            return;
        }

        const h = Math.floor((fark / (1000 * 60 * 60)) % 24);
        const m = Math.floor((fark / 1000 / 60) % 60);
        const s = Math.floor((fark / 1000) % 60);

        sayacEtiketi.innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

// Sayfa açıldığında konumu al
konumAl();
