import { act, renderHook } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useBackup } from '../useBackup';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { document: 'doc', cache: 'cache' } }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-print', () => ({}));
jest.mock('@/data/repositories/settingsRepository', () => ({ SETTING_KEYS: {}, settingsRepository: { get: jest.fn().mockResolvedValue(null), set: jest.fn() } }));
jest.mock('@/data/backup/backup', () => ({ createBackup: jest.fn(), parseBackup: jest.fn(), restoreBackup: jest.fn() }));

describe('restaurar backup', () => {
  it('mostra uma mensagem quando o arquivo escolhido não pode ser lido', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///ruim.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => { throw new Error('ilegível'); } }) as never);
    const { result } = await renderHook(() => useBackup());

    await act(async () => result.current.importBackup());

    expect(result.current.message?.tone).toBe('negative');
  });
});
