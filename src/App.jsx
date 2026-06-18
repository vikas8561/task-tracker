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
import QuestionsView from './components/Questions/QuestionsView';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

import LoadingScreen from './components/common/LoadingScreen';
import CelebrationOverlay from './components/common/CelebrationOverlay';

function PrivateApp() {
  const { user, loading, needsDisplayName, saveDisplayName } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showQuestionImport, setShowQuestionImport] = useState(false);
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
        onAddQuestion={() => setShowQuestionForm(true)}
        onImportQuestion={() => setShowQuestionImport(true)}
      >
        <Routes>
          <Route path="/" element={<div className="page-content"><Dashboard refreshKey={refreshKey} /></div>} />
          <Route
            path="/tasks"
            element={
              <div className="page-content">
                <TaskList
                  showFormProp={showTaskForm}
                  onFormClose={() => setShowTaskForm(false)}
                  refreshKey={refreshKey}
                />
              </div>
            }
          />
          <Route path="/progress" element={<div className="page-content"><ProgressView /></div>} />
          <Route path="/revision" element={<div className="page-content"><RevisionView /></div>} />
          <Route path="/notes" element={<NotesView />} />
          <Route path="/notes/:slug" element={<NotesView />} />
          <Route
            path="/questions"
            element={
              <QuestionsView
                showFormProp={showQuestionForm}
                onFormClose={() => setShowQuestionForm(false)}
                showImportProp={showQuestionImport}
                onImportClose={() => setShowQuestionImport(false)}
              />
            }
          />
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
