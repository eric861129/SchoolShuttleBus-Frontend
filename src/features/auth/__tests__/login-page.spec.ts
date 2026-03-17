import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import LoginPage from '@/features/auth/LoginPage.vue'

describe('LoginPage', () => {
  it('renders demo role shortcuts and emits the matching demo account', async () => {
    const onAuthenticate = vi.fn()
    render(LoginPage, {
      props: { onAuthenticate },
    })

    await fireEvent.click(screen.getByRole('button', { name: '家長 Demo' }))

    expect(screen.getByRole('button', { name: '管理員 Demo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '老師 Demo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '家長 Demo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '學生 Demo' })).toBeInTheDocument()
    expect(onAuthenticate).toHaveBeenCalledWith({
      account: '0900-000-003',
      password: 'P@ssw0rd!',
    })
  })

  it('submits manually entered credentials', async () => {
    const onAuthenticate = vi.fn()
    render(LoginPage, {
      props: { onAuthenticate },
    })

    await fireEvent.update(screen.getByLabelText('登入帳號'), 'E0001')
    await fireEvent.update(screen.getByLabelText('登入密碼'), 'P@ssw0rd!')
    await fireEvent.click(screen.getByRole('button', { name: '登入系統' }))

    expect(onAuthenticate).toHaveBeenCalledWith({
      account: 'E0001',
      password: 'P@ssw0rd!',
    })
  })
})
