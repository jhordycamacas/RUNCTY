import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/contactos-confianza/) o editar (PUT /api/contactos-confianza/:id/) un contacto de confianza. */
@Component({
  selector: 'app-contacto-confianza-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class ContactoConfianzaFormPage {
  /** Parámetro :id de la URL; vacío en /contactos-confianza/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['contactos-confianza'];
}
