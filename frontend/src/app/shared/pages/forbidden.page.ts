import { Component } from '@angular/core';
import { StatusPage } from '../components/status-page';

@Component({
  selector: 'app-forbidden-page',
  imports: [StatusPage],
  template: `
    <app-status-page
      icon="lock-closed-outline"
      title="No tienes acceso"
      message="Tu rol no incluye el permiso necesario para ver esta sección. Si crees que es un error, contacta a un administrador."
    />
  `,
})
export class ForbiddenPage {}
