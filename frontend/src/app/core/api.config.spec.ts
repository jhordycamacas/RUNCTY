import { urlApi, urlApiPara } from './api.config';

describe('urlApiPara', () => {
  it('en el navegador usa 127.0.0.1', () => {
    expect(urlApiPara('web')).toBe('http://127.0.0.1:8000/api');
  });

  it('en Android usa 10.0.2.2 (la PC vista desde el emulador)', () => {
    expect(urlApiPara('android')).toBe('http://10.0.2.2:8000/api');
  });

  it('en un teléfono real usa la IP configurada', () => {
    expect(urlApiPara('android', '192.168.1.50')).toBe('http://192.168.1.50:8000/api');
  });

  it('urlApi detecta la plataforma actual (web en las pruebas)', () => {
    expect(urlApi()).toBe('http://127.0.0.1:8000/api');
  });
});
