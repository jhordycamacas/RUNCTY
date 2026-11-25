import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/senderos-resguardados/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-sendero-resguardado-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class SenderoResguardadoListaPage {
  protected readonly entidad = ENTIDADES['senderos-resguardados'];
}
