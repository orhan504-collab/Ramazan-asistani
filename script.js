const iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

document.addEventListener("deviceready", () => {
    temaGuncelle();
    ilListesiDoldur();
    konumAl(); // Otomatik konum denemesi
    setInterval(temaGuncelle, 60000);
}, false);

function ilListesiDoldur() {
    const s = document.getElementById('il-liste');
    iller.forEach(il => s.innerHTML += `<option value="${il}">${il}</option>`);
}

function temaGuncelle() {
    const hr = new Date().getHours();
    const b = document.getElementById('main-body');
    if (hr >= 6 && hr < 17) b.className = 'sky-day';
    else if (hr >= 17 && hr < 20) b.className = 'sky-sunset';
    else b.className = 'sky-night';
}

function konumAl() {
    navigator.geolocation.getCurrentPosition(
        p => vakitCek(p.coords.latitude, p.coords.longitude, "📍 Mevcut Konum"),
        e => vakitCek(41.0082, 28.9784, "İstanbul (Varsayılan)")
    );
}

async function vakitCek(lat, lng, baslik) {
    document.getElementById('aktif-konum').innerText = baslik;
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13`);
        const d = await res.json();
        veriyiIsle(d.data);
    } catch(e) { alert("İnternet bağlantınızı kontrol edin."); }
}

function veriyiIsle(gunler) {
    const bugun = new Date().getDate();
    const liste = document.getElementById('liste-icerik');
    liste.innerHTML = "";
    
    gunler.forEach(g => {
        const gunNo = parseInt(g.date.gregorian.day);
        if(gunNo === bugun) {
            document.getElementById('t-imsak').innerText = g.timings.Imsak.split(' ')[0];
            document.getElementById('t-iftar').innerText = g.timings.Maghrib.split(' ')[0];
            window.hedefIftar = g.timings.Maghrib.split(' ')[0];
            sayaçBaslat();
        }
        liste.innerHTML += `<div style="display:grid; grid-template-columns: 1fr 2fr 1fr 1fr; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.9rem;">
            <span>${gunNo}</span><span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span><span>${g.timings.Imsak.split(' ')[0]}</span><span>${g.timings.Maghrib.split(' ')[0]}</span>
        </div>`;
    });
}

function sayaçBaslat() {
    if(window.timer) clearInterval(window.timer);
    window.timer = setInterval(() => {
        const suan = new Date();
        const hedef = new Date();
        const [h, m] = window.hedefIftar.split(':');
        hedef.setHours(h, m, 0);
        
        let fark = hedef - suan;
        if(fark < 0) { document.getElementById('sayaç').innerText = "00:00:00"; return; }
        
        // 10 Dakika Alarmı
        if(Math.floor(fark/1000) === 600) {
            if(window.cordova) cordova.plugins.notification.local.schedule({ title: "İftara 10 Dakika!", text: "Sofralar hazırlansın!", foreground: true });
        }

        const hh = Math.floor(fark/3600000).toString().padStart(2,'0');
        const mm = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        document.getElementById('sayaç').innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
}

// Modal Fonksiyonları
function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }
function konumKaydet() {
    const sehir = document.getElementById('il-liste').value;
    modalKapat();
    fetch(`https://api.aladhan.com/v1/timingsByAddress?address=${sehir},Turkey&method=13`)
        .then(r => r.json())
        .then(d => {
            vakitCek(d.data.meta.latitude, d.data.meta.longitude, "📍 " + sehir);
        });
}
