import { pendingItems } from '@features/dashboard/pendingItems';

describe('pendências do Início', () => {
  it('junta lembretes, backup e atualização numa lista só', () => {
    const items = pendingItems({ dueKmReminders: [{ id: 3, title: 'Óleo' }], backupDue: true, updateDue: true });
    expect(items).toEqual([{ kind: 'reminder', id: 3, title: 'Óleo' }, { kind: 'backup' }, { kind: 'update' }]);
  });

  it('sem pendências, a lista fica vazia', () => {
    expect(pendingItems({ dueKmReminders: [], backupDue: false, updateDue: false })).toEqual([]);
  });
});
