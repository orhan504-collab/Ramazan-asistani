const sehirEtiketi = document.getElementById('sehir');
const imsakEtiketi = document.getElementById('imsak-vakit');
const iftarEtiketi = document.getElementById('iftar-vakit');
const sayacEtiketi = document.getElementById('kalan-sure');

// 1. Konum Bilgisini Al (Yüksek Doğruluk Ayarıyla)
function konumAl() {
    sehirEtiketi.innerText = "Konum aranıyor...";
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(vakitleriGetir, hataMesaji, options);
    } else {
        sehirEtiketi.innerText = "Tarayıcı konumu desteklemiyor.";
    }
}

// 2. API'den Vakitleri Çek
async function vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    // Bugünün tarihini GG-AA-YYYY formatında hazırla
    const bugun = new Date();
    const dateStr = `${bugun.getDate()}-${bugun.getMonth() + 1}-${bugun.getFullYear()}`;

    try {
        // Aladhan API - 13. Metod (Diyanet İşleri Başkanlığına en yakın sonuçları verir)
        const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=13`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.code === 200) {
            const vakitler = data.data.timings;
            imsakEtiketi.innerText = vakitler.Imsak;
            iftarEtiketi.innerText = vakitler.Maghrib;
            sehirEtiketi.innerText = "📍 Konumunuz Tespit Edildi";
            
            geriSayimiBaslat(vakitler.Maghrib);
        } else {
            sehirEtiketi.innerText = "Vakit bilgisi alınamadı.";
        }
    } catch (error) {
        console.error(error);
        sehirEtiketi.innerText = "İnternet bağlantısı hatası!";
    }
}

// Hata Durumları
function hataMesaji(err) {
    console.warn(`HATA(${err.code}): ${err.message}`);
    if(err.code === 1) {
        sehirEtiketi.innerText = "Lütfen konum izni verin!";
    } else if(err.code === 3) {
        sehirEtiketi.innerText = "Konum zaman aşımına uğradı.";
    } else {
        sehirEtiketi.innerText = "Konum alınamadı.";
    }
}

// 3. Geri Sayım Motoru
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
            sayacEtiketi.innerText = "Hayırlı İftarlar!";
            clearInterval(sayacInterval);
            return;
        }

        const h = Math.floor((fark / (1000 * 60 * 60)) % 24);
        const m = Math.floor((fark / 1000 / 60) % 60);
        const s = Math.floor((fark / 1000) % 60);

        sayacEtiketi.innerText = 
            `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

// Sayfa ilk açıldığında çalıştır
konumAl();
                                
