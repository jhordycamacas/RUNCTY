import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/** Switch between the two screens of Configuración: the parameters and the sport profile options. */
@Component({
  selector: 'app-settings-tabs',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav aria-label="Secciones de configuración">
      <a
        routerLink="/admin/configuracion"
        routerLinkActive="active"
        ariaCurrentWhenActive="page"
        [routerLinkActiveOptions]="{ exact: true }"
        >Parámetros</a
      >
      <a routerLink="/admin/configuracion/opciones" routerLinkActive="active" ariaCurrentWhenActive="page"
        >Opciones del perfil deportivo</a
      >
    </nav>
  `,
  styles: `
    nav {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-sm);
      margin-bottom: var(--rc-space-lg);
    }

    a {
      display: inline-flex;
      align-items: center;
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      color: var(--rc-text);
      font-weight: 500;
      text-decoration: none;
    }

    a.active {
      border-color: var(--rc-primary);
      background: color-mix(in srgb, var(--rc-primary) 16%, transparent);
      font-weight: 700;
    }
  `,
})
export class SettingsTabs {}
