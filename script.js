const iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

const camiResimleri = {
    "İstanbul": "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b",
    "Ankara": "https://images.unsplash.com/photo-1581442030095-65481749890a",
    "İzmir": "https://images.unsplash.com/photo-1570133435163-95240f96860d",
    "Edirne": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg",
    "Bursa": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Bursa_Ulu_Camii_2.jpg",
    "Sivas": "https://upload.wikimedia.org/wikipedia/commons/8/87/Sivas_Ulu_Camii_General_View.jpg",
    "Şanlıurfa": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Balikligol_Sanliurfa.jpg"
};

document.addEventListener("DOMContentLoaded", () => {
    const s = document.getElementById('il-select');
    s.innerHTML = '<option value="">Şehir Seçin (81 İl)</option>';
    iller.forEach(il => s.innerHTML += `<option value="${il}">${il}</option>`);

    const k = JSON.parse(localStorage.getItem('ramazan_vfinal'));
    if(k) verileriGetir(k.il, k.ilce);
    else modalAc();
});

function ilceDoldur() {
    const il = document.getElementById('il-select').value;
    document.getElementById('ilce-select').innerHTML = `<option value="${il}">Merkez / Tüm İlçeler</option>`;
}

function modalAc() { document.getElementById('modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('modal').style.display = 'none'; }

function kaydet() {
    const il = document.getElementById('il-select').value;
    const ilce = document.getElementById('ilce-select').value;
    if(!il) return alert("Lütfen bir il seçin!");
    localStorage.setItem('ramazan_vfinal', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    const bg = camiResimleri[il] || "https://images.unsplash.com/photo-1564769625905-50e93615e769";
    document.getElementById('city-bg').style.backgroundImage = `url('${bg}')`;
    document.getElementById('location-text').innerText = `${il} 📍`;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress?address=${il},Turkey&method=13`);
        const json = await res.json();
        const data = json.data[new Date().getMonth()].days || json.data;
        
        imsakiyeDoldur(data);
        sayacBaslat(data);
    } catch(e) { document.getElementById('label').innerText = "Bağlantı Hatası!"; }
}

function imsakiyeDoldur(data) {
    const b = document.getElementById('list-body');
    const bugun = new Date().getDate();
    b.innerHTML = "";
    
    data.forEach(g => {
        const d = parseInt(g.date.gregorian.day);
        const ims = g.timings.Imsak.split(' ')[0];
        const ift = g.timings.Maghrib.split(' ')[0];
        
        if(d === bugun) {
            document.getElementById('imsak-vakti').innerText = ims;
            document.getElementById('iftar-vakti').innerText = ift;
            window.vakitler = { ims, ift };
        }
        
        const r = document.createElement('div');
        r.className = 'row';
        if(d === bugun) r.style.cssText = "background:rgba(255,215,0,0.15); color:#ffd700; font-weight:bold;";
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

        let hedef, etiket;
        if(simdi < iftar) { hedef = iftar; etiket = "İftara Kalan Süre"; }
        else { hedef = imsak; etiket = "Sahura Kalan Süre"; }

        let fark = hedef - simdi;

        // Dinamik Tema
        if(fark < 3600000) { // Son 1 saat
            document.getElementById('city-bg').classList.add(simdi < iftar ? 'tema-iftar' : 'tema-sahur');
        }

        // Son 5 Dakika Uyarısı
        if(Math.floor(fark/1000) === 300) {
            document.getElementById('uyari-sesi').play();
            const n = document.createElement('div');
            n.className = "uyari-notu"; n.innerText = "⏳ Son 5 Dakika!";
            document.body.appendChild(n);
            setTimeout(() => n.remove(), 10000);
        }

        // Ezan ve Tebrik
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
