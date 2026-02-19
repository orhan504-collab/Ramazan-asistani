const rehberVerisi = {
    ayetler: ["Allah sabredenlerle beraberdir.", "Oruç tutun sıhhat bulun.", "Şüphesiz her zorlukla beraber bir kolaylık vardır."],
    dualar: ["Allahım bize dünyada ve ahirette iyilik ver.", "Rabbim ilmimi artır.", "Ey Rabbimiz, bizi doğru yola ilet."]
};

document.addEventListener("deviceready", () => {
    themeKontrol();
    konumAl();
}, false);

// Saate göre tema değiştirme
function themeKontrol() {
    const saat = new Date().getHours();
    const body = document.getElementById('body-bg');
    
    if (saat >= 6 && saat < 17) {
        body.className = 'sky-day';
    } else if (saat >= 17 && saat < 20) {
        body.className = 'sky-sunset';
    } else {
        body.className = 'sky-night';
    }
}

function konumAl() {
    navigator.geolocation.getCurrentPosition(pos => {
        imsakiyeYukle(pos.coords.latitude, pos.coords.longitude, "📍 Konumunuz");
    }, () => imsakiyeYukle(41.0082, 28.9784, "İstanbul (Varsayılan)"), { timeout: 10000 });
}

async function imsakiyeYukle(lat, lng, baslik) {
    const bugun = new Date();
    const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13&month=${bugun.getMonth()+1}&year=${bugun.getFullYear()}`);
    const data = await res.json();
    
    const imsakiyeBody = document.getElementById('imsakiye-body');
    imsakiyeBody.innerHTML = "";

    data.data.forEach((gun) => {
        const d = parseInt(gun.date.gregorian.day);
        if (d === bugun.getDate()) {
            document.getElementById('imsak-vakit').innerText = gun.timings.Imsak.split(' ')[0];
            document.getElementById('iftar-vakit').innerText = gun.timings.Maghrib.split(' ')[0];
            document.getElementById('sehir').innerText = baslik;
            geriSayimiBaslat(gun.timings.Maghrib.split(' ')[0]);
        }
        const row = `<div class="imsakiye-row"><span>${d}</span><span>${gun.date.gregorian.month.en.slice(0,3)}</span><span>${gun.timings.Imsak.split(' ')[0]}</span><span>${gun.timings.Maghrib.split(' ')[0]}</span></div>`;
        imsakiyeBody.innerHTML += row;
    });
    
    const idx = bugun.getDate() % rehberVerisi.ayetler.length;
    document.getElementById('gunun-ayeti').innerText = rehberVerisi.ayetler[idx];
    document.getElementById('gunun-duasi').innerText = rehberVerisi.dualar[idx];
}

let sayac;
function geriSayimiBaslat(iftar) {
    if(sayac) clearInterval(sayac);
    sayac = setInterval(() => {
        const f = new Date().setHours(iftar.split(':')[0], iftar.split(':')[1], 0) - new Date();
        if(f<0) { document.getElementById('kalan-sure').innerText = "Hayırlı İftarlar!"; return; }
        const h = Math.floor(f/3600000), m = Math.floor((f%3600000)/60000), s = Math.floor((f%60000)/1000);
        document.getElementById('kalan-sure').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

setInterval(themeKontrol, 60000); // Her dakika temayı kontrol et
themeKontrol(); 
document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
if(!window.cordova) konumAl();
