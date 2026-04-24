import React, { useState } from 'react';
import './App.css';
import Navbar, { Page } from './components/Navbar';
import IgvPage from './pages/IgvPage';
import IgtePage from './pages/IgtePage';
import ContractsPage from './pages/ContractsPage';

export default function App() {
  const [page, setPage] = useState<Page>('igv');

  const renderPage = () => {
    switch (page) {
      case 'igv': return <IgvPage />;
      case 'igte': return <IgtePage />;
      case 'contracts': return <ContractsPage />;
    }
  };

  return (
    <div className="app">
      <Navbar page={page} setPage={setPage} />
      <main className="main">
        {renderPage()}
      </main>
    </div>
  );
}
