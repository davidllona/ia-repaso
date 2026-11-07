# Cuenta y sincronización del progreso

La web es estática (GitHub Pages), así que el inicio de sesión y el guardado del progreso
en la nube los hace **Supabase** (plan gratuito). Mientras `assets/js/cuenta-config.js`
esté vacío, todo funciona igual que antes y el progreso se guarda solo en el navegador.

## Activarlo (una vez, ~5 minutos)

1. Entra en <https://supabase.com>, crea una cuenta y pulsa **New project** (cualquier nombre,
   región Europa, guarda la contraseña de la base de datos aunque no la vas a usar).
2. Cuando termine de crearse, ve a **SQL Editor → New query**, pega esto y pulsa **Run**:

```sql
create table if not exists public.progreso (
  user_id uuid primary key references auth.users(id) on delete cascade,
  datos jsonb not null default '{}'::jsonb,
  actualizado timestamptz not null default now()
);
alter table public.progreso enable row level security;

create policy "leer mi progreso" on public.progreso
  for select using (auth.uid() = user_id);
create policy "crear mi progreso" on public.progreso
  for insert with check (auth.uid() = user_id);
create policy "cambiar mi progreso" on public.progreso
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

   Las reglas (RLS) hacen que cada persona solo pueda leer y escribir **su** fila.

3. **Authentication → URL Configuration**:
   - *Site URL*: `https://davidllona.github.io/ia-repaso/`
   - *Redirect URLs*: añade `https://davidllona.github.io/ia-repaso/**`
4. (Opcional) **Authentication → Sign In / Providers → Email**: si desactivas
   *Confirm email*, las cuentas nuevas entran al momento sin tener que abrir el correo.
5. **Project Settings → API**: copia la **Project URL** y la clave **anon public** y pégalas en
   `assets/js/cuenta-config.js`. La clave *anon* es pública por diseño (la protegen las reglas
   RLS del paso 2). **Nunca** pegues la clave `service_role`.
6. Sube el cambio a GitHub. En 1–2 minutos verás el botón «Entrar» funcionando.

## Cómo funciona

- Botón de cuenta en la barra superior → Entrar / Crear cuenta / He olvidado la contraseña.
- La sesión se guarda en el navegador (`persistSession`) y se renueva sola: sigues dentro hasta
  pulsar «Cerrar sesión».
- Cada vez que marcas o desmarcas una lección se guarda la fecha del cambio
  (`localStorage` → `cuaderno-ia:cambios:v1`). Al entrar, al volver a la pestaña y tras cada
  cambio, la web descarga tu progreso, lo **fusiona** (para cada lección gana el cambio más
  reciente) y lo vuelve a subir. Lo que hubieras marcado antes de tener cuenta se conserva.
- Archivos: `assets/js/cuenta.js` (lógica e interfaz), `assets/js/cuenta-config.js` (datos del
  proyecto), `assets/vendor/supabase/` (librería supabase-js 2.45.4, MIT, incluida en la web).
