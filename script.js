const sehirEtiketi = document.getElementById('sehir');
const imsakEtiketi = document.getElementById('imsak-vakit');
const iftarEtiketi = document.getElementById('iftar-vakit');
const sayacEtiketi = document.getElementById('kalan-sure');

function konumAl() {
    sehirEtiketi.innerText = "Konum aranıyor...";
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(vakitleriGetir, hataMesaji, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000
        });
    } else {
        sehirEtiketi.innerText = "Konum desteği yok.";
    }
}

async function vakitleriGetir(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    const bugun = new Date();
    const dateStr = `${bugun.getDate()}-${bugun.getMonth() + 1}-${bugun.getFullYear()}`;

    try {
        const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${lat}&longitude=${lng}&method=13`;
        const response = await fetch(url);
        const data = await response.json();
        
        const vakitler = data.data.timings;
        imsakEtiketi.innerText = vakitler.Imsak;
        iftarEtiketi.innerText = vakitler.Maghrib;
        sehirEtiketi.innerText = "📍 Konumunuz Alındı";
        
        geriSayimiBaslat(vakitler.Maghrib);
    } catch (error) {
        sehirEtiketi.innerText = "Veri alınamadı!";
    }
}

function hataMesaji(err) {
    sehirEtiketi.innerText = "Konum Bulunamadı (GPS Kapalı?)";
    console.error(err);
}

let sayac;
function geriSayimiBaslat(iftarVakti) {
    if(sayac) clearInterval(sayac);
    sayac = setInterval(() => {
        const simdi = new Date();
        const [saat, dk] = iftarVakti.split(':');
        const hedef = new Date();
        hedef.setHours(parseInt(saat), parseInt(dk), 0);

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

document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
konumAl();
