from rest_framework.routers import DefaultRouter

from .views import (
    ClubViewSet, MembresiaViewSet, PuntoEncuentroViewSet, RutaClubViewSet, SalidaGrupalViewSet,
)

router = DefaultRouter()
router.register('clubes', ClubViewSet)
router.register('membresias', MembresiaViewSet)
router.register('rutas-club', RutaClubViewSet)
router.register('puntos-encuentro', PuntoEncuentroViewSet)
router.register('salidas-grupales', SalidaGrupalViewSet)

urlpatterns = router.urls
