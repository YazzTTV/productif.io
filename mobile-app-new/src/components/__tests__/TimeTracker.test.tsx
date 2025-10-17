import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TimeTracker } from '../TimeTracker';
import '@testing-library/jest-dom';

describe('TimeTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === 'https://productif.io/api/time-entries') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            id: '123',
            description: 'Test entry',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            duration: 3600
          })
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('affiche le timer à 00:00:00 initialement', () => {
    render(<TimeTracker />);
    const timerDisplay = screen.getByTestId('timer-display');
    expect(timerDisplay).toHaveTextContent('00:00:00');
  });

  it('ne permet pas de démarrer sans description', () => {
    render(<TimeTracker />);
    const startButton = screen.getByRole('button', { name: 'Démarrer' });
    expect(startButton).toBeDisabled();
  });

  it('permet de démarrer le timer avec une description', () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    const startButton = screen.getByRole('button', { name: 'Démarrer' });
    expect(startButton).not.toBeDisabled();
    
    act(() => {
      fireEvent.click(startButton);
    });
    
    expect(screen.getByRole('button', { name: 'Arrêter' })).toBeInTheDocument();
  });

  it('incrémente le timer correctement', () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    });

    // Avancer de 5 secondes
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    
    const timerDisplay = screen.getByTestId('timer-display');
    expect(timerDisplay).toHaveTextContent('00:00:05');

    // Avancer d'une minute
    act(() => {
      vi.advanceTimersByTime(55000);
    });
    
    expect(timerDisplay).toHaveTextContent('00:01:00');
  });

  it('enregistre l\'entrée de temps lors de l\'arrêt', async () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      // Avancer de 1 minute
      vi.advanceTimersByTime(60000);
    });

    const stopButton = screen.getByRole('button', { name: 'Arrêter' });
    
    // Simuler l'arrêt du timer
    let fetchPromiseResolve: (value: unknown) => void;
    const fetchPromise = new Promise(resolve => {
      fetchPromiseResolve = resolve;
    });

    global.fetch = vi.fn().mockImplementation(() => {
      fetchPromiseResolve(undefined);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });

    await act(async () => {
      fireEvent.click(stopButton);
      await fetchPromise;
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://productif.io/api/time-entries',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Test timer')
      })
    );
  });

  it('désactive les champs pendant le tracking', () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    const taskInput = screen.getByPlaceholderText('ID de la tâche (optionnel)');
    
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    });

    expect(descriptionInput).toBeDisabled();
    expect(taskInput).toBeDisabled();
  });

  it('gère les erreurs lors de l\'enregistrement', async () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
      vi.advanceTimersByTime(5000);
    });

    // Simuler une erreur lors de l'arrêt
    let fetchPromiseResolve: (value: unknown) => void;
    const fetchPromise = new Promise(resolve => {
      fetchPromiseResolve = resolve;
    });

    global.fetch = vi.fn().mockImplementation(() => {
      fetchPromiseResolve(undefined);
      return Promise.reject(new Error('Erreur réseau'));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Arrêter' }));
      await fetchPromise;
    });

    expect(screen.getByText(/Erreur lors de l'enregistrement/)).toBeInTheDocument();
  });

  it('formate correctement le temps', () => {
    render(<TimeTracker />);
    
    const descriptionInput = screen.getByPlaceholderText('Description de l\'activité');
    fireEvent.change(descriptionInput, { target: { value: 'Test timer' } });
    
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    });

    // Test différentes durées
    act(() => {
      vi.advanceTimersByTime(3600000); // 1 heure
    });
    
    const timerDisplay = screen.getByTestId('timer-display');
    expect(timerDisplay).toHaveTextContent('01:00:00');

    act(() => {
      vi.advanceTimersByTime(3665000); // +1h 1m 5s
    });
    
    expect(timerDisplay).toHaveTextContent('02:01:05');
  });
}); 