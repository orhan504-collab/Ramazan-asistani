const iller = ["Adana","Adıyaman","Afyonkarahisar","Ağrı","Aksaray","Amasya","Ankara","Antalya","Ardahan","Artvin","Aydın","Balıkesir","Bartın","Batman","Bayburt","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Düzce","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Iğdır","Isparta","İstanbul","İzmir","Kahramanmaraş","Karabük","Karaman","Kars","Kastamonu","Kayseri","Kilis","Kırıkkale","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Mardin","Mersin","Muğla","Muş","Nevşehir","Niğde","Ordu","Osmaniye","Rize","Sakarya","Samsun","Şanlıurfa","Siirt","Sinop","Sivas","Şırnak","Tekirdağ","Tokat","Trabzon","Tunceli","Uşak","Van","Yalova","Yozgat","Zonguldak"];

document.addEventListener("deviceready", () => {
    temaGuncelle();
    ilListesiDoldur();
    
    // Daha önce seçilen şehri otomatik yükle
    const kayitli = localStorage.getItem('secilenSehir');
    if(kayitli) {
        sehirVaktiGetir(kayitli);
    }
    
    // Her dakika başı tema ve bildirim kontrolü
    setInterval(() => {
        temaGuncelle();
    }, 60000);
}, false);

function ilListesiDoldur() {
    const s = document.getElementById('il-liste');
    iller.forEach(il => {
        let opt = document.createElement('option');
        opt.value = il;
        opt.innerHTML = il;
        s.appendChild(opt);
    });
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const sehir = document.getElementById('il-liste').value;
    if(!sehir) return;
    localStorage.setItem('secilenSehir', sehir);
    sehirVaktiGetir(sehir);
    modalKapat();
}

async function sehirVaktiGetir(sehir) {
    document.getElementById('aktif-konum').innerText = "⌛ Veriler Alınıyor...";
    const yil = new Date().getFullYear();
    const ay = new Date().getMonth() + 1;
    
    try {
        const url = `https://api.aladhan.com/v1/calendarByAddress/${yil}/${ay}?address=${sehir},Turkey&method=13`;
        const res = await fetch(url);
        const json = await res.json();
        
        if(json.data) {
            imsakiyeDoldur(json.data, sehir);
        }
    } catch (e) {
        document.getElementById('aktif-konum').innerText = "📍 İnternet Gerekli!";
    }
}

function imsakiyeDoldur(gunler, sehir) {
    const liste = document.getElementById('liste-icerik');
    const bugun = new Date().getDate();
    liste.innerHTML = "";
    document.getElementById('aktif-konum').innerText = "📍 " + sehir;

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
        
        satir.innerHTML = `
            <span>${gunNo}</span>
            <span>${g.date.gregorian.day} ${g.date.gregorian.month.en.slice(0,3)}</span>
            <span>${imsak}</span>
            <span style="color:#ffd700; font-weight:bold;">${iftar}</span>
        `;
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
        
        // 10 Dakika Bildirimi (600.000 ms)
        if (fark > 599000 && fark < 601000) {
            triggerNotification("İftara 10 Dakika Kaldı!", "Sofralar hazırlansın, bereket gelsin.");
        }

        if(fark < 0) {
            document.getElementById('sayaç').innerText = "00:00:00";
            document.getElementById('durum-etiketi').innerText = "Hayırlı İftarlar!";
            return;
        }

        const hh = Math.floor(fark/3600000).toString().padStart(2,'0');
        const mm = Math.floor((fark%3600000)/60000).toString().padStart(2,'0');
        const ss = Math.floor((fark%60000)/1000).toString().padStart(2,'0');
        document.getElementById('sayaç').innerText = `${hh}:${mm}:${ss}`;
    }, 1000);
}

function triggerNotification(baslik, mesaj) {
    // Ses Çal
    const audio = document.getElementById('notification-sound');
    if(audio) audio.play();

    // Titreşim (Cordova plugin gerektirir: cordova-plugin-vibration)
    if (navigator.vibrate) {
        navigator.vibrate([500, 300, 500]);
    }

    // Yerel Bildirim (Cordova plugin gerektirir: cordova-plugin-local-notification)
    if (window.cordova && cordova.plugins.notification) {
        cordova.plugins.notification.local.schedule({
            title: baslik,
            text: mesaj,
            foreground: true
        });
    } else {
        alert(baslik + "\n" + mesaj);
    }
}

function temaGuncelle() {
    const hr = new Date().getHours();
    const b = document.getElementById('main-body');
    if (hr >= 6 && hr < 17) b.className = 'sky-day';
    else if (hr >= 17 && hr < 20) b.className = 'sky-sunset';
    else b.className = 'sky-night';
}
