import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/contactos-confianza/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-contacto-confianza-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class ContactoConfianzaListaPage {
  protected readonly entidad = ENTIDADES['contactos-confianza'];
}
