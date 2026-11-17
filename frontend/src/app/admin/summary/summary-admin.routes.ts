import { Routes } from '@angular/router';
import { SummaryStore } from './application/summary.store';
import { SummaryRepository } from './domain/summary';
import { HttpSummaryRepository } from './infrastructure/http-summary.repository';

/** The `resumen` admin section: analytics of the mobile app. */
export const SUMMARY_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [{ provide: SummaryRepository, useClass: HttpSummaryRepository }, SummaryStore],
    loadComponent: () => import('./presentation/summary.page').then((m) => m.SummaryPage),
  },
];
