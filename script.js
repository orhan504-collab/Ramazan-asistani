document.addEventListener("deviceready", function() {
    const permissions = cordova.plugins.permissions;
    permissions.requestPermission(permissions.ACCESS_FINE_LOCATION, function(status) {
        if (status.hasPermission) konumAl();
        else document.getElementById('sehir').innerText = "Konum İzni Gerekli";
    });
}, false);

function konumAl() {
    navigator.geolocation.getCurrentPosition(vakitleriGetir, function() {
        // Hata olursa varsayılan İstanbul
        imsakiyeYukle(41.0082, 28.9784, "İstanbul (Varsayılan)");
    }, { timeout: 10000 });
}

async function vakitleriGetir(pos) {
    imsakiyeYukle(pos.coords.latitude, pos.coords.longitude, "📍 Mevcut Konum");
}

async function imsakiyeYukle(lat, lng, baslik) {
    document.getElementById('sehir').innerText = "Yükleniyor...";
    const bugun = new Date();
    const ay = bugun.getMonth() + 1;
    const yil = bugun.getFullYear();

    try {
        // Tüm ayın verisini çeken API (Calendar API)
        const response = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13&month=${ay}&year=${yil}`);
        const data = await response.json();
        
        const gunler = data.data;
        const imsakiyeBody = document.getElementById('imsakiye-body');
        imsakiyeBody.innerHTML = ""; // Temizle

        gunler.forEach((gun, index) => {
            const row = document.createElement('div');
            row.className = 'imsakiye-row';
            
            // Bugünün vakitlerini üste yaz
            if (parseInt(gun.date.gregorian.day) === bugun.getDate()) {
                document.getElementById('imsak-vakit').innerText = gun.timings.Imsak.split(' ')[0];
                document.getElementById('iftar-vakit').innerText = gun.timings.Maghrib.split(' ')[0];
                document.getElementById('sehir').innerText = baslik;
                geriSayimiBaslat(gun.timings.Maghrib.split(' ')[0]);
                row.style.background = "#e9456044"; // Bugünü vurgula
            }

            row.innerHTML = `
                <span>${index + 1}</span>
                <span>${gun.date.gregorian.day} ${gun.date.gregorian.month.en.substring(0,3)}</span>
                <span>${gun.timings.Imsak.split(' ')[0]}</span>
                <span style="color:#ffd700">${gun.timings.Maghrib.split(' ')[0]}</span>
            `;
            imsakiyeBody.appendChild(row);
        });
    } catch (e) {
        document.getElementById('sehir').innerText = "Hata Oluştu!";
    }
}

// Sayaç fonksiyonu (Aynı kalıyor)
let sayac;
function geriSayimiBaslat(iftar) {
    if(sayac) clearInterval(sayac);
    sayac = setInterval(() => {
        const s = new Date();
        const [sa, dk] = iftar.split(':');
        const h = new Date(); h.setHours(sa, dk, 0);
        let f = h - s;
        if(f<0) { document.getElementById('kalan-sure').innerText = "Hayırlı İftarlar!"; return; }
        const hours = Math.floor((f / 3600000) % 24);
        const mins = Math.floor((f / 60000) % 60);
        const secs = Math.floor((f / 1000) % 60);
        document.getElementById('kalan-sure').innerText = `${hours.toString().padStart(2,'0')}:${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`;
    }, 1000);
}

document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
if(!window.cordova) konumAl();
