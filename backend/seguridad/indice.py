"""Índice de seguridad de RUNCTY (RF-07 y RF-09).

Regla: cada tramo parte de 100 puntos por franja horaria. Cada factor de riesgo
activo en esa franja resta según su severidad (baja -10, media -20, alta -35).
Niveles: Alto >= 70, Medio 40-69, Bajo < 40. La ruta toma el puntaje de su peor tramo.
"""
from .models import Severidad

PUNTAJE_INICIAL = 100
PENALIDAD = {Severidad.BAJA: 10, Severidad.MEDIA: 20, Severidad.ALTA: 35}
ALTO, MEDIO, BAJO = 'Alto', 'Medio', 'Bajo'


def nivel_por_puntaje(puntaje):
    if puntaje >= 70:
        return ALTO
    if puntaje >= 40:
        return MEDIO
    return BAJO


def puntaje_tramo(tramo, franja):
    """Devuelve (puntaje, factores activos) de un tramo en una franja."""
    factores = [f for f in tramo.factores.all() if f.franja_id == franja.id and f.activo]
    descuento = sum(PENALIDAD[f.severidad] for f in factores)
    return max(0, PUNTAJE_INICIAL - descuento), factores


def evaluar_ruta_en_franja(ruta, franja):
    """Puntaje de la ruta en una franja = puntaje de su peor tramo."""
    peor_puntaje, peores_factores, peor_tramo = PUNTAJE_INICIAL, [], None
    for tramo in ruta.tramos.all():
        puntaje, factores = puntaje_tramo(tramo, franja)
        if peor_tramo is None or puntaje < peor_puntaje:
            peor_puntaje, peores_factores, peor_tramo = puntaje, factores, tramo
    return {
        'franja': franja.id,
        'franja_nombre': franja.nombre,
        'hora_inicio': franja.hora_inicio.strftime('%H:%M'),
        'hora_fin': franja.hora_fin.strftime('%H:%M'),
        'puntaje': peor_puntaje,
        'nivel': nivel_por_puntaje(peor_puntaje),
        'tramo_critico': str(peor_tramo) if peor_tramo else None,
        'factores': [f'{f.get_tipo_display()} ({f.get_severidad_display()})' for f in peores_factores],
    }


def evaluar_ruta(ruta):
    """Índice de la ruta en cada una de sus franjas."""
    return [evaluar_ruta_en_franja(ruta, franja) for franja in ruta.franjas.all()]


def franja_para_hora(ruta, hora):
    for franja in ruta.franjas.all():
        if franja.hora_inicio <= hora < franja.hora_fin:
            return franja
    return None


def recomendar_rutas(rutas, hora, distancia_max_km=None):
    """Rutas evaluadas en la franja que cubre la hora, de la más segura a la menos segura."""
    recomendadas = []
    for ruta in rutas:
        if distancia_max_km is not None and ruta.distancia_km > distancia_max_km:
            continue
        franja = franja_para_hora(ruta, hora)
        if franja is None:
            continue
        evaluacion = evaluar_ruta_en_franja(ruta, franja)
        recomendadas.append(
            {'ruta': ruta.id, 'nombre': ruta.nombre, 'distancia_km': ruta.distancia_km, **evaluacion}
        )
    return sorted(recomendadas, key=lambda r: (-r['puntaje'], r['distancia_km']))
