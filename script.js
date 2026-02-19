const sehirRehberi = {
    "İstanbul": { cami: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b", ilceler: ["Fatih", "Beşiktaş", "Üsküdar", "Kadıköy", "Pendik", "Esenyurt"] },
    "Ankara": { cami: "https://images.unsplash.com/photo-1581442030095-65481749890a", ilceler: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak"] },
    "İzmir": { cami: "https://images.unsplash.com/photo-1570133435163-95240f96860d", ilceler: ["Konak", "Karşıyaka", "Bornova", "Buca"] },
    "Edirne": { cami: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg", ilceler: ["Merkez", "Enez", "Keşan"] },
    "Bursa": { cami: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg", ilceler: ["Osmangazi", "Nilüfer", "Yıldırım"] }
};

const menuler = ["Mercimek Çorbası, Tavuk Sote, Bulgur Pilavı, Sütlaç", "Ezogelin Çorbası, Karnıyarık, Pilav, Güllaç", "Yayla Çorbası, Köfte, Salat, Kadayıf"];

document.addEventListener("DOMContentLoaded", () => {
    const ilSec = document.getElementById('il-liste');
    ilSec.innerHTML = '<option value="">Şehir Seçin</option>';
    Object.keys(sehirRehberi).forEach(il => ilSec.innerHTML += `<option value="${il}">${il}</option>`);

    const k = JSON.parse(localStorage.getItem('ramazan_pos_v2'));
    if(k) verileriGetir(k.il, k.ilce);
});

function ilceGuncelle() {
    const il = document.getElementById('il-liste').value;
    const ilceSec = document.getElementById('ilce-liste');
    ilceSec.innerHTML = '';
    if(sehirRehberi[il]) sehirRehberi[il].ilceler.forEach(i => ilceSec.innerHTML += `<option value="${i}">${i}</option>`);
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value;
    if(!il) return;
    localStorage.setItem('ramazan_pos_v2', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('city-bg').style.backgroundImage = `url('${sehirRehberi[il].cami}')`;
    document.getElementById('aktif-konum').innerText = `${il} / ${ilce} 📍`;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        const bugun = new Date();
        const ayVerisi = json.data[bugun.getMonth()].days || json.data; // API yapısı kontrolü
        
        imsakiyeDoldur(json.data, bugun.getDate());
        hesaplaVeBaslat(json.data);
    } catch(e) { document.getElementById('aktif-konum').innerText = "Hata: İnternet Yok"; }
}

function imsakiyeDoldur(data, bugun) {
    const liste = document.getElementById('liste-icerik');
    liste.innerHTML = "";
    document.getElementById('iftar-menu').innerText = menuler[bugun % menuler.length];

    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];

        if(d === bugun) {
            document.getElementById('t-imsak').innerText = ims;
            document.getElementById('t-iftar').innerText = ift;
            window.bugunIftar = ift;
            window.bugunImsak = ims;
        }

        const row = document.createElement('div');
        row.className = "imsakiye-row";
        if(d === bugun) row.style.background = "rgba(255, 215, 0, 0.2)";
        row.innerHTML = `<span>${d}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${ims}</span><span>${ift}</span>`;
        liste.appendChild(row);
    });
}

function hesaplaVeBaslat() {
    if(window.timer) clearInterval(window.timer);
    window.timer = setInterval(() => {
        const simdi = new Date();
        const iftarVakti = new Date();
        const [ih, im] = window.bugunIftar.split(':');
        iftarVakti.setHours(ih, im, 0);

        const sahurVakti = new Date();
        const [sh, sm] = window.bugunImsak.split(':');
        sahurVakti.setHours(sh, sm, 0);
        if(simdi > sahurVakti) sahurVakti.setDate(sahurVakti.getDate() + 1);

        let hedef, etiket;
        if (simdi < iftarVakti) {
            hedef = iftarVakti; etiket = "İftara Kalan Süre";
        } else {
            hedef = sahurVakti; etiket = "Sahura Kalan Süre";
        }

        let fark = hedef - simdi;
        if(fark > 0 && fark < 1500) document.getElementById('ezan-sesi').play();

        const h = Math.floor(fark/3600000).toString().padStart(2,'0');
        const m = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        
        document.getElementById('sayaç').innerText = `${h}:${m}:${s}`;
        document.getElementById('durum-etiketi').innerText = etiket;
    }, 1000);
}
