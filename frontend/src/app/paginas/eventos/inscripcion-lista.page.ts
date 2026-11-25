import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/inscripciones/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-inscripcion-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class InscripcionListaPage {
  protected readonly entidad = ENTIDADES.inscripciones;
}
