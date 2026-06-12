import { createContext, useContext, useReducer, useCallback } from 'react';

const AppContext = createContext(null);

const initialState = {
  subjects: [],
  tasks: [],
  loading: false,
  refreshKey: 0, // increment to trigger data refresh across components
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SUBJECTS':
      return { ...state, subjects: action.payload };
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'REFRESH':
      return { ...state, refreshKey: state.refreshKey + 1 };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'REMOVE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'ADD_SUBJECT':
      return { ...state, subjects: [...state.subjects, action.payload] };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(() => dispatch({ type: 'REFRESH' }), []);

  return (
    <AppContext.Provider value={{ state, dispatch, refresh }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
