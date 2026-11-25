from rest_framework.routers import DefaultRouter

from .views import EventoViewSet, InscripcionViewSet

router = DefaultRouter()
router.register('eventos', EventoViewSet)
router.register('inscripciones', InscripcionViewSet)

urlpatterns = router.urls
