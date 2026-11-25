from rest_framework.routers import DefaultRouter

from .views import PuntoApoyoViewSet, RutaViewSet, SenderoResguardadoViewSet, TramoViewSet

router = DefaultRouter()
router.register('rutas', RutaViewSet)
router.register('tramos', TramoViewSet)
router.register('puntos-apoyo', PuntoApoyoViewSet)
router.register('senderos-resguardados', SenderoResguardadoViewSet)

urlpatterns = router.urls
