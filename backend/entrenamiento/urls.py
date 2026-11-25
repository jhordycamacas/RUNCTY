from rest_framework.routers import DefaultRouter

from .views import EntrenamientoViewSet, MetaPersonalViewSet

router = DefaultRouter()
router.register('entrenamientos', EntrenamientoViewSet)
router.register('metas', MetaPersonalViewSet)

urlpatterns = router.urls
