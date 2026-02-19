const sehirData = {
    "İstanbul": { cami: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b", ilceler: ["Fatih", "Beşiktaş", "Üsküdar", "Kadıköy", "Esenyurt", "Pendik", "Beylikdüzü"] },
    "Ankara": { cami: "https://images.unsplash.com/photo-1581442030095-65481749890a", ilceler: ["Çankaya", "Keçiören", "Mamak", "Etimesgut", "Sincan", "Yenimahalle"] },
    "İzmir": { cami: "https://images.unsplash.com/photo-1570133435163-95240f96860d", ilceler: ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli"] },
    "Bursa": { cami: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg", ilceler: ["Osmangazi", "Nilüfer", "Yıldırım"] }
};

const yemekler = ["Mercimek Çorbası, Tas Kebabı, Pilav, Güllaç", "Tarhana Çorbası, Karnıyarık, Cacık, Sütlaç", "Yayla Çorbası, Tavuk Sote, Bulgur, Kadayıf"];

document.addEventListener("DOMContentLoaded", () => {
    const s = document.getElementById('il-liste');
    s.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    Object.keys(sehirData).forEach(il => s.innerHTML += `<option value="${il}">${il}</option>`);
    
    const k = JSON.parse(localStorage.getItem('ramazan_pos'));
    if(k) verileriGetir(k.il, k.ilce);
});

function ilceYukle() {
    const il = document.getElementById('il-liste').value;
    const s = document.getElementById('ilce-liste');
    s.innerHTML = '';
    if(sehirData[il]) sehirData[il].ilceler.forEach(i => s.innerHTML += `<option value="${i}">${i}</option>`);
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value;
    if(!il) return;
    localStorage.setItem('ramazan_pos', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('city-bg').style.backgroundImage = `url('${sehirData[il].cami}')`;
    document.getElementById('aktif-konum').innerText = `${il} / ${ilce} 📍`;
    const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress?address=${ilce},${il},Turkey&method=13`);
    const json = await res.json();
    imsakiyeDoldur(json.data[new Date().getMonth()].days, il); // Basitleştirilmiş veri çekme
    window.allData = json.data;
    hesaplaVeBaslat();
}

function hesaplaVeBaslat() {
    if(window.timer) clearInterval(window.timer);
    window.timer = setInterval(() => {
        const simdi = new Date();
        const imsak = document.getElementById('t-imsak').innerText;
        const iftar = document.getElementById('t-iftar').innerText;
        
        const iftarVakti = new Date();
        iftarVakti.setHours(iftar.split(':')[0], iftar.split(':')[1], 0);

        const sahurVakti = new Date(); // Yarınki imsak
        sahurVakti.setHours(imsak.split(':')[0], imsak.split(':')[1], 0);
        if(simdi > sahurVakti) sahurVakti.setDate(sahurVakti.getDate() + 1);

        let hedef, etiket;

        if (simdi < iftarVakti) {
            hedef = iftarVakti;
            etiket = "İftara Kalan Süre";
        } else {
            hedef = sahurVakti;
            etiket = "Sahura Kalan Süre";
        }

        let fark = hedef - simdi;
        
        // EZAN OKUMA (Tam vakti geldiğinde 1 saniye kala tetikler)
        if(fark > 0 && fark < 2000) {
            document.getElementById('ezan-sesi').play();
        }

        if(fark < 0) { document.getElementById('sayaç').innerText = "00:00:00"; return; }

        const h = Math.floor(fark/3600000).toString().padStart(2,'0');
        const m = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const s = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        
        document.getElementById('sayaç').innerText = `${h}:${m}:${s}`;
        document.getElementById('durum-etiketi').innerText = etiket;
    }, 1000);
}

function imsakiyeDoldur(gunler) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('iftar-menu').innerText = yemekler[bugun % yemekler.length];

    gunler.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];
        if(d === bugun) {
            document.getElementById('t-imsak').innerText = ims;
            document.getElementById('t-iftar').innerText = ift;
        }
        const row = document.createElement('div');
        row.style.display="flex"; row.style.padding="10px 0"; row.style.borderBottom="1px solid #333";
        row.innerHTML = `<span style="flex:1">${d}</span><span style="flex:2">${g.date.gregorian.day}</span><span style="flex:1">${ims}</span><span style="flex:1;color:#ffd700">${ift}</span>`;
        liste.appendChild(row);
    });
}
