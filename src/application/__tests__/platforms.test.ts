import { monitoredPackagesOf } from '@application/platforms';

describe('plataformas do Copiloto', () => {
  it('lê só os apps ativos que têm Copiloto', () => {
    const packages = monitoredPackagesOf([
      { id: 1, name: 'Uber', key: 'uber', active: true },
      { id: 2, name: '99', key: 'ninetyNine', active: false },
      { id: 3, name: 'inDrive', key: 'inDrive', active: true },
      { id: 4, name: 'Outros', key: 'other', active: true },
      { id: 5, name: 'Lalamove', key: null, active: true },
    ]);
    expect(packages).toEqual(['com.ubercab.driver', 'sinet.startup.inDriver']);
  });
});
