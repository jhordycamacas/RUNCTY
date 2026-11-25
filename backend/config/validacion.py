"""Une la validación de los modelos (clean) con la de los serializadores."""
import copy

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class ModeloValidadoSerializer(serializers.ModelSerializer):
    """ModelSerializer que además ejecuta Modelo.clean().

    Las reglas de negocio viven una sola vez en el modelo (clean) y se aplican
    igual desde la API y desde el admin de Django.
    """

    def validate(self, datos):
        datos = super().validate(datos)
        instancia = copy.copy(self.instance) if self.instance is not None else self.Meta.model()
        for campo, valor in datos.items():
            setattr(instancia, campo, valor)
        try:
            instancia.clean()
        except DjangoValidationError as error:
            if hasattr(error, 'error_dict'):
                raise serializers.ValidationError(error.message_dict)
            raise serializers.ValidationError({'non_field_errors': error.messages})
        return datos
