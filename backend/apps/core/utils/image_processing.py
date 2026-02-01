"""
Utilidades de Procesamiento de Imágenes para PWA/Branding
Sistema de Gestión StrateKaz

MB-003: Procesamiento de imágenes con Pillow
- Redimensionamiento
- Optimización
- Generación de iconos PWA
"""
import io
from pathlib import Path
from PIL import Image
from django.core.files.base import ContentFile


class ImageProcessor:
    """
    Procesador de imágenes para branding y PWA.

    Uso:
        processor = ImageProcessor()

        # Redimensionar imagen
        resized = processor.resize(image_file, width=192, height=192)

        # Generar iconos PWA
        icons = processor.generate_pwa_icons(image_file)
    """

    # Tamaños estándar para iconos PWA
    PWA_ICON_SIZES = [
        (72, 72),
        (96, 96),
        (128, 128),
        (144, 144),
        (152, 152),
        (192, 192),
        (384, 384),
        (512, 512),
    ]

    # Tamaños requeridos mínimos
    PWA_REQUIRED_SIZES = [
        (192, 192),
        (512, 512),
    ]

    # Calidad de compresión por formato
    COMPRESSION_QUALITY = {
        'JPEG': 85,
        'PNG': 6,  # Nivel de compresión PNG (0-9)
        'WEBP': 80,
    }

    def __init__(self, max_size_mb: float = 5.0):
        """
        Inicializa el procesador.

        Args:
            max_size_mb: Tamaño máximo permitido en MB
        """
        self.max_size_bytes = int(max_size_mb * 1024 * 1024)

    def _open_image(self, image_file) -> Image.Image:
        """Abre un archivo de imagen y lo convierte a RGBA si es necesario."""
        img = Image.open(image_file)

        # Convertir a RGBA para mantener transparencia
        if img.mode in ('P', 'LA') or (img.mode == 'RGBA' and img.info.get('transparency')):
            img = img.convert('RGBA')
        elif img.mode != 'RGBA':
            img = img.convert('RGB')

        return img

    def resize(
        self,
        image_file,
        width: int,
        height: int = None,
        maintain_aspect: bool = True,
        fill_color: tuple = (255, 255, 255, 0)
    ) -> ContentFile:
        """
        Redimensiona una imagen.

        Args:
            image_file: Archivo de imagen (file-like object)
            width: Ancho deseado
            height: Alto deseado (si None, se calcula manteniendo proporción)
            maintain_aspect: Si True, mantiene proporción original
            fill_color: Color de relleno si no mantiene proporción (RGBA)

        Returns:
            ContentFile con la imagen redimensionada
        """
        img = self._open_image(image_file)

        if height is None:
            height = width

        if maintain_aspect:
            # Mantener proporción y centrar
            img.thumbnail((width, height), Image.Resampling.LANCZOS)

            # Crear imagen de fondo del tamaño exacto
            if img.size != (width, height):
                background = Image.new('RGBA', (width, height), fill_color)
                # Centrar la imagen
                offset = ((width - img.size[0]) // 2, (height - img.size[1]) // 2)
                background.paste(img, offset, img if img.mode == 'RGBA' else None)
                img = background
        else:
            # Redimensionar exacto (puede distorsionar)
            img = img.resize((width, height), Image.Resampling.LANCZOS)

        # Guardar en buffer
        buffer = io.BytesIO()
        img_format = 'PNG' if img.mode == 'RGBA' else 'JPEG'

        if img_format == 'PNG':
            img.save(buffer, format='PNG', optimize=True)
        else:
            img = img.convert('RGB')
            img.save(buffer, format='JPEG', quality=self.COMPRESSION_QUALITY['JPEG'])

        buffer.seek(0)
        ext = 'png' if img_format == 'PNG' else 'jpg'
        return ContentFile(buffer.read(), name=f'resized_{width}x{height}.{ext}')

    def optimize(self, image_file, max_width: int = 1920, quality: int = 85) -> ContentFile:
        """
        Optimiza una imagen reduciendo tamaño y comprimiendo.

        Args:
            image_file: Archivo de imagen
            max_width: Ancho máximo permitido
            quality: Calidad de compresión (1-100)

        Returns:
            ContentFile con la imagen optimizada
        """
        img = self._open_image(image_file)

        # Redimensionar si excede el ancho máximo
        if img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Guardar optimizado
        buffer = io.BytesIO()

        if img.mode == 'RGBA':
            img.save(buffer, format='PNG', optimize=True)
            ext = 'png'
        else:
            img = img.convert('RGB')
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            ext = 'jpg'

        buffer.seek(0)
        return ContentFile(buffer.read(), name=f'optimized.{ext}')

    def generate_pwa_icons(
        self,
        image_file,
        sizes: list = None,
        include_maskable: bool = True,
        maskable_padding: float = 0.1
    ) -> dict:
        """
        Genera iconos PWA en múltiples tamaños.

        Args:
            image_file: Archivo de imagen fuente (recomendado: 512x512 o mayor)
            sizes: Lista de tuplas (width, height). Si None, usa PWA_REQUIRED_SIZES
            include_maskable: Si True, genera también versión maskable
            maskable_padding: Porcentaje de padding para maskable (0.1 = 10%)

        Returns:
            Dict con los iconos generados:
            {
                '192x192': ContentFile,
                '512x512': ContentFile,
                '512x512_maskable': ContentFile,  # si include_maskable=True
            }
        """
        if sizes is None:
            sizes = self.PWA_REQUIRED_SIZES

        img = self._open_image(image_file)
        icons = {}

        for width, height in sizes:
            # Generar icono estándar
            icon = self._create_icon(img, width, height)
            icons[f'{width}x{height}'] = icon

            # Generar versión maskable
            if include_maskable:
                maskable = self._create_maskable_icon(img, width, height, maskable_padding)
                icons[f'{width}x{height}_maskable'] = maskable

        return icons

    def _create_icon(self, img: Image.Image, width: int, height: int) -> ContentFile:
        """Crea un icono de tamaño específico."""
        # Crear copia y redimensionar
        icon = img.copy()
        icon.thumbnail((width, height), Image.Resampling.LANCZOS)

        # Crear fondo transparente del tamaño exacto
        if icon.size != (width, height):
            background = Image.new('RGBA', (width, height), (255, 255, 255, 0))
            offset = ((width - icon.size[0]) // 2, (height - icon.size[1]) // 2)
            background.paste(icon, offset, icon if icon.mode == 'RGBA' else None)
            icon = background

        # Guardar como PNG
        buffer = io.BytesIO()
        icon.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)

        return ContentFile(buffer.read(), name=f'icon-{width}x{height}.png')

    def _create_maskable_icon(
        self,
        img: Image.Image,
        width: int,
        height: int,
        padding: float
    ) -> ContentFile:
        """
        Crea un icono maskable con safe zone.

        Los iconos maskable requieren un padding del 10% en cada lado
        para garantizar que el contenido no se recorte en diferentes
        formas de iconos (circular, cuadrado, etc.)
        """
        # Calcular área segura (con padding)
        safe_width = int(width * (1 - 2 * padding))
        safe_height = int(height * (1 - 2 * padding))

        # Redimensionar imagen al área segura
        icon = img.copy()
        icon.thumbnail((safe_width, safe_height), Image.Resampling.LANCZOS)

        # Crear fondo del tamaño completo
        background = Image.new('RGBA', (width, height), (255, 255, 255, 255))

        # Centrar la imagen en el fondo
        offset = ((width - icon.size[0]) // 2, (height - icon.size[1]) // 2)
        background.paste(icon, offset, icon if icon.mode == 'RGBA' else None)

        # Guardar como PNG
        buffer = io.BytesIO()
        background.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)

        return ContentFile(buffer.read(), name=f'icon-{width}x{height}-maskable.png')

    def validate_image(self, image_file) -> tuple:
        """
        Valida una imagen para uso como icono PWA.

        Args:
            image_file: Archivo de imagen

        Returns:
            Tuple (is_valid: bool, errors: list)
        """
        errors = []

        try:
            img = Image.open(image_file)

            # Verificar formato
            if img.format not in ('PNG', 'JPEG', 'WEBP'):
                errors.append(f'Formato {img.format} no soportado. Use PNG, JPEG o WEBP.')

            # Verificar tamaño mínimo
            if img.width < 512 or img.height < 512:
                errors.append('La imagen debe ser al menos 512x512 píxeles.')

            # Verificar proporción (debe ser cuadrada o casi)
            ratio = img.width / img.height
            if ratio < 0.9 or ratio > 1.1:
                errors.append('La imagen debe ser cuadrada (proporción 1:1).')

            # Verificar tamaño de archivo
            image_file.seek(0, 2)  # Ir al final
            size = image_file.tell()
            image_file.seek(0)  # Volver al inicio

            if size > self.max_size_bytes:
                max_mb = self.max_size_bytes / (1024 * 1024)
                errors.append(f'La imagen excede el tamaño máximo de {max_mb} MB.')

        except Exception as e:
            errors.append(f'Error al procesar la imagen: {str(e)}')

        return len(errors) == 0, errors


# Instancia singleton para uso directo
image_processor = ImageProcessor()
