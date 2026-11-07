import { act, renderHook } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { parseBackup, restoreBackup } from '@/data/backup/backup';
import { applyRestoredState } from '../afterRestore';
import { useBackup } from '../useBackup';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { document: 'doc', cache: 'cache' } }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-print', () => ({}));
jest.mock('@/data/repositories/settingsRepository', () => ({ SETTING_KEYS: {}, settingsRepository: { get: jest.fn().mockResolvedValue(null), set: jest.fn() } }));
jest.mock('@/data/backup/backup', () => ({ createBackup: jest.fn().mockResolvedValue({}), parseBackup: jest.fn(), restoreBackup: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { exportState: jest.fn() } }));
jest.mock('../afterRestore', () => ({ applyRestoredState: jest.fn().mockResolvedValue(undefined) }));

describe('restaurar backup', () => {
  it('mostra uma mensagem quando o seletor de arquivo falha', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockRejectedValue(new Error('sem seletor'));
    const { result } = await renderHook(() => useBackup());

    await act(async () => result.current.importBackup());

    expect(result.current.message?.tone).toBe('negative');
  });

  it('dois toques seguidos restauram uma vez só', async () => {
    jest.mocked(restoreBackup).mockClear();
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///ok.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => '{}', exists: false, create: jest.fn(), write: jest.fn() }) as never);
    jest.mocked(parseBackup).mockReturnValue({ ok: true, backup: { tables: {} } } as never);
    const { result } = await renderHook(() => useBackup());

    await act(async () => {
      void result.current.importBackup();
      void result.current.importBackup();
    });

    expect(restoreBackup).toHaveBeenCalledTimes(1);
  });

  it('mostra uma mensagem quando o arquivo escolhido não pode ser lido', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///ruim.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => { throw new Error('ilegível'); } }) as never);
    const { result } = await renderHook(() => useBackup());

    await act(async () => result.current.importBackup());

    expect(result.current.message?.tone).toBe('negative');
  });

  it('guarda uma cópia, restaura, aplica o estado e permite desfazer', async () => {
    const write = jest.fn();
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///ok.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => '{}', exists: false, create: jest.fn(), write }) as never);
    jest.mocked(parseBackup).mockReturnValue({ ok: true, backup: { tables: {} } } as never);
    const { result } = await renderHook(() => useBackup());
    expect(result.current.canUndo).toBe(false);

    await act(async () => result.current.importBackup());

    expect(write).toHaveBeenCalled();
    expect(restoreBackup).toHaveBeenCalled();
    expect(applyRestoredState).toHaveBeenCalled();
    expect(result.current.canUndo).toBe(true);
    expect(result.current.message?.tone).toBe('positive');
  });

  it('restauração concluída não vira falha se os lembretes não voltarem', async () => {
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///ok.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => '{}', exists: false, create: jest.fn(), write: jest.fn() }) as never);
    jest.mocked(parseBackup).mockReturnValue({ ok: true, backup: { tables: {} } } as never);
    jest.mocked(applyRestoredState).mockRejectedValueOnce(new Error('sem permissão'));
    const { result } = await renderHook(() => useBackup());

    await act(async () => result.current.importBackup());

    expect(result.current.message?.tone).toBe('positive');
    expect(result.current.message?.text).toContain('Confira os lembretes');
  });
});
