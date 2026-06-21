# Reporte Graphify - simplificacion y capas

Fecha: 2026-06-21  
Base del grafo: commit `8d0b4aa6`  
Estado del corpus: 156 archivos, ~101,944 palabras, 787 nodos, 1267 aristas, 62 comunidades

## Lectura corta

El codigo ya es funcional, pero sigue teniendo mezcla de responsabilidades. El mayor costo no esta en la logica de negocio sino en que el flujo de cliente, la infraestructura y varios adaptadores HTTP aparecen duplicados o parcialmente desacoplados.

Graphify marca como nucleos:
- `cn()` y `Button` en UI.
- `auth()` / `useSupabaseUser()` en autenticacion.
- `getSupabaseClient()` en acceso a datos.
- `GET()` / `POST()` como superficie de APIs.
- `createPhoneVerification()` en verificacion por WhatsApp.

## Flujos UX del cliente

### 1. Entrada comercial
Ruta:
- `/` -> `app/page.tsx`
- `/pricing` -> `app/pricing/page.tsx`
- `/registro` -> `app/registro/page.tsx`

Objetivo:
- explicar valor
- llevar a plan
- capturar RUT, negocio, email, password y telefono

Observacion:
- el flujo es claro, pero el formulario de registro hace demasiadas cosas: valida, crea usuario, crea tenant, dispara verificacion y guarda estado local.

### 2. Autenticacion
Ruta:
- `/login` -> `components/login-form.tsx`
- `lib/supabase-auth-client.tsx`
- `lib/supabase-browser.ts`

Objetivo:
- login por password
- OAuth Google
- reset de password

Observacion:
- la autenticacion ya quedo mucho mas limpia que antes, pero hay dos entrypoints de workspace y mas de una forma de resolver el usuario.

### 3. Onboarding
Ruta:
- `/dashboard/onboarding` -> `app/dashboard/onboarding/page.tsx`

Objetivo:
- mostrar QR
- mostrar plan
- empujar a pago o a operacion

Observacion:
- depende de `localStorage` para el tenant, lo que vuelve el flujo fragil y poco portable.

### 4. Pago
Ruta:
- `/pago` -> `app/pago/page.tsx`
- `/api/flow/create-order`
- `/api/flow/confirmation`

Objetivo:
- cobrar setup + mensualidad
- activar tenant al confirmar pago

Observacion:
- el flujo existe, pero sigue acoplado a estado local del navegador y a datos repetidos del plan.

### 5. Operacion
Ruta:
- `/workspace` -> `app/workspace/page.tsx`
- `components/workspace/WorkspaceLayout.tsx`
- `app/api/workspace/bootstrap/route.ts`

Objetivo:
- abrir consola operativa
- resolver tenant activo
- conectar WhatsApp, conversaciones y paneles

Observacion:
- aqui esta la mayor complejidad real del producto. El layout operativo junta bootstrap, seleccion de conversacion, estado WAHA, QR, tenant wizard y acceso a paneles.

## Donde si se puede simplificar

### A. Eliminar duplicados
1. `app/workspace/page.tsx` y `components/workspace/page.tsx` hacen casi lo mismo. Debe quedar uno.
2. `app/api/tenant/create/route.ts` y `app/api/tenants/create/route.ts` son dos caminos distintos para crear tenant. Debe quedar uno como canonico.
3. `app/dashboard/page.tsx` usa `mockTenant`. Si ya existe bootstrap real, ese mock sobra o debe quedar solo como story/demo aislada.
4. `components/tenant-wizard.tsx` repite una parte del alta que ya cubre `app/registro/page.tsx`.

### B. Separar por capas

#### Capa 1 - Presentacion
Solo UI y eventos:
- `app/page.tsx`
- `app/pricing/page.tsx`
- `app/login/page.tsx`
- `app/registro/page.tsx`
- `app/pago/page.tsx`
- `app/workspace/page.tsx`
- `components/workspace/*`

Regla:
- no hablar directo con Supabase ni con WAHA desde la UI, salvo clientes browser muy puntuales para auth.

#### Capa 2 - Casos de uso
Orquestacion de flujo:
- registrar cuenta
- iniciar sesion
- crear tenant
- enviar/verificar telefono
- crear orden Flow
- confirmar pago
- bootstrap de workspace

Estos casos de uso deben vivir en una capa unica, no repartidos entre `app/api/*` y componentes.

#### Capa 3 - Dominio
Reglas puras:
- `lib/plans.ts`
- validacion de RUT
- normalizacion de telefono
- reglas de estado de tenant
- estado de plan y limites

Debe ser codigo sin fetch, sin `window`, sin Supabase.

#### Capa 4 - Infraestructura
Adaptadores concretos:
- `lib/supabase.ts`
- `lib/supabase-browser.ts`
- `lib/supabase-server.ts`
- `lib/phone-verification.ts`
- `app/api/*`
- integraciones Flow, WAHA, Chatwoot, Hermes

Regla:
- aqui van `fetch`, credenciales, SDKs y mapeo de payloads.

## Riesgos de complejidad actual

1. `lib/supabase.ts` mezcla cliente, repositorio de tenants, helpers legacy y logging MCP. Ese archivo ya pide division.
2. `app/dashboard/onboarding/page.tsx` y `app/pago/page.tsx` dependen de `localStorage`. Eso rompe rehidratacion, soporte multi-dispositivo y trazabilidad server-side.
3. `WorkspaceLayout` junta orchestration de bootstrap con UI de conversaciones. Conviene mover bootstrap a hook o server loader.
4. Hay varias fuentes de verdad para tenant: RUT, `tenant_id`, `id` y `auth_user_id`. Debe existir una sola entidad principal por flujo.

## Recomendacion concreta

Si el objetivo es bajar complejidad sin romper lo que ya funciona, haria este orden:

1. Consolidar autenticacion en una sola ruta cliente y una sola capa de helpers browser/server.
2. Consolidar tenant creation en una sola API canonica.
3. Sacar `localStorage` del flujo principal y reemplazarlo por bootstrap server-side.
4. Separar `lib/supabase.ts` en repositorios:
   - `tenant-repository`
   - `payment-order-repository`
   - `mcp-invocation-repository`
5. Reducir `WorkspaceLayout` a composicion visual + hooks pequeños.
6. Borrar los entrypoints duplicados que quedaron como soporte transitorio.

## Conclusion

Si, es posible simplificar bastante. El producto ya tiene una columna vertebral clara, pero hoy el codigo mezcla:
- UI
- orquestacion
- persistencia
- integraciones externas
- y estados temporales del navegador

La mayor ganancia no esta en reescribir todo, sino en:
- unificar flujos
- sacar duplicados
- y partir la infraestructura en repositorios y casos de uso mas chicos.
