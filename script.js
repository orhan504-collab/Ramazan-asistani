const menuler = [
    "Mercimek Çorbası, Tas Kebabı, Pirinç Pilavı, Güllaç",
    "Ezogelin Çorbası, Karnıyarık, Cacık, Revani",
    "Tarhana Çorbası, İzmir Köfte, Mevsim Salatası, Şekerpare",
    "Yayla Çorbası, Tavuk Sote, Bulgur Pilavı, Sütlaç",
    "Domates Çorbası, Orman Kebabı, Ayran, Kadayıf"
];

document.addEventListener("DOMContentLoaded", () => {
    temaGuncelle();
    const kayitli = localStorage.getItem('secilenSehir');
    if(kayitli) sehirVaktiGetir(kayitli);
    setInterval(temaGuncelle, 60000);
});

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const sehir = document.getElementById('il-liste').value;
    if(!sehir) return alert("Lütfen bir şehir seçin");
    localStorage.setItem('secilenSehir', sehir);
    sehirVaktiGetir(sehir);
    modalKapat();
}

async function sehirVaktiGetir(sehir) {
    document.getElementById('aktif-konum').innerText = "⌛ Yükleniyor: " + sehir;
    const yil = new Date().getFullYear();
    const ay = new Date().getMonth() + 1;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${sehir},Turkey&method=13`);
        const json = await res.json();
        if(json.data) imsakiyeDoldur(json.data, sehir);
    } catch (e) {
        document.getElementById('aktif-konum').innerText = "📍 İnternet Hatası";
    }
}

function imsakiyeDoldur(gunler, sehir) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('aktif-konum').innerText = "📍 " + sehir;

    // Menü Seçimi
    document.getElementById('iftar-menu').innerText = menuler[bugun % menuler.length];

    gunler.forEach(g => {
        const gunNo = parseInt(g.date.gregorian.day);
        const imsak = g.timings.Imsak.split(' ')[0];
        const iftar = g.timings.Maghrib.split(' ')[0];

        if(gunNo === bugun) {
            document.getElementById('t-imsak').innerText = imsak;
            document.getElementById('t-iftar').innerText = iftar;
            window.hedefIftar = iftar;
            window.alarmCalindi = false;
            sayacBaslat();
        }

        const satir = document.createElement('div');
        satir.className = "imsakiye-row";
        if(gunNo === bugun) satir.style.backgroundColor = "rgba(255, 215, 0, 0.2)";
        satir.innerHTML = `<span>${gunNo}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${imsak}</span><span style="color:#ffd700; font-weight:bold;">${iftar}</span>`;
        liste.appendChild(satir);
    });
}

function sayacBaslat() {
    if(window.timer) clearInterval(window.timer);
    window.timer = setInterval(() => {
        const suan = new Date();
        const hedef = new Date();
        const [h, m] = window.hedefIftar.split(':');
        hedef.setHours(h, m, 0);
        
        let fark = hedef - suan;

        // 10 DAKİKA KALA ALARM (600000 ms = 10 dk)
        if(fark > 0 && fark <= 600000 && !window.alarmCalindi) {
            document.getElementById('alarm-sesi').play();
            window.alarmCalindi = true;
            alert("İftara son 10 dakika! Sofralar hazırlansın.");
        }

        if(fark < 0) {
            document.getElementById('sayaç').innerText = "00:00:00";
            document.getElementById('durum-etiketi').innerText = "Hayırlı İftarlar!";
            return;
        }

        const hh = Math.floor(fark/3600000).toString().padStart(2,'0');
        const mm = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        document.getElementById('sayaç').innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
}

function temaGuncelle() {
    const hr = new Date().getHours();
    const b = document.getElementById('main-body');
    if (hr >= 6 && hr < 17) b.className = 'sky-day';
    else if (hr >= 17 && hr < 20) b.className = 'sky-sunset';
    else b.className = 'sky-night';
}
