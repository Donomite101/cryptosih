import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TracerView from './components/TracerView';
import VictimCasesView from './components/VictimCasesView';
import FreezeNoticesView from './components/FreezeNoticesView';
import VaspDirectoryView from './components/VaspDirectoryView';
import VictimReportModal from './components/VictimReportModal';
import FreezeNoticeModal from './components/FreezeNoticeModal';
import AILoader from './components/AILoader';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('tracer');
  const [searchAddress, setSearchAddress] = useState('');
  const [traceData, setTraceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [traceError, setTraceError] = useState('');
  const [stats, setStats] = useState(null);

  // Modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [freezeModalData, setFreezeModalData] = useState(null);

  useEffect(() => {
    loadStats();
    // Clean initial state: DO NOT auto-load results on mount!
    // The home page stays completely clean until the user triggers analysis.
  }, []);

  const loadStats = async () => {
    try {
      const s = await api.getStats();
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunTrace = async (address, depth = 2, victimReportId = null) => {
    if (!address || !address.trim()) return;
    setLoading(true);
    setTraceError('');
    // Guarantee minimum animation duration so all 4 steps of AI scan are visible to the user
    const minAnimationDelay = new Promise((resolve) => setTimeout(resolve, 3200));
    try {
      const [data] = await Promise.all([
        api.traceAddress(address.trim(), depth, victimReportId),
        minAnimationDelay,
      ]);
      setTraceData(data);
      loadStats();
    } catch (err) {
      setTraceError(err.message);
      setActiveTab('tracer');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectScenario = (key) => {
    if (key === 'live_exchange_inflow') {
      const addr = '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97';
      setSearchAddress(addr);
      handleRunTrace(addr, 1);
    } else if (key === 'live_vitalik') {
      const addr = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
      setSearchAddress(addr);
      handleRunTrace(addr, 1);
    } else if (key === 'crypto_public_key') {
      const pubkey = '04e68acfc0253a10620dff707b0ac063d5c5724f739ee2a15edbb6138402ac48195b23e1837d303984f9245e0bd5744ec51ac366bce652b83777745b5b28ec61d5';
      setSearchAddress(pubkey);
      handleRunTrace(pubkey, 1);
    }
  };

  const handleLoadCaseInTracer = (suspectAddress, reportId) => {
    setSearchAddress(suspectAddress);
    setActiveTab('tracer');
    handleRunTrace(suspectAddress, 2, reportId);
  };

  const handleClear = () => {
    setSearchAddress('');
    setTraceData(null);
    setTraceError('');
  };

  const handleOpenFreezeModal = (vasp, suspectAddress, investigationId, victimReportId) => {
    setFreezeModalData({
      vasp,
      suspectAddress,
      investigationId,
      victimReportId,
    });
  };

  // =========================================================================
  // STATE 2: LOADING / AI WORKING
  // When user enters ID and hits enter -> HIDE ALL SCREEN, SHOW ONLY CIRCULAR LOADER
  // =========================================================================
  if (loading) {
    return <AILoader targetInput={searchAddress} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      {/* Top Clean Navbar matching reference image */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Main View Area */}
      <main style={{ flex: 1, maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '16px 32px 80px 32px' }}>
        {activeTab === 'tracer' && (
          <TracerView
            searchAddress={searchAddress}
            setSearchAddress={setSearchAddress}
            traceData={traceData}
            loading={loading}
            error={traceError}
            onRunTrace={handleRunTrace}
            onClear={handleClear}
            onOpenFreezeModal={handleOpenFreezeModal}
            onOpenReportModal={() => setIsReportModalOpen(true)}
            onSelectScenario={handleSelectScenario}
          />
        )}

        {activeTab === 'cases' && (
          <VictimCasesView
            onLoadCaseInTracer={handleLoadCaseInTracer}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'notices' && <FreezeNoticesView />}

        {activeTab === 'vasp' && <VaspDirectoryView />}
      </main>

      {/* Modals */}
      <VictimReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportCreated={(res) => {
          loadStats();
          if (res.analysis) {
            setSearchAddress(res.analysis.suspect_address);
            setTraceData(res.analysis);
            setActiveTab('tracer');
          }
        }}
      />

      {freezeModalData && (
        <FreezeNoticeModal
          isOpen={!!freezeModalData}
          onClose={() => setFreezeModalData(null)}
          vasp={freezeModalData.vasp}
          suspectAddress={freezeModalData.suspectAddress}
          investigationId={freezeModalData.investigationId}
          victimReportId={freezeModalData.victimReportId}
          onNoticeIssued={() => {
            loadStats();
            setActiveTab('notices');
          }}
        />
      )}
    </div>
  );
}
