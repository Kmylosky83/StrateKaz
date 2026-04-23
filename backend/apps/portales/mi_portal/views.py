"""
Mi Portal — Employee Self-Service (ESS).

Vistas que permiten al empleado:
- Ver su perfil y actualizar datos personales

Seguridad: Todas las vistas filtran por request.user, nunca aceptan IDs del
cliente para acceder a datos de otros.

Arquitectura: Mi Portal es un PORTAL (solo UI + API de lectura/escritura
de datos propios). No tiene modelos propios. Consume de:
- apps.mi_equipo.colaboradores (Colaborador, InfoPersonal)
- apps.core (User, impersonation)

Cuando se activen módulos L60+ (novedades, nómina, formación, desempeño),
sus endpoints ESS se agregan aquí como nuevas vistas.
"""
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.utils.impersonation import get_effective_user

from .serializers import ColaboradorESSSerializer, InfoPersonalUpdateESSSerializer

logger = logging.getLogger('apps')


class MiPerfilView(APIView):
    """GET: Ver perfil propio. PUT: Actualizar datos personales."""
    permission_classes = [IsAuthenticated]

    def _get_colaborador(self, user):
        """Obtiene el colaborador asociado al usuario actual."""
        if hasattr(user, 'colaborador'):
            return user.colaborador
        from apps.mi_equipo.colaboradores.models import Colaborador
        return Colaborador.objects.filter(usuario=user, is_active=True).first()

    def get(self, request):
        try:
            colaborador = self._get_colaborador(get_effective_user(request))
            if not colaborador:
                return Response(
                    {'error': 'No tiene un perfil de colaborador asociado.'},
                    status=status.HTTP_404_NOT_FOUND
                )
            serializer = ColaboradorESSSerializer(colaborador, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.error(f'mi-perfil GET error: {type(e).__name__}: {e}', exc_info=True)
            return Response(
                {'error': f'{type(e).__name__}: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        colaborador = self._get_colaborador(get_effective_user(request))
        if not colaborador:
            return Response(
                {'error': 'No tiene un perfil de colaborador asociado.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = InfoPersonalUpdateESSSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Campos directos en Colaborador
        colaborador_dirty = False
        if 'celular' in data:
            colaborador.telefono_movil = data['celular']
            colaborador_dirty = True
        if 'email_personal' in data:
            colaborador.email_personal = data['email_personal']
            colaborador_dirty = True

        if colaborador_dirty:
            colaborador.updated_by = request.user
            colaborador.save(
                update_fields=['telefono_movil', 'email_personal', 'updated_by', 'updated_at']
            )

        # Campos en InfoPersonal (OneToOne via info_personal)
        INFO_FIELD_MAP = {
            'telefono': 'telefono_fijo',
            'direccion': 'direccion',
            'ciudad': 'ciudad',
            'contacto_emergencia_nombre': 'nombre_contacto_emergencia',
            'contacto_emergencia_telefono': 'telefono_contacto_emergencia',
            'contacto_emergencia_parentesco': 'parentesco_contacto_emergencia',
        }
        info_updates = {
            INFO_FIELD_MAP[k]: v
            for k, v in data.items()
            if k in INFO_FIELD_MAP
        }

        if info_updates:
            from apps.mi_equipo.colaboradores.models import InfoPersonal
            info_personal, _ = InfoPersonal.objects.get_or_create(
                colaborador=colaborador,
                defaults={
                    'empresa': colaborador.empresa,
                    'created_by': request.user,
                    'updated_by': request.user,
                },
            )
            for field, value in info_updates.items():
                setattr(info_personal, field, value)
            info_personal.updated_by = request.user
            info_personal.save(
                update_fields=list(info_updates.keys()) + ['updated_by', 'updated_at']
            )

        colaborador.refresh_from_db()
        return Response(
            ColaboradorESSSerializer(colaborador, context={'request': request}).data
        )
