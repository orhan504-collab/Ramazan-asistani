const iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

const menuler = [
    "Mercimek Çorbası, Tas Kebabı, Pirinç Pilavı, Güllaç",
    "Ezogelin Çorbası, Karnıyarık, Cacık, Revani",
    "Tarhana Çorbası, İzmir Köfte, Mevsim Salatası, Şekerpare",
    "Yayla Çorbası, Tavuk Sote, Bulgur Pilavı, Sütlaç",
    "Domates Çorbası, Orman Kebabı, Ayran, Kadayıf"
];

document.addEventListener("DOMContentLoaded", () => {
    temaGuncelle();
    ilDoldur();
    
    const kayitli = JSON.parse(localStorage.getItem('ramazanKonum'));
    if(kayitli) {
        verileriGetir(kayitli.il, kayitli.ilce);
    }
    setInterval(temaGuncelle, 60000);
});

function ilDoldur() {
    const s = document.getElementById('il-liste');
    s.innerHTML = '<option value="">Şehir Seçiniz...</option>';
    iller.forEach(il => {
        s.innerHTML += `<option value="${il}">${il}</option>`;
    });
}

// İLÇELERİ API'DEN OTOMATİK ÇEKER
async function ilceGuncelle() {
    const il = document.getElementById('il-liste').value;
    const s = document.getElementById('ilce-liste');
    if(!il) return;
    
    s.innerHTML = '<option value="">İlçeler Yükleniyor...</option>';
    
    try {
        // Aladhan API kullanarak o şehrin ilçelerini/bölgelerini tahmin eder veya varsayılan merkez atar
        // Not: Bu API direkt ilçe listesi vermez, o yüzden manuel giriş veya tahmin kullanılır.
        // Basitlik için şehre göre bir "Merkez" ve "Genel" opsiyonu sunuyoruz:
        s.innerHTML = `<option value="${il}">Merkez / Genel</option>`;
        s.innerHTML += `<option value="${il} Alt Bölge 1">Diğer Bölgeler</option>`;
    } catch(e) {
        s.innerHTML = '<option value="">Yükleme Hatası</option>';
    }
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value;
    if(!il) return alert("Lütfen şehir seçin");
    
    const konum = {il: il, ilce: ilce || il};
    localStorage.setItem('ramazanKonum', JSON.stringify(konum));
    verileriGetir(konum.il, konum.ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    document.getElementById('aktif-konum').innerText = "⌛ Yükleniyor...";
    const yil = new Date().getFullYear();
    const ay = new Date().getMonth() + 1;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        if(json.data) imsakiyeDoldur(json.data, il, ilce);
    } catch (e) {
        document.getElementById('aktif-konum').innerText = "📍 İnternet Gerekli";
    }
}

function imsakiyeDoldur(gunler, il, ilce) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('aktif-konum').innerText = `📍 ${il}`;
    document.getElementById('iftar-menu').innerText = menuler[bugun % menuler.length];

    gunler.forEach(g => {
        const gunNo = parseInt(g.date.gregorian.day);
        const imsak = g.timings.Imsak.split(' ')[0];
        const iftar = g.timings.Maghrib.split(' ')[0];

        if(gunNo === bugun) {
            document.getElementById('t-imsak').innerText = imsak;
            document.getElementById('t-iftar').innerText = iftar;
            window.hedefIftar = iftar;
            sayacBaslat();
        }

        const satir = document.createElement('div');
        satir.className = "imsakiye-row";
        if(gunNo === bugun) satir.style.background = "rgba(255, 215, 0, 0.2)";
        satir.innerHTML = `<span>${gunNo}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${imsak}</span><span style="color:#ffd700; font-weight:bold;">${iftar}</span>`;
        liste.appendChild(satir);
    });
}

function sayacBaslat() {
    if(window.timer) clearInterval(window.timer);
    window.timer = setInterval(() => {
        const suan = new Date();
        const hedef = new Date();
        const [h, m] = window.hedefIftar.split(':');
        hedef.setHours(h, m, 0);
        let fark = hedef - suan;

        if(fark > 599000 && fark < 601000) { 
            document.getElementById('alarm-sesi').play();
            alert("İftara son 10 dakika!");
        }

        if(fark < 0) { document.getElementById('sayaç').innerText = "Hayırlı İftarlar"; return; }

        const hh = Math.floor(fark/3600000).toString().padStart(2,'0');
        const mm = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        document.getElementById('sayaç').innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
}

function temaGuncelle() {
    const hr = new Date().getHours();
    const b = document.getElementById('main-body');
    if (hr >= 6 && hr < 17) b.className = 'sky-day';
    else if (hr >= 17 && hr < 20) b.className = 'sky-sunset';
    else b.className = 'sky-night';
}
