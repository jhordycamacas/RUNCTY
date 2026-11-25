import { Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton } from '@ionic/angular';

import { ENTIDADES } from '../../core/entidades';
import { SolicitudRutaSegura } from '../../core/modelos';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';
import { SeguridadFranjasComponent } from '../compartido/seguridad-franjas.component';

/**
 * Solicitar una ruta segura (RF-09): al crear, el backend devuelve `rutas_recomendadas`
 * ordenadas por seguridad y la página las muestra sin salir del formulario.
 */
@Component({
  selector: 'app-solicitud-ruta-segura-form',
  imports: [FormularioEntidadComponent, SeguridadFranjasComponent, RouterLink, IonButton],
  template: `
    <app-formulario-entidad [entidad]="entidad" [id]="id()" [navegarAlGuardar]="!!id()"
      (guardado)="resultado.set($any($event))">
      @if (resultado(); as solicitud) {
        <app-seguridad-franjas titulo="Rutas recomendadas (de la más a la menos segura)" [enlazarRuta]="true"
          [items]="solicitud.rutas_recomendadas"
          vacio="No hay rutas con franjas que cubran esa hora en la ciudad." />
        <ion-button fill="outline" expand="block" [routerLink]="['/solicitudes-ruta-segura', solicitud.id]">
          Ver la solicitud guardada
        </ion-button>
      }
    </app-formulario-entidad>
  `,
})
export class SolicitudRutaSeguraFormPage {
  /** Parámetro :id de la URL; vacío en /solicitudes-ruta-segura/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['solicitudes-ruta-segura'];
  protected readonly resultado = signal<SolicitudRutaSegura | null>(null);
}
