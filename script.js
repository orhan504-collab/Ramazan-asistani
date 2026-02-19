// Rehber Veri Havuzu
const rehberVerisi = {
    ayetler: [
        "Ey iman edenler! Allah’a karşı gelmekten sakınmanız için oruç, sizden öncekilere farz kılındığı gibi size de farz kılındı. (Bakara 183)",
        "Ramazan ayı, insanlar için bir hidayet rehberi olan Kur’an’ın indirildiği aydır. (Bakara 185)",
        "Kullarım beni senden sorarlarsa, bilsinler ki ben onlara çok yakınım. (Bakara 186)"
    ],
    hadisler: [
        "Oruç tutan bir kimse, yalan konuşmayı bırakmazsa, Allah'ın onun yemesini içmesini bırakmasına ihtiyacı yoktur.",
        "Ramazan ayı geldiğinde cennet kapıları açılır, cehennem kapıları kapanır.",
        "Oruçlu için iki sevinç vardır: Biri iftar ettiği andaki sevinç, diğeri Rabbine kavuştuğu andaki sevinç."
    ],
    dualar: [
        "Allahım! Senin rızan için oruç tuttum, senin rızkınla iftar ettim.",
        "Ey kalpleri çekip çeviren Rabbim! Kalbimi dinin üzere sabit kıl.",
        "Allahım! Sen affedicisin, affetmeyi seversin, beni de affet."
    ]
};

document.addEventListener("deviceready", () => {
    const permissions = cordova.plugins.permissions;
    permissions.requestPermission(permissions.ACCESS_FINE_LOCATION, (s) => s.hasPermission && konumAl());
}, false);

function rehberGuncelle() {
    const gun = new Date().getDate() % rehberVerisi.ayetler.length;
    document.getElementById('gunun-ayeti').innerText = rehberVerisi.ayetler[gun];
    document.getElementById('gunun-hadisi').innerText = rehberVerisi.hadisler[gun];
    document.getElementById('gunun-duasi').innerText = rehberVerisi.dualar[gun];
}

function konumAl() {
    navigator.geolocation.getCurrentPosition(pos => {
        imsakiyeYukle(pos.coords.latitude, pos.coords.longitude, "📍 Mevcut Konum");
    }, () => imsakiyeYukle(41.0082, 28.9784, "İstanbul (Varsayılan)"), { timeout: 10000 });
}

async function imsakiyeYukle(lat, lng, baslik) {
    const bugun = new Date();
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13&month=${bugun.getMonth()+1}&year=${bugun.getFullYear()}`);
        const data = await res.json();
        const imsakiyeBody = document.getElementById('imsakiye-body');
        imsakiyeBody.innerHTML = "";

        data.data.forEach((gun) => {
            const d = parseInt(gun.date.gregorian.day);
            const row = document.createElement('div');
            row.className = 'imsakiye-row';
            if (d === bugun.getDate()) {
                document.getElementById('imsak-vakit').innerText = gun.timings.Imsak.split(' ')[0];
                document.getElementById('iftar-vakit').innerText = gun.timings.Maghrib.split(' ')[0];
                document.getElementById('sehir').innerText = baslik;
                geriSayimiBaslat(gun.timings.Maghrib.split(' ')[0]);
                row.style.background = "#e9456044";
            }
            row.innerHTML = `<span>${d}</span><span>${gun.date.gregorian.month.en.substring(0,3)}</span><span>${gun.timings.Imsak.split(' ')[0]}</span><span style="color:#ffd700">${gun.timings.Maghrib.split(' ')[0]}</span>`;
            imsakiyeBody.appendChild(row);
        });
        rehberGuncelle();
    } catch (e) { document.getElementById('sehir').innerText = "Hata!"; }
}

let sayac;
function geriSayimiBaslat(iftar) {
    if(sayac) clearInterval(sayac);
    sayac = setInterval(() => {
        const f = new Date().setHours(iftar.split(':')[0], iftar.split(':')[1], 0) - new Date();
        if(f<0) { document.getElementById('kalan-sure').innerText = "Hayırlı İftarlar!"; return; }
        const h = Math.floor(f/3600000), m = Math.floor((f%3600000)/60000), s = Math.floor((f%60000)/1000);
        document.getElementById('kalan-sure').innerText = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }, 1000);
}

document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');
if(!window.cordova) { konumAl(); rehberGuncelle(); }
