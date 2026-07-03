# Climbing Timer Dashboard

Kostenlose, sehr einfache Timer-Webapp für Kletterhallen und kleine Wettbewerbe.
Reines HTML/CSS/JavaScript, kein Backend, kein Login, keine Datenbank. Alle
Einstellungen werden im Browser via `localStorage` gespeichert.

Gedacht für den Einsatz auf einem großen Monitor im Vollbildmodus neben dem
Boulder- oder Lead-Bereich einer Kletterhalle.

## Funktionen

- Setup-Seite mit Presets (Bouldern, Bouldern lang, Lead) und individuellen
  Einstellungen (Kletterzeit, Räumzeit, Anzahl Durchläufe, Warn-/Kritisch-Phase)
- Erweiterte Einstellungen (Schriftgröße, Schriftart, Farben, Sound) hinter
  einem Zahnrad-Button
- Live-Vorschau, die genau so aussieht wie später der Vollbild-Timer
- Timer-Ansicht: großer, zentrierter Countdown (MM:SS), Statusanzeige
  (Klettern / Räumzeit / Durchlauf X / Y / Bereit / Pausiert / Fertig)
- Automatischer Wechsel Klettern → Räumzeit → nächster Durchlauf → Fertig
- Warnphase (Standard: letzte 10 %) ändert die Timer-Farbe, kritische Phase
  (Standard: letzte 5 %) lässt den Timer zusätzlich pulsieren
- Optionale Signaltöne bei Start, Phasenwechsel und Ende – erzeugt per
  Web Audio API, ganz ohne externe Audiodateien
- Ausfahrbares Bedienmenü am unteren Bildschirmrand (Maus/Touch): Start,
  Pause, Weiter, Zurücksetzen, Vollbild an/aus, Einstellungen
- Alle Einstellungen persistent im Browser, inkl. „Auf Standard zurücksetzen“

## Lokaler Start ohne Docker

Die App besteht nur aus statischen Dateien. Da `src/main.js` als ES-Modul
eingebunden wird, muss sie über `http://`, nicht über `file://`, geöffnet
werden. Ein einfacher lokaler Webserver reicht:

```bash
# Python
python3 -m http.server 8080

# oder Node.js
npx serve -l 8080
```

Danach im Browser öffnen: `http://localhost:8080`

## Docker Build

```bash
docker build -t climbing-timer-dashboard .
```

## Docker Run

```bash
docker run -d --name climbing-timer -p 8080:80 climbing-timer-dashboard
```

Die App ist danach erreichbar unter: `http://localhost:8080`

## Deployment unter einem Unterpfad (z. B. `/timer` oder `/climbing-timer`)

Die App verwendet ausschließlich relative Pfade (`src/main.js`,
`src/styles.css`) und funktioniert daher ohne Anpassung unter jedem
Unterpfad. Beispiel für einen nginx-Reverse-Proxy vor dem Container:

```nginx
location /climbing-timer/ {
    proxy_pass http://climbing-timer:80/;
}
```

Oder direkt als eigener Location-Block mit den statischen Dateien:

```nginx
location /timer/ {
    alias /usr/share/nginx/html/;
    try_files $uri $uri/ /timer/index.html;
}
```

## Nutzung

1. Auf der Setup-Seite Preset wählen oder eigene Werte eingeben
2. Optional über das Zahnrad Schriftgröße, Farben und Sound anpassen
3. „Vollbild starten“ klickt direkt in den Vollbildmodus, „Timer öffnen“
   wechselt ohne Vollbild in die Timer-Ansicht
4. Im Vollbild am unteren Bildschirmrand mit Maus/Finger das Bedienmenü
   einblenden, um Start, Pause, Weiter, Zurücksetzen, Vollbild oder
   Einstellungen aufzurufen
5. Über „Einstellungen“ im Bedienmenü jederzeit zurück zur Setup-Seite

## Technische Hinweise

- Kein Build-Schritt nötig, reines Vanilla JS (ES-Module)
- Timer-Logik läuft rein im Browser-Tab; wie bei jeder Web-App können
  Hintergrund-Tabs vom Browser gedrosselt werden – die Anzeige sollte daher
  im Vordergrund/Vollbild auf dem Zielmonitor laufen
- Projektstruktur:

```
index.html
src/
  main.js        Einstiegspunkt, verbindet alle Module
  settings.js     Defaults, Presets, localStorage
  audio.js        Signaltöne (Web Audio API)
  timerEngine.js  Zustandsautomat des Timers
  ui.js           Setup-Formular & Live-Vorschau
  timerView.js    Vollbild-Timeranzeige & Bedienmenü
  styles.css
Dockerfile
README.md
```
