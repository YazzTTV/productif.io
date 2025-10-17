import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Profile } from '../Profile';
import '@testing-library/jest-dom';

describe('Profile', () => {
  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    avatar: 'https://example.com/avatar.jpg',
    preferences: {
      theme: 'light',
      language: 'fr',
      notifications: {
        email: true,
        push: true
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock fetch
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/user/preferences')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      if (url.includes('/api/user/avatar')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ url: 'https://example.com/new-avatar.jpg' })
        });
      }
      if (url.includes('/api/user')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUser)
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('affiche les informations du profil', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Avatar' })).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('permet de changer le thème', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const themeSwitch = screen.getByRole('switch', { name: /thème/i });
    await act(async () => {
      fireEvent.click(themeSwitch);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://productif.io/api/user/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"theme":"dark"')
        })
      );
    });
  });

  it('permet de changer la langue', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const languageSelect = screen.getByRole('combobox', { name: /langue/i });
    await act(async () => {
      fireEvent.change(languageSelect, { target: { value: 'en' } });
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://productif.io/api/user/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"language":"en"')
        })
      );
    });
  });

  it('permet de modifier les préférences de notification', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const emailSwitch = screen.getByRole('switch', { name: /email/i });
    const pushSwitch = screen.getByRole('switch', { name: /push/i });

    await act(async () => {
      fireEvent.click(emailSwitch);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://productif.io/api/user/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"notifications":{"email":false,"push":true}')
        })
      );
    });

    await act(async () => {
      fireEvent.click(pushSwitch);
    });
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://productif.io/api/user/preferences',
        expect.objectContaining({
          method: 'PUT',
          body: expect.stringContaining('"notifications":{"email":false,"push":false}')
        })
      );
    });
  });

  it('permet de mettre à jour l\'avatar', async () => {
    render(<Profile />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/avatar/i);
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    await act(async () => {
      fireEvent.change(input);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        'https://productif.io/api/user/avatar',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Avatar' })).toHaveAttribute('src', 'https://example.com/new-avatar.jpg');
    });
  });

  it('gère les erreurs de mise à jour des préférences', async () => {
    // First load the user successfully
    render(<Profile />);
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Then mock the preferences update to fail
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/user/preferences')) {
        return Promise.reject(new Error('Erreur réseau'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });
    });

    const themeSwitch = screen.getByRole('switch', { name: /thème/i });
    await act(async () => {
      fireEvent.click(themeSwitch);
    });

    await waitFor(() => {
      expect(screen.getByText(/erreur.*préférences/i)).toBeInTheDocument();
    });
  });

  it('gère les erreurs de mise à jour de l\'avatar', async () => {
    // First load the user successfully
    render(<Profile />);
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Then mock the avatar update to fail
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/user/avatar')) {
        return Promise.reject(new Error('Erreur réseau'));
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUser)
      });
    });

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/avatar/i);
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });
    
    await act(async () => {
      fireEvent.change(input);
    });

    await waitFor(() => {
      expect(screen.getByText(/erreur.*avatar/i)).toBeInTheDocument();
    });
  });
}); 