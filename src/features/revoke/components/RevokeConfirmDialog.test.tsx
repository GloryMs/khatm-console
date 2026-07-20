import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { RevokeConfirmDialog } from './RevokeConfirmDialog';

const ID = '11111111-2222-3333-4444-555555555555';

function renderDialog(overrides: { onConfirm?: () => void } = {}) {
  const onConfirm = overrides.onConfirm ?? vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <RevokeConfirmDialog
        expectedId={ID}
        isRevoking={false}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    </I18nextProvider>,
  );
  return { onConfirm };
}

describe('RevokeConfirmDialog (type-to-confirm guard)', () => {
  it('keeps the confirm button disabled and does not revoke until the id is typed exactly', async () => {
    const { onConfirm } = renderDialog();
    const user = userEvent.setup();
    const confirm = screen.getByRole('button', { name: i18n.t('revoke.confirmRevoke') });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByRole('textbox'), 'wrong-id');
    expect(confirm).toBeDisabled();
    expect(screen.getByText(i18n.t('revoke.confirmMismatch'))).toBeInTheDocument();

    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), ID);
    expect(confirm).toBeEnabled();
    expect(screen.queryByText(i18n.t('revoke.confirmMismatch'))).not.toBeInTheDocument();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exposes the id to retype and an irreversible warning in the dialog body', () => {
    renderDialog();
    expect(screen.getByText(ID)).toBeInTheDocument();
    expect(screen.getByText(i18n.t('revoke.confirmBody'))).toBeInTheDocument();
  });
});
