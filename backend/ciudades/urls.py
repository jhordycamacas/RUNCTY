from rest_framework.routers import DefaultRouter

from .views import CiudadViewSet, ZonaViewSet

router = DefaultRouter()
router.register('ciudades', CiudadViewSet)
router.register('zonas', ZonaViewSet)

urlpatterns = router.urls
