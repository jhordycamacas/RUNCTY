import { Component } from '@angular/core';
import { StatusPage } from '../shared/components/status-page';

/** Landing of an administrator whose role opens no section yet. */
@Component({
  selector: 'app-admin-no-sections-page',
  imports: [StatusPage],
  template: `
    <app-status-page
      icon="shield-outline"
      title="Sin secciones asignadas"
      message="Tu rol puede entrar a la administración, pero aún no tiene permisos para ninguna sección. Pide a un administrador que revise tu rol."
      actionLabel="Ir a la app"
      actionLink="/app"
    />
  `,
})
export class NoSectionsPage {}
