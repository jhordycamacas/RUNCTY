import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { HttpSummaryRepository } from './http-summary.repository';

describe('HttpSummaryRepository', () => {
  it('reads the summary endpoint and maps the answer to the domain', async () => {
    const api = {
      get: vi.fn().mockReturnValue(of({ truncated: true, cities: { cities: 2, zones: 0 } })),
    };
    TestBed.configureTestingModule({
      providers: [HttpSummaryRepository, { provide: ApiClient, useValue: api }],
    });

    const summary = await TestBed.inject(HttpSummaryRepository).get();

    expect(api.get).toHaveBeenCalledWith('/admin/summary');
    expect(summary.truncated).toBe(true);
    expect(summary.cities).toEqual({ cities: 2, zones: 0 });
  });
});
