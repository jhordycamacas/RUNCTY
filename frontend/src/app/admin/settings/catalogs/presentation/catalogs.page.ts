import { Component, inject, viewChildren } from '@angular/core';
import { IonButton, IonContent, IonSpinner } from '@ionic/angular';
import { HasUnsavedChanges } from '../../../../shared/forms/unsaved-changes.guard';
import { Notice } from '../../../../shared/ui/notice';
import { AdminHeader } from '../../../admin-header';
import { SettingsTabs } from '../../presentation/settings-tabs';
import { CatalogsStore } from '../application/catalogs.store';
import { CatalogEditor } from './catalog-editor';

/** The options the runner picks from in the sport profile, managed by the admin. */
@Component({
  selector: 'app-catalogs-page',
  imports: [AdminHeader, CatalogEditor, IonButton, IonContent, IonSpinner, Notice, SettingsTabs],
  template: `
    <app-admin-header title="Configuración" />
    <ion-content class="ion-padding">
      <app-settings-tabs />
      @if (store.items('sportLevels') && store.items('sportGoals')) {
        <div class="editors">
          <app-catalog-editor
            catalogId="sportLevels"
            title="Niveles deportivos"
            description="Lo que el corredor elige como su nivel en el perfil deportivo."
          />
          <app-catalog-editor
            catalogId="sportGoals"
            title="Objetivos deportivos"
            description="Lo que el corredor puede marcar como sus objetivos (puede elegir varios)."
          />
        </div>
      } @else if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
        </div>
      } @else {
        <p class="state muted" role="status">
          <ion-spinner name="crescent" /> Cargando las opciones…
        </p>
      }
    </ion-content>
  `,
  styles: `
    .editors {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-lg);
      max-width: 64rem;
    }

    .state {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
    }

    .muted {
      color: var(--rc-text-muted);
    }
  `,
})
export class CatalogsPage implements HasUnsavedChanges {
  protected readonly store = inject(CatalogsStore);
  private readonly editors = viewChildren(CatalogEditor);

  constructor() {
    void this.store.load();
  }

  hasUnsavedChanges(): boolean {
    return this.editors().some((editor) => editor.hasUnsavedChanges());
  }
}
