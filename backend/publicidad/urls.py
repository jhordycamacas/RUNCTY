from rest_framework.routers import DefaultRouter

from .views import AnuncianteViewSet, CampanaViewSet

router = DefaultRouter()
router.register('anunciantes', AnuncianteViewSet)
router.register('campanas', CampanaViewSet)

urlpatterns = router.urls
