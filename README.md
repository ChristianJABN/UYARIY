# UYARIY

App web (PWA) contra el acoso escolar. React + Vite + Supabase, desplegada en Vercel.

## 1. Probar en tu PC
```bash
npm install
cp .env.example .env     # en Windows: copy .env.example .env
npm run dev
```
Rellena `.env` con la URL y la clave *anon* de tu proyecto Supabase (Project Settings → API).

## 2. Supabase
1. Crea un proyecto en supabase.com.
2. SQL Editor → pega `supabase/schema.sql` → Run.
3. Authentication → Providers → Email: **desactiva "Confirm email"**.
4. Authentication → Users → *Add user*: correo `codigo@uyariy.app` y el PIN (mínimo 6 dígitos) como contraseña.
5. Registra su perfil con el `insert` de ejemplo al final de `schema.sql`. Usa `role = 'staff'` para tutores/psicólogos.

## 3. Publicar
Sube a GitHub, importa el repositorio en vercel.com y agrega las dos variables de `.env` en Settings → Environment Variables.

## 4. Íconos de la PWA
Agrega `icon-192.png` e `icon-512.png` en `/public`.

## Módulo 2
Ejecuta `supabase/migration_02.sql` en el SQL Editor (crea el bucket `evidencias` y el escalado de casos).

## Estado
Listo: login, consentimiento, check-in, alerta con evidencias, seguimiento, chat, mascota y panel con resumen, casos y mensajes.
Siguiente: recordatorios, consentimiento de padres, más gráficos.
