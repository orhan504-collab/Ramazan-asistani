// Cami Resimleri ve İlçe Veritabanı
const sehirAyarlari = {
    "İstanbul": { cami: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b", ilceler: ["Fatih", "Beşiktaş", "Üsküdar", "Esenyurt", "Kadıköy"] },
    "Ankara": { cami: "https://images.unsplash.com/photo-1590075865003-e48267af5f9d", ilceler: ["Çankaya", "Keçiören", "Mamak", "Etimesgut"] },
    "Edirne": { cami: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg", ilceler: ["Merkez", "Keşan", "Uzunköprü"] },
    "Bursa": { cami: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg", ilceler: ["Osmangazi", "Nilüfer", "Yıldırım"] }
};

const menuler = ["Mercimek Çorbası, Karnıyarık, Pilav, Güllaç", "Yayla Çorbası, Köfte, Salat, Sütlaç", "Ezogelin, Tavuk Sote, Bulgur, Kadayıf"];

document.addEventListener("DOMContentLoaded", () => {
    // İlleri Yükle
    const ilSec = document.getElementById('il-liste');
    ilSec.innerHTML = '<option value="">İl Seçin</option>';
    Object.keys(sehirAyarlari).forEach(il => {
        ilSec.innerHTML += `<option value="${il}">${il}</option>`;
    });

    const kayitli = JSON.parse(localStorage.getItem('userPos'));
    if(kayitli) verileriGetir(kayitli.il, kayitli.ilce);
});

function ilceYukle() {
    const il = document.getElementById('il-liste').value;
    const ilceSec = document.getElementById('ilce-liste');
    ilceSec.innerHTML = '';
    if(sehirAyarlari[il]) {
        sehirAyarlari[il].ilceler.forEach(i => {
            ilceSec.innerHTML += `<option value="${i}">${i}</option>`;
        });
    }
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value;
    if(!il || !ilce) return;
    localStorage.setItem('userPos', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    // Cami Resmini Güncelle
    document.getElementById('city-bg').style.backgroundImage = `url('${sehirAyarlari[il].cami}')`;
    document.getElementById('aktif-konum').innerText = `${il} / ${ilce} 📍`;
    
    const yil = new Date().getFullYear();
    const ay = new Date().getMonth() + 1;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        imsakiyeDoldur(json.data, il);
    } catch(e) { console.log("Hata!"); }
}

function imsakiyeDoldur(gunler, il) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('iftar-menu').innerText = menuler[bugun % menuler.length];

    gunler.forEach(g => {
        const gunNo = parseInt(g.date.gregorian.day);
        const imsak = g.timings.Imsak.split(' ')[0];
        const iftar = g.timings.Maghrib.split(' ')[0];

        if(gunNo === bugun) {
            document.getElementById('t-imsak').innerText = imsak;
            document.getElementById('t-iftar').innerText = iftar;
            window.targetIftar = iftar;
            sayacBaslat();
        }
        
        const row = document.createElement('div');
        row.className = "imsakiye-row";
        row.style.display = "flex"; row.style.padding = "10px 0"; row.style.textAlign = "center";
        row.innerHTML = `<span style="flex:1">${gunNo}</span><span style="flex:2">${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span style="flex:1">${imsak}</span><span style="flex:1; color:#ffd700">${iftar}</span>`;
        liste.appendChild(row);
    });
}

function sayacBaslat() {
    if(window.t) clearInterval(window.t);
    window.t = setInterval(() => {
        const suan = new Date();
        const hedef = new Date();
        const [h, m] = window.targetIftar.split(':');
        hedef.setHours(h, m, 0);
        let fark = hedef - suan;
        if(fark < 0) { document.getElementById('sayaç').innerText = "00:00:00"; return; }
        const hh = Math.floor(fark/3600000).toString().padStart(2,'0');
        const mm = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        document.getElementById('sayaç').innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
}
