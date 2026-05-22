# Capacitor Integration — Referencia

**Estado:** Fuera de scope en Fase A. Pendiente para fase posterior.

## Contexto

El stack legacy usa un wrapper Capacitor en `C:\nalhuitad-app\` que empaqueta `www/index.html` (React 18 Babel standalone) como app nativa iOS/Android.

La migración Fase A construye `nalhuitad-vite/` como app web nueva. En una fase posterior, `nalhuitad-app/` apuntará su webDir al `dist/` de `nalhuitad-vite/`.

## Estructura actual

```
C:\
├── nalhuitad-app\          ← wrapper Capacitor (NO TOCAR durante Fase A)
│   ├── www\index.html      ← app legacy en producción
│   ├── capacitor.config.ts
│   ├── android\
│   └── ios\
└── nalhuitad-vite\         ← nueva app (este repo)
    └── dist\               ← output que consumirá Capacitor eventualmente
```

## Regla crítica durante Fase A

**No tocar `nalhuitad-app/`**. Las dos apps coexisten sin interferir. La sesión legacy usa `hidro_auth_v1` (localStorage); la nueva usa persistencia nativa de Firebase SDK v10 — claves distintas, sin colisión.

## Migración Capacitor (cuando se retome)

1. Actualizar `capacitor.config.ts` → `webDir: '../nalhuitad-vite/dist'`
2. Verificar plugins Capacitor compatibles con React 19 + Vite 6
3. Testear en dispositivo real (iOS + Android)
4. Retirar `www/index.html` legacy una vez validada la nueva app

## Plugins Capacitor previstos

| Plugin | Uso |
|--------|-----|
| `@capacitor/app` | Estado de app (foreground/background) |
| `@capacitor/network` | Detección offline |
| `@capacitor/push-notifications` | Alertas de sensores (futuro) |

## Notas

- Target: mobile-first 375px (ya respetado en `nalhuitad-vite`)
- Dark mode por defecto ya implementado
- Sin service worker / PWA en Fase A (Capacitor maneja el shell nativo)
