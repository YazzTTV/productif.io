import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { TasksList } from '../TasksList';
import '@testing-library/jest-dom';

describe('TasksList', () => {
  const mockTasks = [
    {
      id: '1',
      title: 'Tâche de test 1',
      description: 'Description de la tâche 1',
      status: 'todo' as const,
      priority: 'high' as const,
      dueDate: '2025-12-31'
    },
    {
      id: '2',
      title: 'Tâche de test 2',
      description: 'Description de la tâche 2',
      status: 'in_progress' as const,
      priority: 'medium' as const
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock de fetch pour simuler l'API
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === 'https://productif.io/api/tasks') {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve(mockTasks)
            });
          }, 100); // Délai de 100ms pour voir l'état de chargement
        });
      }
      if (url.includes('/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success' })
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  it('affiche le chargement initialement', async () => {
    render(<TasksList />);
    expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
  });

  it('affiche les tâches après le chargement', async () => {
    render(<TasksList />);
    
    await waitFor(() => {
      expect(screen.getByText('Tâche de test 1')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Description de la tâche 1')).toBeInTheDocument();
    expect(screen.getByText('Tâche de test 2')).toBeInTheDocument();
    expect(screen.getByText('Description de la tâche 2')).toBeInTheDocument();
  });

  it('permet de filtrer les tâches', async () => {
    render(<TasksList />);
    
    await waitFor(() => {
      expect(screen.getByText('Tâche de test 1')).toBeInTheDocument();
    });

    // Cliquer sur le filtre "En cours"
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'En cours' }));
    });
    
    // Vérifier que seule la tâche en cours est affichée
    expect(screen.queryByText('Tâche de test 1')).not.toBeInTheDocument();
    expect(screen.getByText('Tâche de test 2')).toBeInTheDocument();
  });

  it('permet de mettre à jour le statut d\'une tâche', async () => {
    render(<TasksList />);
    
    await waitFor(() => {
      expect(screen.getByText('Tâche de test 1')).toBeInTheDocument();
    });

    // Simuler la mise à jour du statut
    let fetchPromiseResolve: (value: unknown) => void;
    const fetchPromise = new Promise(resolve => {
      fetchPromiseResolve = resolve;
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/status')) {
        fetchPromiseResolve(undefined);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTasks)
      });
    });

    // Trouver le select de la première tâche et changer son statut
    const statusSelect = screen.getAllByRole('combobox')[0];
    await act(async () => {
      fireEvent.change(statusSelect, { target: { value: 'in_progress' } });
      await fetchPromise;
    });

    // Vérifier que l'appel API a été fait
    expect(fetch).toHaveBeenCalledWith(
      'https://productif.io/api/tasks/1/status',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status: 'in_progress' })
      })
    );
  });

  it('affiche un message quand il n\'y a pas de tâches', async () => {
    // Mock de fetch pour retourner un tableau vide
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([])
      })
    );

    render(<TasksList />);
    
    await waitFor(() => {
      expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
    });

    expect(screen.getByText('Ajouter une tâche')).toBeInTheDocument();
  });

  it('affiche une erreur en cas de problème de chargement', async () => {
    // Mock de fetch pour simuler une erreur
    global.fetch = vi.fn().mockImplementation(() => 
      Promise.reject(new Error('Erreur réseau'))
    );

    render(<TasksList />);
    
    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement des tâches')).toBeInTheDocument();
    });
  });
}); 