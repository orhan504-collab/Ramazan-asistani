const sehirRehberi = {
    "İstanbul": { cami: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b", ilceler: ["Fatih", "Beşiktaş", "Üsküdar", "Kadıköy", "Pendik", "Esenyurt"] },
    "Ankara": { cami: "https://images.unsplash.com/photo-1581442030095-65481749890a", ilceler: ["Çankaya", "Keçiören", "Yenimahalle", "Mamak", "Sincan"] },
    "İzmir": { cami: "https://images.unsplash.com/photo-1570133435163-95240f96860d", ilceler: ["Konak", "Karşıyaka", "Bornova", "Buca", "Çiğli"] },
    "Bursa": { cami: "https://images.unsplash.com/photo-1528660544347-949395277494", ilceler: ["Osmangazi", "Nilüfer", "Yıldırım", "İnegöl"] },
    "Edirne": { cami: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Selimiye_Mosque_Night.jpg", ilceler: ["Merkez", "Enez", "Keşan"] },
    "Antalya": { cami: "https://images.unsplash.com/photo-1548682137-291763156948", ilceler: ["Muratpaşa", "Kepez", "Konyaaltı", "Alanya"] },
    "Adana": { cami: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Sabanc%C4%B1_Central_Mosque_Adana.jpg", ilceler: ["Seyhan", "Çukurova", "Sarıçam"] },
    "Konya": { cami: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mevlana_Museum_Konya.jpg", ilceler: ["Selçuklu", "Meram", "Karatay"] },
    "Gaziantep": { cami: "https://images.unsplash.com/photo-1623161042533-5c74384931a7", ilceler: ["Şahinbey", "Şehitkamil"] },
    "Trabzon": { cami: "https://images.unsplash.com/photo-1628156687440-b38740f90c42", ilceler: ["Ortahisar", "Akçaabat", "Of"] },
    "Eskişehir": { cami: "https://images.unsplash.com/photo-1625756382101-7221e35359a3", ilceler: ["Odunpazarı", "Tepebaşı"] },
    "Diyarbakır": { cami: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Diyarbak%C4%B1r_Ulu_Camii.jpg", ilceler: ["Sur", "Bağlar", "Kayapınar"] },
    "Kayseri": { cami: "https://images.unsplash.com/photo-1596464716127-f2a82984de30", ilceler: ["Melikgazi", "Kocasinan", "Talas"] }
};

// Listede olmayan şehirler için genel resim
const genelCami = "https://images.unsplash.com/photo-1564769625905-50e93615e769";

document.addEventListener("DOMContentLoaded", () => {
    const ilSec = document.getElementById('il-liste');
    ilSec.innerHTML = '<option value="">Şehir Seçin</option>';
    
    // Alfabeye göre sıralayalım
    const siraliIller = Object.keys(sehirRehberi).sort((a,b) => a.localeCompare(b, 'tr'));
    
    siraliIller.forEach(il => {
        ilSec.innerHTML += `<option value="${il}">${il}</option>`;
    });

    // Kayıtlı veriyi kontrol et
    const k = JSON.parse(localStorage.getItem('ramazan_pos_v2'));
    if(k) verileriGetir(k.il, k.ilce);
});

function ilceGuncelle() {
    const il = document.getElementById('il-liste').value;
    const ilceSec = document.getElementById('ilce-liste');
    ilceSec.innerHTML = '';
    
    if(sehirRehberi[il]) {
        sehirRehberi[il].ilceler.forEach(i => {
            ilceSec.innerHTML += `<option value="${i}">${i}</option>`;
        });
    } else {
        ilceSec.innerHTML = '<option value="Merkez">Merkez</option>';
    }
}

function modalAc() { document.getElementById('il-modal').style.display = 'flex'; }
function modalKapat() { document.getElementById('il-modal').style.display = 'none'; }

function konumKaydet() {
    const il = document.getElementById('il-liste').value;
    const ilce = document.getElementById('ilce-liste').value || "Merkez";
    if(!il) { alert("Lütfen bir şehir seçin!"); return; }
    
    localStorage.setItem('ramazan_pos_v2', JSON.stringify({il, ilce}));
    verileriGetir(il, ilce);
    modalKapat();
}

async function verileriGetir(il, ilce) {
    // Resim güncelleme (Eğer listede yoksa genel camiyi koy)
    const resimURL = sehirRehberi[il] ? sehirRehberi[il].cami : genelCami;
    document.getElementById('city-bg').style.backgroundImage = `url('${resimURL}')`;
    
    document.getElementById('aktif-konum').innerText = `${il} / ${ilce} 📍`;
    
    try {
        const res = await fetch(`https://api.aladhan.com/v1/calendarByAddress?address=${ilce},${il},Turkey&method=13`);
        const json = await res.json();
        
        // API bazen data[month] bazen direkt data döner, kontrol edelim:
        const data = json.data[new Date().getMonth()].days || json.data;
        
        imsakiyeDoldur(data, new Date().getDate());
        hesaplaVeBaslat(data);
    } catch(e) { 
        document.getElementById('aktif-konum').innerText = "Hata: İnternet Gerekli!";
    }
}

// ... imsakiyeDoldur ve hesaplaVeBaslat fonksiyonları öncekiyle aynı kalacak ...
