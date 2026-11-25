from rest_framework.routers import DefaultRouter

from .views import (
    AlertaZonaViewSet, FactorRiesgoViewSet, FranjaHorariaViewSet, FuenteInformacionViewSet,
    IncidenteViewSet, SolicitudRutaSeguraViewSet,
)

router = DefaultRouter()
router.register('franjas-horarias', FranjaHorariaViewSet)
router.register('factores-riesgo', FactorRiesgoViewSet)
router.register('alertas-zona', AlertaZonaViewSet)
router.register('fuentes-informacion', FuenteInformacionViewSet)
router.register('incidentes', IncidenteViewSet)
router.register('solicitudes-ruta-segura', SolicitudRutaSeguraViewSet)

urlpatterns = router.urls
