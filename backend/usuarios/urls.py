from rest_framework.routers import DefaultRouter

from .views import PerfilDeportivoViewSet, PreferenciaViewSet, RolViewSet, UsuarioViewSet

router = DefaultRouter()
router.register('roles', RolViewSet)
router.register('usuarios', UsuarioViewSet)
router.register('perfiles-deportivos', PerfilDeportivoViewSet)
router.register('preferencias', PreferenciaViewSet)

urlpatterns = router.urls
