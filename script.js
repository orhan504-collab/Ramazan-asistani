// Tarihi göster
document.getElementById('tarih').innerText = new Date().toLocaleDateString('tr-TR');

// Basit bir geri sayım örneği
function sayaciGuncelle() {
    const simdi = new Date();
    // Burada gerçek bir API'den vakit çekilebilir, şimdilik sabit
    const iftar = new Date();
    iftar.setHours(19, 12, 0);

    let fark = iftar - simdi;
    if (fark < 0) {
        document.getElementById('kalan-sure').innerText = "Hayırlı İftarlar!";
        return;
    }

    const saat = Math.floor((fark / (1000 * 60 * 60)) % 24);
    const dk = Math.floor((fark / 1000 / 60) % 60);
    const sn = Math.floor((fark / 1000) % 60);

    document.getElementById('kalan-sure').innerText = 
        `${saat.toString().padStart(2, '0')}:${dk.toString().padStart(2, '0')}:${sn.toString().padStart(2, '0')}`;
}

setInterval(sayaciGuncelle, 1000);
