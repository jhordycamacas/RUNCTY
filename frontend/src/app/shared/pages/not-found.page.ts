import { Component } from '@angular/core';
import { StatusPage } from '../components/status-page';

@Component({
  selector: 'app-not-found-page',
  imports: [StatusPage],
  template: `
    <app-status-page
      icon="map-outline"
      title="Página no encontrada"
      message="La dirección que buscas no existe o fue movida."
    />
  `,
})
export class NotFoundPage {}
