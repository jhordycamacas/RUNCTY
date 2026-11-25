import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/puntos-encuentro/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-punto-encuentro-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class PuntoEncuentroListaPage {
  protected readonly entidad = ENTIDADES['puntos-encuentro'];
}
