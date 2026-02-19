const camiResimleri = {
    "İstanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b",
    "Ankara": "https://images.unsplash.com/photo-1581442030095-65481749890a",
    "İzmir": "https://images.unsplash.com/photo-1570133435163-95240f96860d",
    "Edirne": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg",
    "Bursa": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg"
};

document.addEventListener("DOMContentLoaded", async () => {
    await illeriGetir();
    const k = JSON.parse(localStorage.getItem('ramazan_v2026_auto'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

// 81 İLİ İNTERNETTEN ÇEKER
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

// İLÇELERİ İNTERNETTEN ÇEKER
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
    localStorage.setItem('ramazan_v2026_auto', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

// ANA VERİ ÇEKME FONKSİYONU
async function verileriGetir(il, ilce) {
    document.getElementById('city-bg').style.backgroundImage = `url('${camiResimleri[il] || "https://images.unsplash.com/photo-1564769625905-50e93615e769"}')`;
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;
    
    const simdi = new Date();
    const yil = simdi.getFullYear();
    const ay = simdi.getMonth() + 1;

    try {
        // Aladhan API'den Hicri takvim destekli verileri çekiyoruz
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        
        // Sadece Hicri ayı 'Ramadan' olan günleri filtrele
        const ramazanGunleri = json.data.filter(g => g.date.hijri.month.en === "Ramaḍān" || g.date.hijri.month.en === "Ramadan");
        
        // Eğer bu ayda Ramazan yoksa (henüz gelmediyse) tüm ayı göster ama sayacı ilk güne kur
        const gosterilecekVeri = ramazanGunleri.length > 0 ? ramazanGunleri : json.data;

        imsakiyeDoldur(gosterilecekVeri);
        sayacBaslat(gosterilecekVeri);
    } catch(e) { document.getElementById('label').innerText = "Vakitler Alınamadı!"; }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const simdi = new Date();
    const bugunGun = simdi.getDate();
    b.innerHTML = "";
    
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];
        
        const r = document.createElement('div');
        r.className = 'row';
        
        // Bugün Ramazan'ın içinde miyiz kontrolü
        if(d === bugunGun) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.bugunVakitleri = { ims, ift };
            r.style.cssText = "background:rgba(255,215,0,0.15); color:#ffd700; font-weight:bold;";
        }
        
        // Listeyi doldur (Güne Hicri gün numarasını da ekledik)
        r.innerHTML = `<span>${g.date.hijri.day}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(r);
    });
    
    // Eğer bugün listede yoksa (Ramazan başlamadıysa) ilk satırı baz al
    if(!window.bugunVakitleri) {
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

        if (simdi < imsak) {
            hedef = imsak;
            etiket = "İmsaka Kalan Süre";
        } else if (simdi < iftar) {
            hedef = iftar;
            etiket = "İftara Kalan Süre";
        } else {
            imsak.setDate(imsak.getDate() + 1);
            hedef = imsak;
            etiket = "Sahura Kalan Süre";
        }

        let fark = hedef - simdi;
        
        // Ezan ve Tebrik Kartı Mantığı
        if(fark > 0 && fark < 1000) {
            document.getElementById('ezan').play();
            if(etiket === "İftara Kalan Süre") document.getElementById('tebrik-karti').style.display = 'flex';
        }

        const h = Math.floor(fark/3600000).toString().padStart(2,'0');
        const m = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        
        document.getElementById('timer').innerText = `${h}:${m}:${s}`;
        document.getElementById('label').innerText = etiket;
    }, 1000);
}
