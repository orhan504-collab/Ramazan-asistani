const camiResimleri = {"İstanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b","Ankara": "https://images.unsplash.com/photo-1581442030095-65481749890a","İzmir": "https://images.unsplash.com/photo-1570133435163-95240f96860d","Bursa": "https://images.unsplash.com/photo-1528660544347-949395277494","Edirne": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg"};

document.addEventListener("DOMContentLoaded", async () => {
    rainEffect();
    await illeriGetir();
    const k = JSON.parse(localStorage.getItem('ramazan_2026_final'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

// RAIN EFEKTİ MOTORU
function rainEffect() {
    const container = document.getElementById('rain-container');
    const text = "YAPIM: ORHAN BAŞBAKICI";
    container.innerHTML = "";
    text.split("").forEach((char, i) => {
        const span = document.createElement('span');
        span.innerText = char === " " ? "\u00A0" : char;
        span.className = "rain-char";
        span.style.left = `calc(50% - ${(text.length/2)*12}px + ${i*12}px)`;
        container.appendChild(span);
        setTimeout(() => {
            span.style.top = "15px";
            setTimeout(() => span.classList.add("fixed-char"), 1500);
        }, Math.random() * 2000);
    });
}

async function illeriGetir() {
    try {
        const res = await fetch('https://turkiyeapi.dev/api/v1/provinces');
        const json = await res.json();
        const s = document.getElementById('il-select');
        s.innerHTML = '<option value="">İl Seçiniz</option>';
        json.data.sort((a, b) => a.name.localeCompare(b.name)).forEach(il => {
            s.innerHTML += `<option value="${il.name}">${il.name}</option>`;
        });
    } catch (e) { console.log("Hata: İller"); }
}

async function ilceDoldur() {
    const ilAd = document.getElementById('il-select').value;
    const ilceSec = document.getElementById('ilce-select');
    ilceSec.innerHTML = '<option>Yükleniyor...</option>';
    try {
        const res = await fetch(`https://turkiyeapi.dev/api/v1/provinces?name=${ilAd}`);
        const json = await res.json();
        ilceSec.innerHTML = '';
        json.data[0].districts.forEach(d => {
            ilceSec.innerHTML += `<option value="${d.name}">${d.name}</option>`;
        });
    } catch (e) { ilceSec.innerHTML = `<option value="${ilAd}">Merkez</option>`; }
}

function modalAc() { document.getElementById('modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('modal').style.display = 'none'; }

function kaydet() {
    const il = document.getElementById('il-select').value;
    const ilce = document.getElementById('ilce-select').value;
    if(!il || !ilce) return alert("Seçim yapın!");
    localStorage.setItem('ramazan_2026_final', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('city-bg').style.backgroundImage = `url('${camiResimleri[il] || "https://images.unsplash.com/photo-1564769625905-50e93615e769"}')`;
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;
    try {
        const [r2, r3] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/2?address=${ilce},${il},Turkey&method=13`),
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/3?address=${ilce},${il},Turkey&method=13`)
        ]);
        const j2 = await r2.json(); const j3 = await r3.json();
        const ramadan = [...j2.data, ...j3.data].filter(g => g.date.hijri.month.en.includes("Ramadan") || g.date.hijri.month.en.includes("ama"));
        imsakiyeDoldur(ramadan);
        sayacBaslat();
    } catch(e) { document.getElementById('label').innerText = "Vakit Hatası!"; }
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
        if(d === now.getDate() && m === (now.getMonth()+1)) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.vakitler = { ims, ift };
        }
        const row = document.createElement('div');
        row.className = 'row';
        if(d === now.getDate() && m === (now.getMonth()+1)) row.style.color = "#ffd700";
        row.innerHTML = `<span>${g.date.hijri.day}</span><span>${d} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(row);
    });
    if(!window.vakitler) window.vakitler = { ims: data[0].timings.Imsak.split(' ')[0], ift: data[0].timings.Maghrib.split(' ')[0] };
}

function sayacBaslat() {
    if(window.T) clearInterval(window.T);
    window.T = setInterval(() => {
        const n = new Date();
        const ift = new Date(); const [ih, im] = window.vakitler.ift.split(':'); ift.setHours(ih, im, 0);
        const ims = new Date(); const [sh, sm] = window.vakitler.ims.split(':'); ims.setHours(sh, sm, 0);
        let h, e;
        if(n < ims) { h = ims; e = "İmsaka Kalan"; }
        else if(n < ift) { h = ift; e = "İftara Kalan"; }
        else { ims.setDate(ims.getDate()+1); h = ims; e = "Sahura Kalan"; }
        let f = h - n;
        const hh = Math.floor(f/3600000).toString().padStart(2,'0');
        const mm = Math.floor((f%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((f%60000)/1000).toString().padStart(2,'0');
        document.getElementById('timer').innerText = `${hh}:${mm}:${ss}`;
        document.getElementById('label').innerText = e;
    }, 1000);
}
