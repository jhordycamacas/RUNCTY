from rest_framework.routers import DefaultRouter

from .views import AlertaPanicoViewSet, ContactoConfianzaViewSet, UbicacionCompartidaViewSet

router = DefaultRouter()
router.register('contactos-confianza', ContactoConfianzaViewSet)
router.register('alertas-panico', AlertaPanicoViewSet)
router.register('ubicaciones-compartidas', UbicacionCompartidaViewSet)

urlpatterns = router.urls
