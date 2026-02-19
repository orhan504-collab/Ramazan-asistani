const cities = { "İstanbul": ["Beşiktaş", "Üsküdar", "Kadıköy"], "Ankara": ["Çankaya", "Keçiören"], "İzmir": ["Konak", "Karşıyaka"] }; // Bu listeyi genişletebilirsin

document.addEventListener("deviceready", () => {
    initApp();
    requestPermissions();
}, false);

function initApp() {
    updateTheme();
    loadCities();
    autoLocation();
    setInterval(updateCountdown, 1000);
}

function updateTheme() {
    const hr = new Date().getHours();
    const body = document.body;
    if (hr >= 6 && hr < 17) body.className = 'sky-day';
    else if (hr >= 17 && hr < 20) body.className = 'sky-sunset';
    else body.className = 'sky-night';
}

function autoLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        fetchVakitler(pos.coords.latitude, pos.coords.longitude, "📍 Mevcut Konum");
    }, () => fetchVakitler(41.0082, 28.9784, "İstanbul (Varsayılan)"));
}

async function fetchVakitler(lat, lng, label) {
    document.getElementById('loc-text').innerText = label;
    const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&method=13`);
    const data = await res.json();
    renderData(data.data);
}

function renderData(days) {
    const bugun = new Date().getDate();
    const list = document.getElementById('imsakiye-list');
    list.innerHTML = "";
    
    days.forEach(day => {
        const d = parseInt(day.date.gregorian.day);
        if(d === bugun) {
            document.getElementById('imsak-t').innerText = day.timings.Imsak.split(' ')[0];
            document.getElementById('iftar-t').innerText = day.timings.Maghrib.split(' ')[0];
            window.iftarTime = day.timings.Maghrib.split(' ')[0];
        }
        list.innerHTML += `<div class="table-row" style="display:grid; grid-template-columns: 1fr 2fr 1fr 1fr; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05)">
            <span>${d}</span><span>${day.date.gregorian.day} ${day.date.gregorian.month.en.slice(0,3)}</span><span>${day.timings.Imsak.split(' ')[0]}</span><span>${day.timings.Maghrib.split(' ')[0]}</span>
        </div>`;
    });
}

function updateCountdown() {
    if(!window.iftarTime) return;
    const now = new Date();
    const target = new Date();
    const [h, m] = window.iftarTime.split(':');
    target.setHours(h, m, 0);
    
    let diff = target - now;
    if(diff < 0) { document.getElementById('countdown').innerText = "Hayırlı İftarlar"; return; }
    
    // Alarm Kontrolü (10 dk kala)
    if(Math.floor(diff/1000) === 600) triggerAlarm();

    const hh = Math.floor(diff/3600000).toString().padStart(2,'0');
    const mm = Math.floor((diff%3600000)/60000).toString().padStart(2,'0');
    const ss = Math.floor((diff%60000)/1000).toString().padStart(2,'0');
    document.getElementById('countdown').innerText = `${hh}:${mm}:${ss}`;
}

function triggerAlarm() {
    if(window.cordova) {
        cordova.plugins.notification.local.schedule({ title: "İftara 10 Dakika!", text: "Sofralar hazırlansın, bereket gelsin!", foreground: true });
    }
}

// Şehir Seçme Mantığı
function loadCities() {
    const sel = document.getElementById('city-select');
    Object.keys(cities).forEach(c => sel.innerHTML += `<option value="${c}">${c}</option>`);
}
function loadDistricts() {
    const city = document.getElementById('city-select').value;
    const sel = document.getElementById('district-select');
    sel.innerHTML = "";
    cities[city].forEach(d => sel.innerHTML += `<option value="${d}">${d}</option>`);
}
function showPicker() { document.getElementById('picker-modal').style.display = 'flex'; }
function hidePicker() { document.getElementById('picker-modal').style.display = 'none'; }
