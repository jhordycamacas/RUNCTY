import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/perfiles-deportivos/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-perfil-deportivo-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class PerfilDeportivoListaPage {
  protected readonly entidad = ENTIDADES['perfiles-deportivos'];
}
