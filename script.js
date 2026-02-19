const camiResimleri = {
    "İstanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b",
    "Ankara": "https://images.unsplash.com/photo-1581442030095-65481749890a",
    "İzmir": "https://images.unsplash.com/photo-1570133435163-95240f96860d",
    "Bursa": "https://images.unsplash.com/photo-1528660544347-949395277494",
    "Edirne": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg"
};

document.addEventListener("DOMContentLoaded", async () => {
    await illeriGetir(); // Illeri internetten çek
    
    const k = JSON.parse(localStorage.getItem('ramazan_v_final_auto'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

// 1. ADIM: TÜRKİYE'NİN TÜM İLLERİNİ İNTERNETTEN ÇEKER
async function illeriGetir() {
    try {
        const res = await fetch('https://turkiyeapi.dev/api/v1/provinces');
        const json = await res.json();
        const s = document.getElementById('il-select');
        s.innerHTML = '<option value="">İl Seçiniz</option>';
        
        // Illeri isme göre sırala ve select'e ekle
        json.data.sort((a, b) => a.name.localeCompare(b.name)).forEach(il => {
            s.innerHTML += `<option value="${il.name}">${il.name}</option>`;
        });
    } catch (e) {
        console.log("İl listesi çekilemedi, manuel liste yükleniyor.");
    }
}

// 2. ADIM: SEÇİLEN İLE GÖRE İLÇELERİ İNTERNETTEN OTOMATİK ÇEKER
async function ilceDoldur() {
    const ilAd = document.getElementById('il-select').value;
    const ilceSec = document.getElementById('ilce-select');
    ilceSec.innerHTML = '<option>İlçeler Yükleniyor...</option>';

    try {
        const res = await fetch(`https://turkiyeapi.dev/api/v1/provinces?name=${ilAd}`);
        const json = await res.json();
        const ilceListesi = json.data[0].districts;
        
        ilceSec.innerHTML = '';
        ilceListesi.forEach(dist => {
            ilceSec.innerHTML += `<option value="${dist.name}">${dist.name}</option>`;
        });
    } catch (e) {
        ilceSec.innerHTML = `<option value="${ilAd}">Merkez</option>`;
    }
}

function modalAc() { document.getElementById('modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('modal').style.display = 'none'; }

function kaydet() {
    const il = document.getElementById('il-select').value;
    const ilce = document.getElementById('ilce-select').value;
    if(!il || !ilce) return alert("Lütfen İl ve İlçe seçin!");
    
    localStorage.setItem('ramazan_v_final_auto', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    // Görseli güncelle
    const bg = camiResimleri[il] || "https://images.unsplash.com/photo-1564769625905-50e93615e769";
    document.getElementById('city-bg').style.backgroundImage = `url('${bg}')`;
    document.getElementById('location-text').innerText = `${il} / ${ilce} 📍`;
    
    const simdi = new Date();
    const ay = simdi.getMonth() + 1;
    const yil = simdi.getFullYear();

    try {
        // Vakitleri Aladhan API'den çek (Doğru tarih ve ilçe senkronizasyonu)
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        
        imsakiyeDoldur(json.data);
        sayacBaslat();
    } catch(e) { 
        document.getElementById('label').innerText = "Vakitler Alınamadı!"; 
    }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const bugunTarih = new Date().getDate();
    b.innerHTML = "";
    
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];
        
        if(d === bugunTarih) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.vakitler = { ims, ift };
        }
        
        const r = document.createElement('div');
        r.className = 'row';
        if(d === bugunTarih) r.style.cssText = "background:rgba(255,215,0,0.15); color:#ffd700; font-weight:bold;";
        r.innerHTML = `<span>${d}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${ims}</span><span>${ift}</span>`;
        b.appendChild(r);
    });
}

function sayacBaslat() {
    if(window.mainTimer) clearInterval(window.mainTimer);
    window.mainTimer = setInterval(() => {
        const simdi = new Date();
        const iftar = new Date();
        const [ih, im] = window.vakitler.ift.split(':');
        iftar.setHours(ih, im, 0);

        const imsak = new Date();
        const [sh, sm] = window.vakitler.ims.split(':');
        imsak.setHours(sh, sm, 0);
        if(simdi > imsak) imsak.setDate(imsak.getDate() + 1);

        let hedef = simdi < iftar ? iftar : imsak;
        let etiket = simdi < iftar ? "İftara Kalan Süre" : "Sahura Kalan Süre";
        let fark = hedef - simdi;

        if(fark > 0 && fark < 1000) {
            document.getElementById('ezan').play();
            if(simdi < iftar) document.getElementById('tebrik-karti').style.display = 'flex';
        }

        const h = Math.floor(fark/3600000).toString().padStart(2,'0');
        const m = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        
        document.getElementById('timer').innerText = `${h}:${m}:${s}`;
        document.getElementById('label').innerText = etiket;
    }, 1000);
}
