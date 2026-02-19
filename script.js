const camiResimleri = {
    "İstanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b",
    "Ankara": "https://images.unsplash.com/photo-1581442030095-65481749890a",
    "İzmir": "https://images.unsplash.com/photo-1570133435163-95240f96860d",
    "Edirne": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg",
    "Bursa": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg"
};

document.addEventListener("DOMContentLoaded", async () => {
    await illeriGetir();
    const k = JSON.parse(localStorage.getItem('ramazan_v2026_full'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

async function illeriGetir() {
    try {
        const res = await fetch('https://turkiyeapi.dev/api/v1/provinces');
        const json = await res.json();
        const s = document.getElementById('il-select');
        s.innerHTML = '<option value="">Şehir Seçin</option>';
        json.data.sort((a, b) => a.name.localeCompare(b.name)).forEach(il => {
            s.innerHTML += `<option value="${il.name}">${il.name}</option>`;
        });
    } catch (e) { console.error("İller yüklenemedi"); }
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
    localStorage.setItem('ramazan_v2026_full', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('city-bg').style.backgroundImage = `url('${camiResimleri[il] || "https://images.unsplash.com/photo-1564769625905-50e93615e769"}')`;
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;
    
    try {
        // Hem ŞUBAT hem MART verilerini aynı anda çekiyoruz
        const [resFeb, resMar] = await Promise.all([
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/2?address=${ilce},${il},Turkey&method=13`),
            fetch(`https://api.aladhan.com/v1/calendarByAddress/2026/3?address=${ilce},${il},Turkey&method=13`)
        ]);

        const jsonFeb = await resFeb.json();
        const jsonMar = await resMar.json();
        
        // İki ayı birleştir
        const tumGunler = [...jsonFeb.data, ...jsonMar.data];

        // Sadece Hicri ayı 'Ramadan' olanları filtrele
        const ramazanListesi = tumGunler.filter(g => 
            g.date.hijri.month.en === "Ramaḍān" || g.date.hijri.month.en === "Ramadan"
        );

        imsakiyeDoldur(ramazanListesi);
        sayacBaslat();
    } catch(e) { document.getElementById('label').innerText = "Veri Hatası!"; }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const simdi = new Date();
    const bugunGun = simdi.getDate();
    const bugunAy = simdi.getMonth() + 1;
    b.innerHTML = "";
    
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const m = parseInt(g.date.gregorian.month.number);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];
        
        const r = document.createElement('div');
        r.className = 'row';
        
        // Bugünün vakitlerini belirle (Ay ve Gün kontrolü ile)
        if(d === bugunGun && m === bugunAy) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.bugunVakitleri = { ims, ift };
            r.style.cssText = "background:rgba(255,215,0,0.15); color:#ffd700; font-weight:bold;";
        }
        
        // Ay ismini kısalt (Feb/Mar)
        const ayIsmi = g.date.gregorian.month.en.slice(0,3);
        
        r.innerHTML = `<span>${g.date.hijri.day}</span><span>${d} ${ayIsmi}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(r);
    });

    // Eğer henüz Ramazan başlamadıysa listenin ilk gününü sayaca kur
    if(!window.bugunVakitleri && data.length > 0) {
        window.bugunVakitleri = { 
            ims: data[0].timings.Imsak.split(' ')[0], 
            ift: data[0].timings.Maghrib.split(' ')[0] 
        };
    }
}

function sayacBaslat() {
    if(window.mainTimer) clearInterval(window.mainTimer);
    window.mainTimer = setInterval(() => {
        const simdi = new Date();
        const iftar = new Date();
        const [ih, im] = window.bugunVakitleri.ift.split(':');
        iftar.setHours(ih, im, 0);

        const imsak = new Date();
        const [sh, sm] = window.bugunVakitleri.ims.split(':');
        imsak.setHours(sh, sm, 0);
        
        let hedef, etiket;
        if (simdi < imsak) { hedef = imsak; etiket = "İmsaka Kalan"; }
        else if (simdi < iftar) { hedef = iftar; etiket = "İftara Kalan"; }
        else { imsak.setDate(imsak.getDate() + 1); hedef = imsak; etiket = "Sahura Kalan"; }

        let fark = hedef - simdi;
        const h = Math.floor(fark/3600000).toString().padStart(2,'0');
        const m = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        
        document.getElementById('timer').innerText = `${h}:${m}:${s}`;
        document.getElementById('label').innerText = etiket;
    }, 1000);
        }
