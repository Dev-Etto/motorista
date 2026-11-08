import { fieldOfError, kmFromEntry, stepOfError, validateShiftForm } from '@domain/shift/shiftForm';

const valid = {
  hasInvalidNumber: false,
  hasInvalidHours: false,
  hasInvalidHour: false,
  minutes: 480,
  grossCents: 20000,
  kmMode: 'manual' as const,
  km: 100,
  odometerTyped: false,
};

describe('km da jornada', () => {
  it('usa o km digitado no modo manual', () => {
    expect(kmFromEntry({ mode: 'manual', km: 120, odometerStart: null, odometerEnd: null })).toBe(120);
  });

  it('usa a diferença do odômetro', () => {
    expect(kmFromEntry({ mode: 'odometer', km: null, odometerStart: 1000, odometerEnd: 1150.5 })).toBe(150.5);
  });

  it('não aceita odômetro final menor que o inicial ou incompleto', () => {
    expect(kmFromEntry({ mode: 'odometer', km: null, odometerStart: 1000, odometerEnd: 900 })).toBeNull();
    expect(kmFromEntry({ mode: 'odometer', km: null, odometerStart: null, odometerEnd: 900 })).toBeNull();
  });
});

describe('validação da jornada', () => {
  it('aceita uma jornada completa', () => {
    expect(validateShiftForm(valid)).toBeNull();
  });

  it('aponta o primeiro problema na ordem em que aparece na tela', () => {
    expect(validateShiftForm({ ...valid, hasInvalidNumber: true, grossCents: 0 })).toBe('invalid-number');
    expect(validateShiftForm({ ...valid, hasInvalidHour: true })).toBe('invalid-start-hour');
    expect(validateShiftForm({ ...valid, hasInvalidHours: true, hasInvalidNumber: true })).toBe('invalid-hours');
    expect(validateShiftForm({ ...valid, minutes: 25 * 60 })).toBe('too-long');
    expect(validateShiftForm({ ...valid, grossCents: 0 })).toBe('no-earnings');
    expect(validateShiftForm({ ...valid, kmMode: 'odometer', km: null, odometerTyped: true })).toBe('odometer-order');
  });

  it('aceita odômetro em branco', () => {
    expect(validateShiftForm({ ...valid, kmMode: 'odometer', km: null, odometerTyped: false })).toBeNull();
  });
});

describe('campo de cada erro', () => {
  it('liga o erro ao campo que precisa ser corrigido', () => {
    expect(fieldOfError('invalid-hours')).toBe('hours');
    expect(fieldOfError('too-long')).toBe('hours');
    expect(fieldOfError('invalid-start-hour')).toBe('startHour');
    expect(fieldOfError('odometer-order')).toBe('odometerEnd');
  });

  it('erro sem campo próprio fica no aviso geral', () => {
    expect(fieldOfError('no-earnings')).toBeNull();
  });
});

describe('etapa de cada erro', () => {
  it.each([
    ['invalid-hours', 'time'],
    ['too-long', 'time'],
    ['invalid-start-hour', 'time'],
    ['odometer-order', 'time'],
    ['no-earnings', 'earnings'],
    ['invalid-number', null],
  ] as const)('%s leva à etapa %s', (error, step) => {
    expect(stepOfError(error)).toBe(step);
  });
});
