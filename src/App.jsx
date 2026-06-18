import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TaskList from './components/Tasks/TaskList';
import ProgressView from './components/Progress/ProgressView';
import RevisionView from './components/Revision/RevisionView';
import MarkdownImport from './components/Tasks/MarkdownImport';
import TaskForm from './components/Tasks/TaskForm';
import AuthScreen from './components/Auth/AuthScreen';
import NamePromptCard from './components/Auth/NamePromptCard';
import NotesView from './components/Notes/NotesView';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoadingScreen from './components/common/LoadingScreen';
import CelebrationOverlay from './components/common/CelebrationOverlay';

function PrivateApp() {
  const { user, loading, needsDisplayName, saveDisplayName } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <LoadingScreen isLoading={loading} fullScreen={true} />

      {!loading && !user && <AuthScreen />}

      {!loading && user && (
    <AppProvider>
      {needsDisplayName && <NamePromptCard onSave={saveDisplayName} />}
      <Layout
        onAddTask={() => setShowTaskForm(true)}
        onImportClick={() => setShowImport(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      >
        <Routes>
          <Route path="/" element={<Dashboard refreshKey={refreshKey} />} />
          <Route
            path="/tasks"
            element={
              <TaskList
                searchQuery={searchQuery}
                showFormProp={showTaskForm}
                onFormClose={() => setShowTaskForm(false)}
                refreshKey={refreshKey}
              />
            }
          />
          <Route path="/progress" element={<ProgressView />} />
          <Route path="/revision" element={<RevisionView />} />
          <Route path="/notes" element={<NotesView />} />
          <Route path="/notes/:slug" element={<NotesView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>

      <MarkdownImport
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImported={() => {
          setRefreshKey((k) => k + 1);
          setShowImport(false);
        }}
      />

      <TaskForm
        isOpen={showTaskForm}
        onClose={() => setShowTaskForm(false)}
        onSaved={() => {
          setRefreshKey((k) => k + 1);
          setShowTaskForm(false);
        }}
        editTask={null}
      />
      <CelebrationOverlay />
    </AppProvider>
    )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <PrivateApp />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'toast-custom',
            duration: 3000,
            style: {
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-glass)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
