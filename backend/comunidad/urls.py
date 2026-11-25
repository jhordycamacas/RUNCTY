from rest_framework.routers import DefaultRouter

from .views import (
    FavoritaViewSet, NotificacionViewSet, ReporteComunitarioViewSet, RetoViewSet,
    SolicitudCompaneroViewSet, ValoracionViewSet,
)

router = DefaultRouter()
router.register('favoritas', FavoritaViewSet)
router.register('valoraciones', ValoracionViewSet)
router.register('retos', RetoViewSet)
router.register('reportes-comunitarios', ReporteComunitarioViewSet)
router.register('notificaciones', NotificacionViewSet)
router.register('solicitudes-companero', SolicitudCompaneroViewSet)

urlpatterns = router.urls
