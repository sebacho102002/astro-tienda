# 📁 Configuración de Supabase Storage para Imágenes

## 🎯 Objetivo
Configurar Supabase Storage para permitir la subida de imágenes de productos desde el admin panel.

## 📋 Pasos de Configuración

### 1. Crear Bucket en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **Storage** en el sidebar
3. Crea un nuevo bucket:
   - **Nombre**: `product-images`
   - **Público**: ✅ Sí (para que las imágenes sean accesibles públicamente)

### 2. Configurar Políticas RLS (Row Level Security)

Necesitas configurar las políticas para permitir:
- **SELECT**: Lectura pública (cualquiera puede ver las imágenes)
- **INSERT**: Solo usuarios autenticados pueden subir
- **DELETE**: Solo usuarios autenticados pueden eliminar

#### Política SELECT (Lectura Pública):
```sql
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');
```

#### Política INSERT (Subida Autenticada):
```sql
CREATE POLICY "Authenticated can upload" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');
```

#### Política DELETE (Eliminación Autenticada):
```sql
CREATE POLICY "Authenticated can delete" ON storage.objects
FOR DELETE USING (bucket_id = 'product-images');
```

### 3. Configurar CORS (si es necesario)

Si tienes problemas de CORS, agrega estas reglas en Supabase:

```json
{
  "allowedOrigins": ["*"],
  "allowedMethods": ["GET", "POST", "PUT", "DELETE"],
  "allowedHeaders": ["*"],
  "maxAge": 3600
}
```

### 4. Verificar Variables de Entorno

Asegúrate de tener estas variables en tu `.env` y en Render:

```env
SUPABASE_URL=tu_supabase_url
SUPABASE_ANON_KEY=tu_supabase_anon_key
```

## 🔧 Funcionalidad Implementada

### Endpoint de Upload
- **Ruta**: `/api/upload/image`
- **Método**: POST
- **Acepta**: FormData con campo `file`
- **Límites**: 
  - Tamaño máximo: 5MB
  - Tipos permitidos: JPEG, PNG, WebP, GIF

### Página Admin
- **Pestañas**: URL o Archivo para cada imagen
- **Preview**: Vista previa inmediata de las imágenes
- **Progreso**: Barra de progreso durante la subida
- **Validación**: Tipo y tamaño de archivo

### Flujo de Trabajo
1. Usuario selecciona "Archivo" en lugar de "URL"
2. Elige una imagen desde su dispositivo
3. La imagen se sube automáticamente a Supabase Storage
4. Se obtiene la URL pública y se asigna al campo del formulario
5. Al enviar el formulario, se guarda la URL en la base de datos

## 🚨 Importante

- El bucket `product-images` **debe estar configurado como público**
- Las políticas RLS deben permitir SELECT público
- Las imágenes se almacenan con nombres únicos (timestamp + random)
- La URL se guarda en la base de datos como antes

## 🧪 Cómo Probar

1. Ve a `/admin/nuevo-producto`
2. En cualquier imagen, haz clic en la pestaña "📁 Archivo"
3. Selecciona una imagen desde tu dispositivo
4. Verifica que aparece el preview y la barra de progreso
5. Crea el producto y verifica que la imagen se muestra correctamente

## 🔍 Troubleshooting

### Error "bucket does not exist"
- Crear el bucket `product-images` en Supabase Storage
- Verificar que el nombre está bien escrito

### Error de permisos
- Verificar que las políticas RLS están configuradas
- Confirmar que el bucket es público

### Error de CORS
- Configurar CORS en Supabase para tu dominio
- Verificar que las variables de entorno están correctas

### Imágenes no se ven
- Verificar que el bucket es público
- Comprobar la URL generada en el log del servidor
- Confirmar que la política SELECT permite acceso público
