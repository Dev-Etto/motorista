import { act, renderHook } from '@testing-library/react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { backupMarket, parseBackup, restoreBackup } from '@data/backup/backup';
import { settingsRepository } from '@data/repositories/settingsRepository';
import { applyRestoredState } from '@features/settings/afterRestore';
import { useBackup } from '@features/settings/useBackup';
import { shareTextFile } from '@shared/platform/share';
import { confirmAction, showDialog } from '@shared/ui/dialog';

jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ File: jest.fn(), Paths: { document: 'doc', cache: 'cache' } }));
jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));
jest.mock('expo-sharing', () => ({}));
jest.mock('expo-print', () => ({}));
jest.mock('@data/repositories/settingsRepository', () => ({
  SETTING_KEYS: { lastBackupAt: 'last_backup_at' },
  settingsRepository: { get: jest.fn().mockResolvedValue(null), set: jest.fn() },
}));
jest.mock('@data/backup/backup', () => ({
  backupMarket: jest.fn().mockReturnValue(null),
  createBackup: jest.fn().mockResolvedValue({}),
  parseBackup: jest.fn(),
  restoreBackup: jest.fn(),
}));
jest.mock('@shared/ui/dialog', () => ({ confirmAction: jest.fn(), showDialog: jest.fn() }));
jest.mock('@shared/platform/share', () => ({ shareTextFile: jest.fn() }));
jest.mock('@modules/copilot', () => ({ copilot: { exportState: jest.fn() } }));
jest.mock('@features/settings/afterRestore', () => ({ applyRestoredState: jest.fn().mockResolvedValue(undefined) }));

describe('fazer backup', () => {
  const answer = async (index: number) => {
    const options = jest.mocked(showDialog).mock.calls.at(-1)?.[0];
    await act(async () => options?.actions[index]?.onPress?.());
  };

  beforeEach(() => jest.clearAllMocks());

  it('só marca o backup como feito quando o arquivo foi salvo', async () => {
    const { result } = await renderHook(() => useBackup());
    await act(async () => result.current.exportBackup());

    expect(shareTextFile).toHaveBeenCalled();
    expect(settingsRepository.set).not.toHaveBeenCalled();
    await answer(1);
    expect(settingsRepository.set).toHaveBeenCalledWith('last_backup_at', expect.any(String));
    expect(result.current.message?.tone).toBe('positive');
  });

  it('sem salvar, não marca o backup e explica como tentar de novo', async () => {
    const { result } = await renderHook(() => useBackup());
    await act(async () => result.current.exportBackup());

    await answer(0);
    expect(settingsRepository.set).not.toHaveBeenCalled();
    expect(result.current.message?.tone).toBe('negative');
  });
});

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
    jest.mocked(File).mockImplementation(
      () =>
        ({
          textSync: () => {
            throw new Error('ilegível');
          },
        }) as never,
    );
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

  it('pede confirmação antes de restaurar um backup de outro país', async () => {
    jest.mocked(restoreBackup).mockClear();
    jest.mocked(DocumentPicker.getDocumentAsync).mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///usd.json' }] } as never);
    jest.mocked(File).mockImplementation(() => ({ textSync: () => '{}', exists: false, create: jest.fn(), write: jest.fn() }) as never);
    jest.mocked(parseBackup).mockReturnValue({ ok: true, backup: { tables: {} } } as never);
    jest.mocked(backupMarket).mockReturnValueOnce('XX' as never);
    const { result } = await renderHook(() => useBackup());

    await act(async () => result.current.importBackup());

    expect(restoreBackup).not.toHaveBeenCalled();
    expect(jest.mocked(confirmAction).mock.calls[0]?.[0].title).toBe('Restaurar de outro país?');

    await act(async () => jest.mocked(confirmAction).mock.calls[0]?.[0].onConfirm());
    expect(restoreBackup).toHaveBeenCalledTimes(1);
  });
});
