// Örnek Veri Yapısı (Gerçek API tüm ilçeleri getirir, burada başlatıyoruz)
const sehirVerisi = {
    "İstanbul": ["Beşiktaş", "Üsküdar", "Kadıköy", "Fatih", "Pendik", "Esenyurt"],
    "Ankara": ["Çankaya", "Keçiören", "Etimesgut", "Mamak"],
    "İzmir": ["Konak", "Karşıyaka", "Bornova", "Buca"],
    "Bursa": ["Nilüfer", "Osmangazi", "Yıldırım"],
    "Antalya": ["Muratpaşa", "Kepez", "Konyaaltı"]
};

const menuler = ["Ezogelin Çorbası, Karnıyarık, Pirinç Pilavı, Revani", "Mercimek Çorbası, Tavuk Sote, Bulgur Pilavı, Sütlaç", "Yayla Çorbası, İzmir Köfte, Mevsim Salatası, Güllaç"];

document.addEventListener("DOMContentLoaded", () => {
    temaGuncelle();
    ilDoldur();
    const kayitli = JSON.parse(localStorage.getItem('secilenKonum'));
    if(kayitli) verileriGetir(kayitli.il, kayitli.ilce);
    setInterval(temaGuncelle, 60000);
});

function ilDoldur() {
    const s = document.getElementById('il-liste');
    Object.keys(sehirVerisi).forEach(il => {
        s.innerHTML += `<option value="${il}">${il}</option>`;
    });
}

function ilceDoldur() {
    const il = document.getElementById('il-liste').value;
    const s = document.getElementById('ilce-liste');
    s.innerHTML = '<option value="">İlçe Seçiniz</option>';
    if(sehirVerisi[il]) {
        sehirVerisi[il].forEach(ilce => {
            s.innerHTML += `<option value="${ilce}">${ilce}</option>`;
        });
    }
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value;
    if(!il || !ilce) return alert("Lütfen il ve ilçe seçin");
    localStorage.setItem('secilenKonum', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('aktif-konum').innerText = `⌛ ${il} / ${ilce}`;
    const yil = new Date().getFullYear();
    const ay = new Date().getMonth() + 1;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        if(json.data) imsakiyeDoldur(json.data, il, ilce);
    } catch (e) {
        document.getElementById('aktif-konum').innerText = "📍 İnternet Gerekli!";
    }
}

function imsakiyeDoldur(gunler, il, ilce) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('aktif-konum').innerText = `📍 ${il} - ${ilce}`;
    document.getElementById('iftar-menu').innerText = menuler[bugun % menuler.length];

    gunler.forEach(g => {
        const gunNo = parseInt(g.date.gregorian.day);
        const imsak = g.timings.Imsak.split(' ')[0];
        const iftar = g.timings.Maghrib.split(' ')[0];

        if(gunNo === bugun) {
            document.getElementById('t-imsak').innerText = imsak;
            document.getElementById('t-iftar').innerText = iftar;
            window.hedefIftar = iftar;
            sayacBaslat();
        }

        const satir = document.createElement('div');
        satir.className = "imsakiye-row";
        if(gunNo === bugun) satir.style.background = "rgba(255, 215, 0, 0.2)";
        satir.innerHTML = `<span style="flex:1">${gunNo}</span><span style="flex:2">${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span style="flex:1">${imsak}</span><span style="flex:1; color:#ffd700; font-weight:bold;">${iftar}</span>`;
        satir.style.display = "flex";
        satir.style.padding = "10px 0";
        satir.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
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

        if(fark > 599000 && fark < 601000) { // 10 Dakika Alarm
            document.getElementById('alarm-sesi').play();
            alert("İftara son 10 dakika!");
        }

        if(fark < 0) { document.getElementById('sayaç').innerText = "00:00:00"; return; }

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
