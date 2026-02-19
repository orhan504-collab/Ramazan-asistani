document.addEventListener("DOMContentLoaded", async () => {
    initMatrix();
    await illeriGetir();
    const k = JSON.parse(localStorage.getItem('ramazan_2026_pro_v3'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

// MATRIX AKIŞ MOTORU
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = 80;

    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ☪🌙⭐";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ffd700";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(draw, 50);
}

// OTOMATİK KONUM
async function otomatikKonumBul() {
    if (!navigator.geolocation) return alert("Konum desteklenmiyor.");
    const btn = document.querySelector('.geo-btn');
    btn.innerText = "Konum Alınıyor...";
    navigator.geolocation.getCurrentPosition(async (pos) => {
        try {
            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=tr`);
            const data = await res.json();
            let il = data.principalSubdivision.replace(" Province", "").replace(" İli", "");
            let ilce = data.city || data.locality;
            localStorage.setItem('ramazan_2026_pro_v3', JSON.stringify({il, ilce}));
            location.reload(); // Verileri tazelemek için
        } catch (e) { alert("Konum bulunamadı."); btn.innerText = "📍 KONUMUMU OTOMATİK BUL"; }
    }, () => { alert("İzin reddedildi."); btn.innerText = "📍 KONUMUMU OTOMATİK BUL"; });
}

// VERİ ÇEKME (ŞUBAT + MART BİRLEŞİK)
async function verileriGetir(il, ilce) {
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;
    try {
        const [r2, r3] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/2?address=${ilce},${il},Turkey&method=13`),
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/3?address=${ilce},${il},Turkey&method=13`)
        ]);
        const j2 = await r2.json(); const j3 = await r3.json();
        // Ramazan ayına ait tüm günleri filtrele ve birleştir
        const ramadan = [...j2.data, ...j3.data].filter(g => 
            g.date.hijri.month.en.includes("Ramadan") || 
            g.date.hijri.month.en.includes("ama")
        );
        imsakiyeDoldur(ramadan);
        sayacBaslat();
    } catch(e) { document.getElementById('label').innerText = "Veri Hatası!"; }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const now = new Date();
    b.innerHTML = "";
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const m = parseInt(g.date.gregorian.month.number);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];

        // Bugün kontrolü
        const isToday = (d === now.getDate() && m === (now.getMonth() + 1));
        if(isToday) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.vakitler = { ims, ift };
        }

        const row = document.createElement('div');
        row.className = 'row';
        if(isToday) row.style.cssText = "color:#ffd700; font-weight:bold; background:rgba(255,215,0,0.05);";
        row.innerHTML = `<span>${g.date.hijri.day}</span><span>${d}/${m}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(row);
    });
}

function sayacBaslat() {
    if(window.T) clearInterval(window.T);
    window.T = setInterval(() => {
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

// SEÇİM FONKSİYONLARI
async function illeriGetir() {
    const res = await fetch('https://turkiyeapi.dev/api/v1/provinces');
    const json = await res.json();
    const s = document.getElementById('il-select');
    s.innerHTML = '<option value="">İl Seçiniz</option>';
    json.data.sort((a, b) => a.name.localeCompare(b.name)).forEach(il => s.innerHTML += `<option value="${il.name}">${il.name}</option>`);
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
    if(il && ilce) { localStorage.setItem('ramazan_2026_pro_v3', JSON.stringify({il, ilce})); location.reload(); }
    }
