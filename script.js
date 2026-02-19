const sehirResimleri = {
    "İstanbul": "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200",
    "Ankara": "https://images.unsplash.com/photo-1603073157551-7667d3e401ec",
    "İzmir": "https://images.unsplash.com/photo-1590740292020-043597c5905d",
    "Bursa": "https://images.unsplash.com/photo-1587313634710-f706d871234e",
    "Edirne": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b",
    "Antalya": "https://images.unsplash.com/photo-1542051841857-5f90071e7989",
    "Konya": "https://images.unsplash.com/photo-1590072350712-4299b9087595",
    "Trabzon": "https://images.unsplash.com/photo-1563294116-29cc5596495d",
    "Erzurum": "https://images.unsplash.com/photo-1520440229334-962aee48c9ba",
    "Diyarbakır": "https://images.unsplash.com/photo-1574621100236-d25b64cfd647",
    "default": "https://images.unsplash.com/photo-1564769625905-50e93615e769"
};

document.addEventListener("DOMContentLoaded", async () => {
    await illeriGetir();
    const kayıtlı = JSON.parse(localStorage.getItem('ramazan_pro_2026_final'));
    if(kayıtlı) verileriGetir(kayıtlı.il, kayıtlı.ilce);
    else modalAc();
});

async function otomatikKonumBul() {
    const btn = document.querySelector('.geo-btn');
    btn.innerText = "Aranıyor...";
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=tr`);
            const data = await res.json();
            let il = data.principalSubdivision.replace(" Province", "").replace(" İli", "");
            let ilce = data.city || data.locality;
            localStorage.setItem('ramazan_pro_2026_final', JSON.stringify({il, ilce}));
            location.reload();
        } catch (e) { alert("Konum bulunamadı."); btn.innerText = "📍 KONUMUMU OTOMATİK BUL"; }
    }, () => { alert("İzin verilmedi."); btn.innerText = "📍 KONUMUMU OTOMATİK BUL"; });
}

async function verileriGetir(il, ilce) {
    const bg = document.getElementById('city-bg');
    bg.style.backgroundImage = `url('${sehirResimleri[il] || sehirResimleri.default}')`;
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;

    try {
        const [r2, r3] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/2?address=${ilce},${il},Turkey&method=13`),
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/3?address=${ilce},${il},Turkey&method=13`)
        ]);
        const j2 = await r2.json(), j3 = await r3.json();
        const ramadan = [...j2.data, ...j3.data].filter(g => g.date.hijri.month.en.includes("Ramadan") || g.date.hijri.month.en.includes("ama"));
        imsakiyeDoldur(ramadan);
        sayacBaslat();
    } catch(e) { document.getElementById('label').innerText = "Vakitler Alınamadı!"; }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const now = new Date(); b.innerHTML = "";
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day), m = parseInt(g.date.gregorian.month.number);
        const ims = g.timings.Imsak.split(' ')[0], ift = g.timings.Maghrib.split(' ')[0];
        const isToday = (d === now.getDate() && m === (now.getMonth()+1));

        if(isToday) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.vakitler = { ims, ift };
        }

        const row = document.createElement('div');
        row.className = 'row';
        if(isToday) row.style.cssText = "color:#ffd700; background:rgba(255,215,0,0.05); font-weight:bold;";
        row.innerHTML = `<span>${g.date.hijri.day}</span><span>${d}/${m}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(row);
    });
}

function sayacBaslat() {
    setInterval(() => {
        if(!window.vakitler) return;
        const n = new Date();
        const ift = new Date(); const [ih, im] = window.vakitler.ift.split(':'); ift.setHours(ih, im, 0);
        const ims = new Date(); const [sh, sm] = window.vakitler.ims.split(':'); ims.setHours(sh, sm, 0);
        
        let target, label;
        if(n < ims) { target = ims; label = "İmsaka Kalan"; }
        else if(n < ift) { target = ift; label = "İftara Kalan"; }
        else { ims.setDate(ims.getDate()+1); target = ims; label = "Sahura Kalan"; }

        let diff = target - n;
        const hh = Math.floor(diff/3600000).toString().padStart(2,'0');
        const mm = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${hh}:${mm}:${ss}`;
        document.getElementById('label').innerText = label;
    }, 1000);
}

async function illeriGetir() {
    try {
        const res = await fetch('https://turkiyeapi.dev/api/v1/provinces');
        const json = await res.json();
        const s = document.getElementById('il-select');
        s.innerHTML = '<option value="">İl Seçiniz</option>';
        json.data.sort((a,b) => a.name.localeCompare(b.name)).forEach(il => s.innerHTML += `<option value="${il.name}">${il.name}</option>`);
    } catch(e) {}
}

async function ilceDoldur() {
    const ilAd = document.getElementById('il-select').value;
    const res = await fetch(`https://turkiyeapi.dev/api/v1/provinces?name=${ilAd}`);
    const json = await res.json();
    const s = document.getElementById('ilce-select');
    s.innerHTML = '';
    json.data[0].districts.forEach(d => s.innerHTML += `<option value="${d.name}">${d.name}</option>`);
}

function modalAc() { document.getElementById('modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('modal').style.display = 'none'; }
function kaydet() {
    const il = document.getElementById('il-select').value, ilce = document.getElementById('ilce-select').value;
    if(il && ilce) { localStorage.setItem('ramazan_pro_2026_final', JSON.stringify({il, ilce})); location.reload(); }
}
