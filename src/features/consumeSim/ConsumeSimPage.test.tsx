import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { ApiError } from '@/api/errors';
import * as consumeSimApi from './api';
import { ConsumeSimPage } from './ConsumeSimPage';

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <ConsumeSimPage />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

function NavigateHarness({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <>
      <button type="button" onClick={() => navigate(to)}>
        go
      </button>
      <ConsumeSimPage />
    </>
  );
}

function renderWithNavigate(initialPath: string, to: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <NavigateHarness to={to} />
        </MemoryRouter>
      </QueryClientProvider>
    </I18nextProvider>,
  );
}

describe('ConsumeSimPage deep-link preload', () => {
  afterEach(() => vi.restoreAllMocks());

  it('preloads the credential id from a ?id= query param', () => {
    renderAt('/consume-sim?id=cred-1');
    expect(screen.getByLabelText(i18n.t('consumeSim.form.credentialId'))).toHaveValue('cred-1');
  });

  it('starts blank when no id param is present', () => {
    renderAt('/consume-sim');
    expect(screen.getByLabelText(i18n.t('consumeSim.form.credentialId'))).toHaveValue('');
  });
});

describe('ConsumeSimPage idempotency key', () => {
  afterEach(() => vi.restoreAllMocks());

  it('auto-generates a key and regenerates a different one on demand', async () => {
    const user = userEvent.setup();
    renderAt('/consume-sim');
    const input = screen.getByLabelText(
      i18n.t('consumeSim.form.idempotencyKey'),
    ) as HTMLInputElement;
    const initial = input.value;
    expect(initial.length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: i18n.t('consumeSim.form.regenerate') }));

    expect(input.value).not.toBe(initial);
    expect(input.value.length).toBeGreaterThan(0);
  });
});

describe('ConsumeSimPage API key handling', () => {
  afterEach(() => vi.restoreAllMocks());

  it('never persists the pasted API key to localStorage, and clears it on unmount', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const user = userEvent.setup();
    const { unmount } = renderAt('/consume-sim');

    const keyInput = screen.getByLabelText(i18n.t('consumeSim.form.apiKey'));
    await user.type(keyInput, 'khk_test_super_secret_value');
    expect(keyInput).toHaveValue('khk_test_super_secret_value');
    expect(setItemSpy).not.toHaveBeenCalled();

    unmount();
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('clears the pasted key on any navigation event, even while the page stays mounted', async () => {
    const user = userEvent.setup();
    renderWithNavigate('/consume-sim?id=cred-1', '/consume-sim?id=cred-2');

    const keyInput = screen.getByLabelText(i18n.t('consumeSim.form.apiKey'));
    await user.type(keyInput, 'khk_test_super_secret_value');
    expect(keyInput).toHaveValue('khk_test_super_secret_value');

    await user.click(screen.getByRole('button', { name: 'go' }));

    expect(screen.getByLabelText(i18n.t('consumeSim.form.apiKey'))).toHaveValue('');
  });
});

async function submitForm() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(i18n.t('consumeSim.form.credentialId')), 'cred-1');
  await user.type(screen.getByLabelText(i18n.t('consumeSim.form.apiKey')), 'khk_test_abc.secret');
  await user.click(screen.getByRole('button', { name: i18n.t('consumeSim.form.submit') }));
}

describe('ConsumeSimPage result rendering', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ['consumed', 'consumeSim.result.reasonConsumed'],
    ['already_consumed', 'consumeSim.result.reasonAlreadyConsumed'],
    ['not_consumable', 'consumeSim.result.reasonNotConsumable'],
    ['idempotent_replay', 'consumeSim.result.reasonIdempotentReplay'],
  ])('renders the "%s" reason with its localized label', async (reason, i18nKey) => {
    vi.spyOn(consumeSimApi, 'simulateConsume').mockResolvedValue({
      consumed: reason === 'consumed',
      reason,
      usesRemaining: reason === 'idempotent_replay' ? undefined : 0,
    });

    renderAt('/consume-sim');
    await submitForm();

    expect(await screen.findByTestId('consume-result')).toHaveTextContent(i18n.t(i18nKey));
  });

  it('gives the deny-by-default KH-CNS-0403 error a friendly, localized explanation', async () => {
    vi.spyOn(consumeSimApi, 'simulateConsume').mockRejectedValue(
      new ApiError(403, {
        code: 'KH-CNS-0403',
        messageKey: 'consumer.schema-not-allowed',
        message: 'Forbidden',
        traceId: 'trace-1',
      }),
    );

    renderAt('/consume-sim');
    await submitForm();

    expect(
      await screen.findByText(i18n.t('errors.consumer.schema-not-allowed')),
    ).toBeInTheDocument();
  });

  it('gives an invalid/suspended API key its own clear auth-failure message', async () => {
    vi.spyOn(consumeSimApi, 'simulateConsume').mockRejectedValue(
      new ApiError(401, {
        code: 'KH-RBC-1401',
        messageKey: 'error.rbc.api_key_invalid',
        message: 'Unauthorized',
        traceId: 'trace-2',
      }),
    );

    renderAt('/consume-sim');
    await submitForm();

    expect(await screen.findByText(i18n.t('errors.error.rbc.api_key_invalid'))).toBeInTheDocument();
  });
});

describe('ConsumeSimPage request construction via submit', () => {
  afterEach(() => vi.restoreAllMocks());

  it('calls simulateConsume with the pasted key, form id, and current idempotency key', async () => {
    const consume = vi
      .spyOn(consumeSimApi, 'simulateConsume')
      .mockResolvedValue({ consumed: true, reason: 'consumed', usesRemaining: 0 });

    renderAt('/consume-sim');
    const idInput = screen.getByLabelText(
      i18n.t('consumeSim.form.idempotencyKey'),
    ) as HTMLInputElement;
    const idempotencyKey = idInput.value;

    await submitForm();

    await waitFor(() =>
      expect(consume).toHaveBeenCalledWith({
        credentialId: 'cred-1',
        apiKey: 'khk_test_abc.secret',
        idempotencyKey,
      }),
    );
  });
});
