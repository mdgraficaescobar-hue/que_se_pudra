# QSP — Cliente Flutter

Cliente oficial de **Qué Se Pudra**, construido sobre la biblia del proyecto.

## Estructura

```
lib/
  main.dart                  → entry point
  theme/qsp_theme.dart       → tokens visuales (colores, tipografía, botón)
  models/game_models.dart    → modelos 1:1 con los DTOs del servidor
  services/socket_service.dart → única puerta de entrada a Socket.IO
  widgets/
    playing_card.dart        → carta + reverso de carta
    player_seat.dart         → asiento de rival (con indicadores)
  screens/
    home_screen.dart         → pantalla principal (mock aprobado)
    lobby_screen.dart        → crear sala / unirse / partida rápida
    room_screen.dart         → sala de espera
    game_screen.dart         → mesa de juego (regla suprema: jugador abajo-centro)
    scoreboard_screen.dart   → resultados entre rondas
    game_end_screen.dart     → fin de partida + revancha
    profile_screen.dart      → nombre, avatar, color, estadísticas diarias
    settings_screen.dart     → sonido, vibración, notificaciones
```

## Setup

### 1. Instalar dependencias

```bash
flutter pub get
```

### 2. Agregar las fuentes

Este proyecto usa **Russo One** (display) y **Nunito** (body), igual que el mock HTML aprobado. Dos opciones:

**Opción A — Google Fonts package (ya incluido en pubspec, cero configuración):**
Reemplazá las referencias `fontFamily: 'RussoOne'` por `GoogleFonts.russoOne()` si preferís no descargar los .ttf manualmente.

**Opción B — Fuentes locales (más liviano, sin red):**
1. Descargá `RussoOne-Regular.ttf` y `Nunito` (varios pesos) de Google Fonts.
2. Colocalas en `assets/fonts/`.
3. Agregá a `pubspec.yaml`:

```yaml
flutter:
  fonts:
    - family: RussoOne
      fonts:
        - asset: assets/fonts/RussoOne-Regular.ttf
    - family: Nunito
      fonts:
        - asset: assets/fonts/Nunito-Regular.ttf
        - asset: assets/fonts/Nunito-SemiBold.ttf
          weight: 600
        - asset: assets/fonts/Nunito-ExtraBold.ttf
          weight: 800
```

### 3. Configurar la URL del servidor

En `lib/screens/lobby_screen.dart`:

```dart
const String kServerUrl = 'http://localhost:3001'; // ⚠️ cambiar al desplegar
```

Cuando despliegues el `qsp-server` (Sprint 3) a producción (Railway, Render, Fly.io, etc.), actualizá esta constante con la URL pública.

### 4. Correr

```bash
flutter run                  # dispositivo conectado / emulador
flutter run -d chrome        # web
flutter build apk            # Android release
flutter build ios            # iOS release (requiere Mac + Xcode)
flutter build web            # Web release
```

## Decisiones de diseño

- **Sin imágenes rasterizadas**: toda la ilustración de la mesa (cartas, fichas, tapete) está hecha con `Container`, `BoxDecoration` y emojis nativos — cero peso de assets, carga instantánea.
- **Un solo SocketService singleton**: ninguna pantalla habla con Socket.IO directamente, todo pasa por streams tipados. Si cambia el protocolo del servidor, solo se toca este archivo.
- **Modelos espejo de los DTOs**: `models/game_models.dart` refleja 1:1 `qsp-server/src/events.ts`. Si el servidor cambia un campo, hay que actualizar ambos lados — recomendamos en el futuro generar este archivo desde el mismo schema (ej. con un generador de tipos compartido).
- **Regla Suprema respetada**: en `game_screen.dart`, `_MyZone` siempre se renderiza al final de la columna (abajo) y centrada — el jugador nunca se confunde sobre cuál es su mano.

## Pendiente para producción

- [ ] Reconexión automática con UUID persistido (ya hay `getOrCreatePlayerId()` en el servicio, falta cablear el flujo completo de reconexión visual)
- [ ] Animaciones de reparto de cartas y resolución de mano (hoy son instantáneas)
- [ ] Sonido (toggle ya existe en Ajustes, falta el audio real)
- [ ] Splash screen / ícono de app
- [ ] Tests de widget
