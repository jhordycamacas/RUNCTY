from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

admin.site.site_header = 'RUNCTY - Administración'
admin.site.site_title = 'RUNCTY'
admin.site.index_title = 'Gestión de datos'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='docs'),
    path('api/', include('usuarios.urls')),
    path('api/', include('ciudades.urls')),
    path('api/', include('rutas.urls')),
    path('api/', include('seguridad.urls')),
    path('api/', include('seguridad_personal.urls')),
    path('api/', include('entrenamiento.urls')),
    path('api/', include('comunidad.urls')),
    path('api/', include('clubes.urls')),
    path('api/', include('eventos.urls')),
    path('api/', include('publicidad.urls')),
]
