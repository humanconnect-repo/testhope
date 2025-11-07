"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

type Section = 'introduzione' | 'inizia-da-qui' | 'avviso' | 'links' | 'bnb-chain-testnet' | 'faucet' | 'connect-wallet' | 'profilo' | 'prediction-in-attesa' | 'prediction-attiva' | 'prediction-chiusa' | 'prediction-cancellata' | 'prediction-risolta' | 'specifiche' | 'architettura-stack' | 'database' | 'web3' | 'smart-contracts' | 'smart-contracts-general' | 'factory-contract' | 'factory-math' | 'prediction-pool-contract' | 'open-source-bsc';

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = useState<Section>('inizia-da-qui');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['introduzione', 'tutorial', 'specifiche', 'smart-contracts']));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stackTechPage, setStackTechPage] = useState(0);
  const [databasePage, setDatabasePage] = useState(0);
  const [web3Page, setWeb3Page] = useState(0);
  const [smartContractsGeneralPage, setSmartContractsGeneralPage] = useState(0);
  const [factoryContractPage, setFactoryContractPage] = useState(0);
  const [factoryMathPage, setFactoryMathPage] = useState(0);
  const [predictionPoolContractPage, setPredictionPoolContractPage] = useState(0);
  const [bnbChainTestnetPage, setBnbChainTestnetPage] = useState(0);
  const [faucetPage, setFaucetPage] = useState(0);
  const [connectWalletPage, setConnectWalletPage] = useState(0);
  const [profiloPage, setProfiloPage] = useState(0);
  const [predictionInAttesaPage, setPredictionInAttesaPage] = useState(0);
  const [predictionAttivaPage, setPredictionAttivaPage] = useState(0);
  const [predictionChiusaPage, setPredictionChiusaPage] = useState(0);
  const [predictionCancellataPage, setPredictionCancellataPage] = useState(0);
  const [predictionRisoltaPage, setPredictionRisoltaPage] = useState(0);
  const [openSourceBscPage, setOpenSourceBscPage] = useState(0);
  const [poolContracts, setPoolContracts] = useState<Array<{ id: string; title: string; pool_address: string }>>([]);
  const [loadingPools, setLoadingPools] = useState(false);
  const [poolContractsPage, setPoolContractsPage] = useState(0);
  const POOLS_PER_PAGE = 4;

  // Reset pagine quando si cambia sezione
  const handleSectionChange = (section: Section) => {
    setActiveSection(section);
    if (section !== 'architettura-stack') {
      setStackTechPage(0);
    }
    if (section !== 'database') {
      setDatabasePage(0);
    }
    if (section !== 'web3') {
      setWeb3Page(0);
    }
    if (section !== 'smart-contracts-general') {
      setSmartContractsGeneralPage(0);
    }
    if (section !== 'factory-contract') {
      setFactoryContractPage(0);
    }
    if (section !== 'factory-math') {
      setFactoryMathPage(0);
    }
    if (section !== 'prediction-pool-contract') {
      setPredictionPoolContractPage(0);
    }
    if (section !== 'bnb-chain-testnet') {
      setBnbChainTestnetPage(0);
    }
    if (section !== 'faucet') {
      setFaucetPage(0);
    }
    if (section !== 'connect-wallet') {
      setConnectWalletPage(0);
    }
    if (section !== 'profilo') {
      setProfiloPage(0);
    }
    if (section !== 'prediction-in-attesa') {
      setPredictionInAttesaPage(0);
    }
    if (section !== 'prediction-attiva') {
      setPredictionAttivaPage(0);
    }
    if (section !== 'prediction-chiusa') {
      setPredictionChiusaPage(0);
    }
    if (section !== 'prediction-cancellata') {
      setPredictionCancellataPage(0);
    }
    if (section !== 'prediction-risolta') {
      setPredictionRisoltaPage(0);
    }
    if (section !== 'open-source-bsc') {
      setOpenSourceBscPage(0);
      setPoolContractsPage(0);
    }
  };

  // Gestione swipe per tutte le sezioni paginate
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeSection !== 'bnb-chain-testnet' && activeSection !== 'faucet' && activeSection !== 'connect-wallet' && activeSection !== 'profilo' && activeSection !== 'prediction-in-attesa' && activeSection !== 'prediction-attiva' && activeSection !== 'prediction-chiusa' && activeSection !== 'prediction-cancellata' && activeSection !== 'prediction-risolta' && activeSection !== 'architettura-stack' && activeSection !== 'database' && activeSection !== 'web3' && activeSection !== 'smart-contracts-general' && activeSection !== 'factory-contract' && activeSection !== 'factory-math' && activeSection !== 'prediction-pool-contract' && activeSection !== 'open-source-bsc') return;
    touchEndRef.current = null;
    touchStartRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeSection !== 'bnb-chain-testnet' && activeSection !== 'faucet' && activeSection !== 'connect-wallet' && activeSection !== 'profilo' && activeSection !== 'prediction-in-attesa' && activeSection !== 'prediction-attiva' && activeSection !== 'prediction-chiusa' && activeSection !== 'prediction-cancellata' && activeSection !== 'prediction-risolta' && activeSection !== 'architettura-stack' && activeSection !== 'database' && activeSection !== 'web3' && activeSection !== 'smart-contracts-general' && activeSection !== 'factory-contract' && activeSection !== 'factory-math' && activeSection !== 'prediction-pool-contract' && activeSection !== 'open-source-bsc') return;
    touchEndRef.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  };

  const handleTouchEnd = () => {
    if (activeSection !== 'bnb-chain-testnet' && activeSection !== 'faucet' && activeSection !== 'connect-wallet' && activeSection !== 'profilo' && activeSection !== 'prediction-in-attesa' && activeSection !== 'prediction-attiva' && activeSection !== 'prediction-chiusa' && activeSection !== 'prediction-cancellata' && activeSection !== 'prediction-risolta' && activeSection !== 'architettura-stack' && activeSection !== 'database' && activeSection !== 'web3' && activeSection !== 'smart-contracts-general' && activeSection !== 'factory-contract' && activeSection !== 'factory-math' && activeSection !== 'prediction-pool-contract' && activeSection !== 'open-source-bsc') return;
    if (!touchStartRef.current || !touchEndRef.current) return;

    const distanceX = touchStartRef.current.x - touchEndRef.current.x;
    const distanceY = touchStartRef.current.y - touchEndRef.current.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isVerticalSwipe = Math.abs(distanceY) > Math.abs(distanceX);

    // Ignora swipe verticali (per permettere scroll normale)
    if (isVerticalSwipe) return;

    if (activeSection === 'bnb-chain-testnet') {
      if (isLeftSwipe && bnbChainTestnetPage < 3) {
        setBnbChainTestnetPage(bnbChainTestnetPage + 1);
      }
      if (isRightSwipe && bnbChainTestnetPage > 0) {
        setBnbChainTestnetPage(bnbChainTestnetPage - 1);
      }
    } else if (activeSection === 'faucet') {
      if (isLeftSwipe && faucetPage < 3) {
        setFaucetPage(faucetPage + 1);
      }
      if (isRightSwipe && faucetPage > 0) {
        setFaucetPage(faucetPage - 1);
      }
    } else if (activeSection === 'connect-wallet') {
      if (isLeftSwipe && connectWalletPage < 1) {
        setConnectWalletPage(connectWalletPage + 1);
      }
      if (isRightSwipe && connectWalletPage > 0) {
        setConnectWalletPage(connectWalletPage - 1);
      }
    } else if (activeSection === 'profilo') {
      if (isLeftSwipe && profiloPage < 2) {
        setProfiloPage(profiloPage + 1);
      }
      if (isRightSwipe && profiloPage > 0) {
        setProfiloPage(profiloPage - 1);
      }
    } else if (activeSection === 'prediction-in-attesa') {
      // Solo una tab, quindi non serve swipe
    } else if (activeSection === 'prediction-attiva') {
      if (isLeftSwipe && predictionAttivaPage < 1) {
        setPredictionAttivaPage(predictionAttivaPage + 1);
      }
      if (isRightSwipe && predictionAttivaPage > 0) {
        setPredictionAttivaPage(predictionAttivaPage - 1);
      }
    } else if (activeSection === 'prediction-chiusa') {
      // Solo una tab, quindi non serve swipe
    } else if (activeSection === 'prediction-cancellata') {
      if (isLeftSwipe && predictionCancellataPage < 1) {
        setPredictionCancellataPage(predictionCancellataPage + 1);
      }
      if (isRightSwipe && predictionCancellataPage > 0) {
        setPredictionCancellataPage(predictionCancellataPage - 1);
      }
    } else if (activeSection === 'prediction-risolta') {
      // Solo una tab, quindi non serve swipe
    } else if (activeSection === 'architettura-stack') {
      if (isLeftSwipe && stackTechPage < 6) {
        setStackTechPage(stackTechPage + 1);
      }
      if (isRightSwipe && stackTechPage > 0) {
        setStackTechPage(stackTechPage - 1);
      }
    } else if (activeSection === 'database') {
      if (isLeftSwipe && databasePage < 2) {
        setDatabasePage(databasePage + 1);
      }
      if (isRightSwipe && databasePage > 0) {
        setDatabasePage(databasePage - 1);
      }
    } else if (activeSection === 'web3') {
      if (isLeftSwipe && web3Page < 4) {
        setWeb3Page(web3Page + 1);
      }
      if (isRightSwipe && web3Page > 0) {
        setWeb3Page(web3Page - 1);
      }
    } else if (activeSection === 'smart-contracts-general') {
      if (isLeftSwipe && smartContractsGeneralPage < 3) {
        setSmartContractsGeneralPage(smartContractsGeneralPage + 1);
      }
      if (isRightSwipe && smartContractsGeneralPage > 0) {
        setSmartContractsGeneralPage(smartContractsGeneralPage - 1);
      }
    } else if (activeSection === 'factory-contract') {
      if (isLeftSwipe && factoryContractPage < 8) {
        setFactoryContractPage(factoryContractPage + 1);
      }
      if (isRightSwipe && factoryContractPage > 0) {
        setFactoryContractPage(factoryContractPage - 1);
      }
    } else if (activeSection === 'factory-math') {
      if (isLeftSwipe && factoryMathPage < 2) {
        setFactoryMathPage(factoryMathPage + 1);
      }
      if (isRightSwipe && factoryMathPage > 0) {
        setFactoryMathPage(factoryMathPage - 1);
      }
    } else if (activeSection === 'prediction-pool-contract') {
      if (isLeftSwipe && predictionPoolContractPage < 6) {
        setPredictionPoolContractPage(predictionPoolContractPage + 1);
      }
      if (isRightSwipe && predictionPoolContractPage > 0) {
        setPredictionPoolContractPage(predictionPoolContractPage - 1);
      }
    } else if (activeSection === 'open-source-bsc') {
      if (isLeftSwipe && openSourceBscPage < 1) {
        setOpenSourceBscPage(openSourceBscPage + 1);
      }
      if (isRightSwipe && openSourceBscPage > 0) {
        setOpenSourceBscPage(openSourceBscPage - 1);
      }
    }
  };

  // Carica i PredictionPool Contracts quando si entra nella sezione open-source-bsc
  useEffect(() => {
    if (activeSection === 'open-source-bsc') {
      const loadPoolContracts = async () => {
        try {
          setLoadingPools(true);
          const { data, error } = await supabase
            .from('predictions')
            .select('id, title, pool_address')
            .in('status', ['attiva', 'in_pausa', 'risolta', 'cancellata'])
            .not('pool_address', 'is', null)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading pool contracts:', error);
            setPoolContracts([]);
          } else {
            setPoolContracts(data || []);
          }
        } catch (error) {
          console.error('Error loading pool contracts:', error);
          setPoolContracts([]);
        } finally {
          setLoadingPools(false);
        }
      };

      loadPoolContracts();
    }
  }, [activeSection]);

  const sections = [
    {
      id: 'introduzione',
      label: 'Introduzione',
      icon: '👋',
      subsections: [
        { id: 'inizia-da-qui' as Section, label: 'Bella Napoli', icon: '🎭' },
        { id: 'avviso' as Section, label: 'Avviso', icon: '⚠️' },
        { id: 'links' as Section, label: 'Links', icon: '🔗' }
      ]
    },
    {
      id: 'tutorial',
      label: 'Tutorial',
      icon: '📚',
      subsections: [
        { id: 'bnb-chain-testnet' as Section, label: 'BNB Chain Testnet', icon: '🔗' },
        { id: 'faucet' as Section, label: 'Faucet', icon: '🚰' },
        { id: 'connect-wallet' as Section, label: 'Connetti il Wallet', icon: '🔌' },
        { id: 'profilo' as Section, label: 'Profilo', icon: '👤' },
        { id: 'prediction-in-attesa' as Section, label: 'Prediction', icon: '🟡', sublabel: 'IN ATTESA' },
        { id: 'prediction-attiva' as Section, label: 'Prediction', icon: '🟢', sublabel: 'ATTIVA' },
        { id: 'prediction-chiusa' as Section, label: 'Prediction', icon: '🟡', sublabel: 'CHIUSA' },
        { id: 'prediction-cancellata' as Section, label: 'Prediction', icon: '🔴', sublabel: 'CANCELLATA' },
        { id: 'prediction-risolta' as Section, label: 'Prediction', icon: '🔵', sublabel: 'RISOLTA' }
      ]
    },
    {
      id: 'specifiche',
      label: 'Specifiche',
      icon: '📋',
      subsections: [
        { id: 'architettura-stack' as Section, label: 'Stack tecnologico', icon: '🏗️' },
        { id: 'database' as Section, label: 'Database', icon: '🗄️' },
        { id: 'web3' as Section, label: 'Web3', icon: '⛓️' }
      ]
    },
    {
      id: 'smart-contracts',
      label: 'Smart Contracts',
      icon: '📜',
      subsections: [
        { id: 'smart-contracts-general' as Section, label: 'General', icon: '📋' },
        { id: 'factory-contract' as Section, label: 'Factory Contract', icon: '🏭' },
        { id: 'factory-math' as Section, label: 'Factory: MATH', icon: '📊' },
        { id: 'prediction-pool-contract' as Section, label: 'PredictionPool Contracts', icon: '🤝' },
        { id: 'open-source-bsc' as Section, label: 'Open Source su BSC', icon: '🔓' }
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex flex-col">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <nav className="p-4">
            {/* Logo Image */}
            <div className="mb-6">
              <Image
                src="/media/image/BellaNapoli(1200 x 630 px)hd.png"
                alt="Bella Napoli"
                width={1200}
                height={630}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-3">
                DOCUMENTAZIONE
              </h2>
              <ul className="space-y-1">
                {sections.map((section) => {
                  if ('subsections' in section && section.subsections) {
                    const isExpanded = expandedSections.has(section.id);
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedSections);
                            if (isExpanded) {
                              newExpanded.delete(section.id);
                            } else {
                              newExpanded.add(section.id);
                            }
                            setExpandedSections(newExpanded);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                            isExpanded || section.subsections.some(sub => activeSection === sub.id)
                              ? 'text-white hover:bg-slate-800'
                              : 'text-white hover:bg-slate-800'
                          }`}
                        >
                          <span className="text-lg">{section.icon}</span>
                          <span className="font-medium flex-1 text-left">{section.label}</span>
                          <svg
                            className={`w-4 h-4 transition-transform text-cyan-400 ${isExpanded ? 'transform rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {isExpanded && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {section.subsections.map((subsection) => (
                              <li key={subsection.id}>
                                <button
                                  onClick={() => {
                                    handleSectionChange(subsection.id);
                                    // Mantieni la sezione espansa quando si clicca su una sottosezione
                                    if (!expandedSections.has(section.id)) {
                                      setExpandedSections(new Set([...expandedSections, section.id]));
                                    }
                                    // Chiudi il menu mobile quando si seleziona una sezione
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left ${
                                    activeSection === subsection.id
                                      ? 'bg-slate-800 text-white border-l-2 border-cyan-400'
                                      : 'text-white/80 hover:bg-slate-800'
                                  }`}
                                >
                                  <span className="text-base">{subsection.icon}</span>
                                  <span className="font-medium text-left flex-1">
                                    {subsection.label}
                                    {'sublabel' in subsection && subsection.sublabel && (
                                      <span className="ml-2 text-xs text-cyan-400 font-normal">({subsection.sublabel})</span>
                                    )}
                                  </span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  }
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => {
                          handleSectionChange(section.id as Section);
                          // Chiudi il menu mobile quando si seleziona una sezione
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                          activeSection === section.id
                            ? 'bg-slate-800 text-white border-l-2 border-cyan-400'
                            : 'text-white hover:bg-slate-800'
                        }`}
                      >
                        <span className="text-lg">{section.icon}</span>
                        <span className="font-medium">{section.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-dark-bg w-full md:w-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Content based on active section */}
            {activeSection === 'introduzione' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>👋</span>
                  Introduzione
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Benvenuto nella documentazione di <strong>Bella Napoli</strong>. Qui troverai tutte le informazioni necessarie per comprendere e utilizzare la piattaforma.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Inizia dalla sezione <strong>&quot;Inizia da qui&quot;</strong> per una panoramica generale della piattaforma e delle sue caratteristiche principali.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'inizia-da-qui' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🚀</span>
                  Inizia da qui
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed mb-6">
                    Benvenuto in <strong>Bella Napoli</strong>, il Prediction Market Italiano per scommettere sul futuro con stile degen! 🍕
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Bella Napoli è una piattaforma Web3 costruita sulla BNB Chain che ti permette di scommettere su eventi futuri utilizzando BNB. Con un&apos;interfaccia intuitiva e smart contract sicuri, Bella Napoli rende il mercato delle predizioni accessibile a tutti i degen che amano la bella Italia.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    La piattaforma combina la velocità e l&apos;efficienza di BNB Chain con una user experience moderna, permettendo agli utenti di partecipare al mercato delle predizioni in modo semplice e sicuro.
                  </p>

                  <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      🎯 L&apos;Idea di Bella Napoli
                    </h2>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                      Bella Napoli nasce dall&apos;idea di creare predizioni su eventi all&apos;italiana, portando nel mondo crypto la passione e lo stile italiano. 
                      La piattaforma offre un modo unico per scommettere su eventi che riguardano la cultura, lo sport, la politica e il lifestyle italiano, 
                      combinando la tradizione con l&apos;innovazione blockchain.
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      Inoltre, Bella Napoli è pensata per le community crypto che vogliono creare predizioni in live, permettendo ai membri 
                      di scommettere su eventi che riguardano crypto, NFT, DeFi o la community stessa.
                    </p>
                  </div>

                  {/* Freccia per andare alla pagina successiva (Avviso) */}
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        handleSectionChange('avviso');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                      }}
                      className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                      aria-label="Vai alla pagina successiva"
                    >
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                      Avviso
                    </span>
                  </div>

                </div>
              </div>
            )}

            {activeSection === 'avviso' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>⚠️</span>
                  BNB Chain Testnet
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Bella Napoli è attualmente disponibile sulla <strong>BNB Chain Testnet</strong> per mostrare agli utenti il funzionamento della piattaforma.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    La versione testnet permette di testare tutte le funzionalità della piattaforma in un ambiente sicuro, utilizzando token di test. 
                    Questo consente agli utenti di familiarizzare con il sistema di scommesse, la gestione del wallet e l&apos;interazione con gli smart contract 
                    senza rischi finanziari.
                  </p>
                  <div className="mt-6 p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg inline-block">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      <strong className="text-cyan-400">Nota importante:</strong> i fondi utilizzati nella testnet sono token di test e non hanno valore reale.
                    </p>
                  </div>

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Bella Napoli) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('inizia-da-qui');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 flex-shrink-0"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Bella Napoli
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Links) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Links
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('links');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 flex-shrink-0"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'links' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔗</span>
                  Links
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Link ufficiali di Bella Napoli:
                  </p>
                  
                  <div className="space-y-4">
                    {/* Sito Web Ufficiale */}
                    <div className="p-6 bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        🌐 Sito Web
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Accedi alla piattaforma Bella Napoli per iniziare a fare predizioni.
                      </p>
                      <a
                        href="https://bellanapoli.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        bellanapoli.io
                      </a>
                    </div>

                    {/* X (Twitter) */}
                    <div className="p-6 bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                        📱 Seguici su X
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Resta aggiornato su tutte le novità, le nuove predizioni e le community crypto che si uniscono a Bella Napoli. 
                        Seguici su X per non perdere nessun aggiornamento!
                      </p>
                      <a
                        href="https://x.com/bellanapoli_io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-12 h-12 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-md"
                        aria-label="Seguici su X"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </a>
                    </div>

                    {/* Keet.io Pear */}
                    <div className="p-6 bg-transparent rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <span>🍐</span>
                        Pear
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Unisciti alla community su Keet.io tramite Pear.
                      </p>
                      <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          <strong>⚠️ Avviso:</strong> Il link Pear scade il <strong>6 novembre 2025</strong>
                        </p>
                      </div>
                      <a
                        href="pear://keet/yfoscxz5ir9fqq6m6aanhkqdk767wb8jj1kn3a8tszu9fo1eesweai57kgp8p1s8971byrp6gpcpiq6d4dr839txn91qjiygb1ecisyxdcdsrpd8i98j1xopbkfegsssa3xgngqy65kmwue7ep4wmgn3mdy56ye"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-md"
                      >
                        <span className="text-xl">🍐</span>
                        Apri Pear
                      </a>
                    </div>
                  </div>

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Avviso) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('avviso');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Avviso
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (BNB Chain Testnet) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        BNB Chain Testnet
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Tutorial nel menu
                          if (!expandedSections.has('tutorial')) {
                            setExpandedSections(new Set([...expandedSections, 'tutorial']));
                          }
                          handleSectionChange('bnb-chain-testnet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'bnb-chain-testnet' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔗</span>
                  BNB Chain Testnet
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setBnbChainTestnetPage(Math.max(0, bnbChainTestnetPage - 1))}
                      disabled={bnbChainTestnetPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3].map((page) => (
                        <button
                          key={page}
                          onClick={() => setBnbChainTestnetPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            bnbChainTestnetPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setBnbChainTestnetPage(Math.min(3, bnbChainTestnetPage + 1))}
                      disabled={bnbChainTestnetPage === 3}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Intro */}
                  {bnbChainTestnetPage === 0 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        Bella Napoli è disponibile sulla BNB Chain Testnet. Per utilizzare la piattaforma, devi configurare il tuo wallet per connettersi alla rete.
                      </p>
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          Configurazione Wallet
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          Puoi utilizzare qualsiasi wallet Ethereum compatibile che supporta la rete testnet di BNB Chain. Qui trovi come configurare MetaMask, Rabby o altri wallet per la BNB Chain Testnet.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 1 - Dati Testnet */}
                  {bnbChainTestnetPage === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        Dati Testnet
                      </h2>
                      <div className="space-y-3">
                        <div className="flex items-start gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">Network Name:</span>
                          <span className="text-gray-600 dark:text-gray-400 font-mono">BSC Testnet</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">RPC URL:</span>
                          <span className="text-gray-600 dark:text-gray-400 font-mono break-all">https://data-seed-prebsc-1-s1.bnbchain.org:8545</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">ChainID:</span>
                          <span className="text-gray-600 dark:text-gray-400 font-mono">97 (0x61)</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">Symbol:</span>
                          <span className="text-gray-600 dark:text-gray-400 font-mono">tBNB</span>
                        </div>
                        <div className="flex items-start gap-4">
                          <span className="font-semibold text-gray-700 dark:text-gray-300 min-w-[140px]">Explorer:</span>
                          <a 
                            href="https://testnet.bscscan.com/" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline font-mono break-all"
                          >
                            https://testnet.bscscan.com/
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Metodo Consigliato: ChainList */}
                  {bnbChainTestnetPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        ⚡ Metodo consigliato: ChainList
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Il metodo più semplice per aggiungere la BNB Chain Testnet al tuo wallet è utilizzare la funzione <strong>&quot;Add to Wallet&quot;</strong> automatica da ChainList.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                        <li>Visita <a href="https://chainlist.org/chain/97" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">chainlist.org/chain/97</a></li>
                        <li>Clicca sul pulsante <strong>&quot;Connect Wallet&quot;</strong></li>
                        <li>Seleziona il tuo wallet (MetaMask, Rabby, ecc.)</li>
                        <li>Clicca su <strong>&quot;Add to Wallet&quot;</strong></li>
                        <li>Conferma la richiesta nel tuo wallet</li>
                      </ol>
                      <a
                        href="https://chainlist.org/chain/97"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Apri ChainList
                      </a>
                    </div>
                  )}

                  {/* Pagina 3 - Configurazione Manuale */}
                  {bnbChainTestnetPage === 3 && (
                    <div className="mb-8">
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                          🔧 Configurazione manuale
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          Se preferisci configurare manualmente il wallet, usa i dati sopra indicati. La procedura è simile per MetaMask, Rabby e altri wallet:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300">
                          <li>Apri il tuo wallet e vai alle impostazioni di rete</li>
                          <li>Clicca su &quot;Add Network&quot; o &quot;Aggiungi Rete&quot;</li>
                          <li>Inserisci manualmente tutti i dati della tabella sopra</li>
                          <li>Salva la configurazione</li>
                          <li>Assicurati di essere connesso alla rete BNB Chain Testnet prima di utilizzare Bella Napoli</li>
                        </ol>
                      </div>

                      {/* Nota */}
                      <div className="p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg inline-block">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong className="text-cyan-400">💡 Nota:</strong> assicurati di avere tBNB (BNB di test) nel tuo wallet per interagire con la piattaforma. 
                          Puoi ottenere tBNB gratuitamente da un faucet.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Links) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('links');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Links
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Faucet) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Faucet
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('faucet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'faucet' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🚰</span>
                  Faucet
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setFaucetPage(Math.max(0, faucetPage - 1))}
                      disabled={faucetPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3].map((page) => (
                        <button
                          key={page}
                          onClick={() => setFaucetPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            faucetPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setFaucetPage(Math.min(3, faucetPage + 1))}
                      disabled={faucetPage === 3}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Prendi tBNB */}
                  {faucetPage === 0 && (
                    <>
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          Per utilizzare Bella Napoli sulla BNB Chain Testnet, hai bisogno di tBNB per pagare le commissioni di transazione ed eseguire predictions.
                        </p>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          Prendi tBNB
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          Il faucet ufficiale di BNB Chain ti permette di ottenere token di test gratuiti per utilizzare la rete testnet.
                        </p>
                      </div>

                      <div className="mb-6 p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg inline-block">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong className="text-cyan-400">⚠️ Nota importante:</strong> per utilizzare il faucet, è necessario avere <strong>0.002 BNB sulla BSC Mainnet</strong> per il test funding.
                        </p>
                      </div>

                      <div className="mb-6 p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg inline-block">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong className="text-cyan-400">⏰ Limitazione:</strong> puoi reclamare token sulla BSC Testnet <strong>ogni 24 ore</strong>.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Pagina 1 - Come Usare il Faucet */}
                  {faucetPage === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        📝 Come usare il Faucet
                      </h2>
                      <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-300 mb-4">
                        <li>Assicurati di avere almeno 0.002 BNB sulla BSC Mainnet nel tuo wallet</li>
                        <li>Connetti il tuo wallet alla <strong>BSC Testnet</strong> (vedi sezione BNB Chain Testnet per le istruzioni)</li>
                        <li>Visita il faucet ufficiale</li>
                        <li>Incolla il tuo indirizzo wallet nella sezione &quot;Wallet Address&quot;</li>
                        <li>Seleziona il token che vuoi reclamare (tBNB)</li>
                        <li>Clicca su &quot;Send&quot; per richiedere i token</li>
                        <li>Attendi la conferma della transazione</li>
                      </ol>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <a
                          href="https://www.bnbchain.org/en/testnet-faucet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors shadow-md"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Apri BNB Chain Faucet
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Altri Canali */}
                  {faucetPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        🔄 Altri canali per ottenere tBNB
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Se non riesci ad accedere al faucet principale, puoi provare questi canali alternativi:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                        <li>
                          <strong>BNB Chain Discord Faucet</strong> - Unisciti al{' '}
                          <a href="https://discord.gg/bnbchain" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Discord ufficiale di BNB Chain
                          </a>
                          {' '}per accedere al canale faucet
                        </li>
                        <li>
                          <strong>QuickNode</strong> - Servizio di terze parti che offre faucet per testnet. 
                          Visita{' '}
                          <a href="https://faucet.quicknode.com/drip" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            faucet.quicknode.com/drip
                          </a>
                        </li>
                        <li>
                          <strong>Chainstack</strong> - Altro servizio che fornisce token di test. 
                          Visita{' '}
                          <a href="https://faucet.chainstack.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            faucet.chainstack.com
                          </a>
                        </li>
                      </ul>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4 text-sm">
                        <em>* BNB Chain fornisce link a provider di servizi indipendenti per tua comodità ma non assume responsabilità per le loro operazioni.</em>
                      </p>
                    </div>
                  )}

                  {/* Pagina 3 - FAQ */}
                  {faucetPage === 3 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        ❓ Domande frequenti
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Quanto tBNB posso reclamare?
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Puoi reclamare fino a <strong>0.3 BNB</strong> ogni 24 ore.
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            I tBNB hanno valore reale?
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            No, i tBNB non hanno valore finanziario e non possono essere scambiati a un prezzo reale. 
                            Hanno una fornitura illimitata e servono esclusivamente per scopi di test e sviluppo.
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                            Cosa fare se la richiesta continua a fallire?
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Per prevenire potenziali identificazioni come bot, evita operazioni frequenti e aspetta alcuni minuti prima di tentare nuovamente. 
                            Se i problemi persistono, chiedi assistenza sul{' '}
                            <a href="https://discord.gg/bnbchain" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                              Discord ufficiale di BNB Chain
                            </a>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (BNB Chain Testnet) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('bnb-chain-testnet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        BNB Chain Testnet
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Connetti il Wallet) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Connetti il Wallet
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('connect-wallet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'connect-wallet' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔌</span>
                  Connetti il Wallet
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setConnectWalletPage(Math.max(0, connectWalletPage - 1))}
                      disabled={connectWalletPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1].map((page) => (
                        <button
                          key={page}
                          onClick={() => setConnectWalletPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            connectWalletPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setConnectWalletPage(Math.min(1, connectWalletPage + 1))}
                      disabled={connectWalletPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Tab 0 - Connetti il Wallet */}
                  {connectWalletPage === 0 && (
                    <div className="mb-8">
                      <div className="mb-6">
                        <div className="flex justify-center mb-4">
                          <Image
                            src="/media/tutorial/connectwallet.png"
                            alt="Connetti il Wallet"
                            width={400}
                            height={200}
                            className="max-w-md w-auto h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Come connettersi al wallet
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Per utilizzare Bella Napoli, devi prima connettere il tuo wallet cliccando su "Connect Wallet" come nell'immagine sopra. La piattaforma supporta diversi wallet come MetaMask, Rabby, Trust Wallet e altri wallet compatibili con EVM.
                          </p>
                          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li>Assicurati di avere un wallet installato sul tuo browser o dispositivo mobile</li>
                            <li>Clicca sul pulsante &quot;Connetti Wallet&quot; nella parte superiore della pagina</li>
                            <li>Seleziona il tuo wallet preferito dalla lista</li>
                            <li>Autorizza la connessione quando richiesto dal wallet</li>
                            <li>Verifica che il wallet sia connesso alla rete corretta (BNB Chain Testnet per i test)</li>
                            <li><strong>Per mobile:</strong> ti consigliamo di usare il browser integrato del wallet come il browser dentro Rabby Wallet o MetaMask. La connessione diretta da Brave o altri browsers in alcuni casi, a seconda delle configurazioni dell&apos;utente, può incontrare blocchi di sicurezza.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1 - Firma e Login */}
                  {connectWalletPage === 1 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/2">
                          <Image
                            src="/media/tutorial/firmaxlogin.png"
                            alt="Firma e Login"
                            width={600}
                            height={800}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Firma e Login
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Dopo aver connesso il wallet, devi firmare un messaggio per autenticarti sulla piattaforma. Questa operazione è necessaria per associare il tuo wallet al tuo account.
                          </p>
                          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li>Dopo aver connesso il wallet, apparirà una richiesta di firma</li>
                            <li>Il wallet ti chiederà di firmare un messaggio di autenticazione</li>
                            <li>Verifica il messaggio nel tuo wallet e conferma la firma</li>
                            <li>La firma non costa nulla e non è una transazione sulla blockchain</li>
                            <li>Una volta firmato, sarai automaticamente loggato sulla piattaforma</li>
                          </ol>
                          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>⚠️ Nota importante:</strong> la firma del messaggio è necessaria solo una volta per sessione. Non devi firmare ad ogni operazione.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Faucet) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('faucet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Faucet
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Profilo) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Profilo
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('profilo');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'profilo' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>👤</span>
                  Profilo
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setProfiloPage(Math.max(0, profiloPage - 1))}
                      disabled={profiloPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((page) => (
                        <button
                          key={page}
                          onClick={() => setProfiloPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            profiloPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setProfiloPage(Math.min(2, profiloPage + 1))}
                      disabled={profiloPage === 2}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Tab 0 - Accesso al Profilo */}
                  {profiloPage === 0 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/2">
                          <Image
                            src="/media/tutorial/profilo1.png"
                            alt="Accesso al Profilo"
                            width={600}
                            height={800}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Accesso al Profilo
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Dopo che hai firmato la transazione per la creazione dell&apos;account apparirà la voce &quot;Profilo&quot; in alto a destra dal menu a tendina che vedi in navbar cliccando sull&apos;icona dell&apos;immagine stock (Pizza) del tuo profilo.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1 - Personalizza il Profilo */}
                  {profiloPage === 1 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/profilo2.png"
                            alt="Personalizza il Profilo"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Personalizza il Profilo
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Nella pagina del profilo puoi personalizzare le tue informazioni:
                          </p>
                          <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li><strong>Immagine profilo:</strong> puoi inserire un link ad un&apos;immagine per cambiare l&apos;immagine del tuo profilo. L&apos;immagine deve essere accessibile pubblicamente tramite URL.</li>
                            <li><strong>Nickname:</strong> scegli un nickname univoco che ti identifichi sulla piattaforma. Il nickname sarà visibile agli altri utenti.</li>
                            <li><strong>Bio:</strong> la biografia è opzionale. Puoi aggiungere un breve testo/frase o lasciare il campo vuoto.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 2 - Dati del Profilo */}
                  {profiloPage === 2 && (
                    <div className="mb-8">
                      <div className="mb-6">
                        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 mb-4">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">
                            Dal tuo profilo vedi dati relativi ai tuoi volumi e le Predictions in cui hai partecipato.
                          </p>
                        </div>
                        <div className="flex justify-center">
                          <Image
                            src="/media/tutorial/profilo3.png"
                            alt="Dati del Profilo"
                            width={800}
                            height={600}
                            className="w-full max-w-4xl h-auto rounded-lg shadow-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Connetti il Wallet) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('connect-wallet');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Connetti il Wallet
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Prediction IN ATTESA) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction IN ATTESA
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-in-attesa');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-in-attesa' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🟡</span>
                  Prediction IN ATTESA
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Tab 0 - Prediction In Attesa */}
                  {predictionInAttesaPage === 0 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/inattesa.png"
                            alt="Prediction In Attesa"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Nella pagina dei dettagli di ogni prediction puoi vedere vari dati a seconda dello stato della prediction.
                          </p>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Quando una prediction è in attesa
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            La prediction è in attesa del deploy del suo contratto per diventare attiva.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Profilo) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('profilo');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Profilo
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Prediction ATTIVA) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction ATTIVA
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-attiva');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-attiva' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🟢</span>
                  Prediction ATTIVA
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setPredictionAttivaPage(Math.max(0, predictionAttivaPage - 1))}
                      disabled={predictionAttivaPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1].map((page) => (
                        <button
                          key={page}
                          onClick={() => setPredictionAttivaPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            predictionAttivaPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setPredictionAttivaPage(Math.min(1, predictionAttivaPage + 1))}
                      disabled={predictionAttivaPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Tab 0 - Prediction Attiva */}
                  {predictionAttivaPage === 0 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/attiva.png"
                            alt="Prediction Attiva"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Come partecipare ad una prediction attiva.
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Quando una prediction è attiva, l&apos;utente può partecipare seguendo questi passaggi:
                          </p>
                          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li>Premere sul pulsante <strong>&quot;Sì&quot;</strong> o <strong>&quot;No&quot;</strong> per scegliere la tua posizione</li>
                            <li>Scegliere l&apos;importo in BNB che vuoi scommettere</li>
                            <li>Procedere per la prediction cliccando sul pulsante di conferma</li>
                            <li>Firmare la transazione nel tuo wallet quando richiesto</li>
                          </ol>
                          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>⚠️ Nota importante:</strong> se dal tuo wallet non procedi alla firma della transazione e annulli, ricorda di controllare che la transazione non rimanga in coda nel tuo wallet e quindi di non firmarla in un secondo momento.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1 - Dettagli Transazione */}
                  {predictionAttivaPage === 1 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/attiva2.png"
                            alt="Dettagli Transazione"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Dettagli e Avvisi dopo la Prediction
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Quando si esegue una prediction, successivamente vedrai:
                          </p>
                          <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li><strong>Avvisi:</strong> se hai già scommesso su questa prediction, vedrai un avviso che ti informa che hai già partecipato</li>
                            <li><strong>Dettagli sulla transazione:</strong> potrai visualizzare tutti i dettagli relativi alla tua transazione, inclusi l&apos;importo scommesso e la tua posizione (Sì o No)</li>
                            <li><strong>Hash della transazione:</strong> l&apos;hash della transazione viene salvato e associato alla tua scommessa</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Prediction IN ATTESA) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-in-attesa');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction IN ATTESA
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Prediction CHIUSA) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction CHIUSA
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-chiusa');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-chiusa' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🟡</span>
                  Prediction CHIUSA
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Tab 0 - Prediction Chiusa */}
                  {predictionChiusaPage === 0 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/chiusa1.png"
                            alt="Prediction Chiusa"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Quando una prediction è chiusa
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Una prediction quando è chiusa vuol dire che non è più possibile scommettere. Questo può avvenire per due motivi principali:
                          </p>
                          <ul className="list-disc list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li><strong>Prediction in pausa:</strong> la prediction può essere messa in pausa a causa di condizioni esterne che riguardano la prediction stessa. In questo caso, le scommesse sono temporaneamente sospese fino a quando la situazione non viene risolta.</li>
                            <li><strong>Scadenza del periodo di scommesse:</strong> è scaduto il periodo in cui puoi scommettere. A questo punto bisogna attendere i risultati della prediction per vedere l&apos;esito finale.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Prediction ATTIVA) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-attiva');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction ATTIVA
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Prediction CANCELLATA) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction CANCELLATA
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-cancellata');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-cancellata' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔴</span>
                  Prediction CANCELLATA
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setPredictionCancellataPage(Math.max(0, predictionCancellataPage - 1))}
                      disabled={predictionCancellataPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1].map((page) => (
                        <button
                          key={page}
                          onClick={() => setPredictionCancellataPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            predictionCancellataPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setPredictionCancellataPage(Math.min(1, predictionCancellataPage + 1))}
                      disabled={predictionCancellataPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Tab 0 - Prediction Cancellata */}
                  {predictionCancellataPage === 0 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/cancellata1.png"
                            alt="Prediction Cancellata"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Quando una prediction viene cancellata
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            Se una prediction viene cancellata a causa di condizioni esterne o per l&apos;impossibilità dell&apos;esecuzione, gli utenti potranno recuperare tutto quello che è stato allocato per quella prediction.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab 1 - Modal e Step Automatici */}
                  {predictionCancellataPage === 1 && (
                    <div className="mb-8">
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-shrink-0 w-full md:w-1/3">
                          <Image
                            src="/media/tutorial/cancellata2.png"
                            alt="Modal Riscatto BNB"
                            width={400}
                            height={600}
                            className="w-full h-auto rounded-lg shadow-lg"
                          />
                        </div>
                        <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            Riscatto automatico dei BNB allocati
                          </h2>
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                            Quando una prediction viene cancellata, apparirà automaticamente un modal che mostra gli step per il riscatto dei BNB allocati:
                          </p>
                          <ol className="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300">
                            <li>Il sistema mostra automaticamente il modal con i dettagli della prediction cancellata</li>
                            <li>Viene visualizzata una preview dei BNB allocati che puoi riscattare</li>
                            <li>Puoi procedere con il riscatto seguendo gli step guidati mostrati nel modal</li>
                            <li>I BNB vengono restituiti automaticamente al tuo wallet</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Prediction CHIUSA) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-chiusa');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction CHIUSA
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Prediction RISOLTA) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction RISOLTA
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-risolta');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-risolta' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔵</span>
                  Prediction RISOLTA
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Tab 1 - Claim delle vincite */}
                  <div className="mb-8">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      <div className="flex-shrink-0 w-full md:w-1/3">
                        <Image
                          src="/media/tutorial/risolta.png"
                          alt="Claim delle vincite"
                          width={400}
                          height={600}
                          className="w-full h-auto rounded-lg shadow-lg"
                        />
                      </div>
                      <div className="flex-1 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          Riscatto delle vincite
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                          Se hai vinto la prediction, apparirà il tasto <strong>&quot;Claim&quot;</strong> delle vincite con i dettagli della vincita.
                        </p>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          Una volta ritirata la vincita, si vedono i dati come mostrato nell&apos;immagine con dettagli e dati della transazione.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Prediction CANCELLATA) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          handleSectionChange('prediction-cancellata');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction CANCELLATA
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Stack tecnologico) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Stack tecnologico
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Specifiche nel menu
                          if (!expandedSections.has('specifiche')) {
                            setExpandedSections(new Set([...expandedSections, 'specifiche']));
                          }
                          handleSectionChange('architettura-stack');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'specifiche' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>📋</span>
                  Specifiche
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Seleziona una sottosezione dal menu per visualizzare le specifiche tecniche dettagliate.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'architettura-stack' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🏗️</span>
                  Stack tecnologico
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Bella Napoli è costruita utilizzando tecnologie moderne e best practices per garantire scalabilità, 
                    sicurezza e una user experience ottimale. Questa sezione descrive l&apos;architettura e lo stack tecnologico utilizzato.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setStackTechPage(Math.max(0, stackTechPage - 1))}
                      disabled={stackTechPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((page) => (
                        <button
                          key={page}
                          onClick={() => setStackTechPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            stackTechPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setStackTechPage(Math.min(6, stackTechPage + 1))}
                      disabled={stackTechPage === 6}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                    {/* Pagina 0 - Framework e Core */}
                    {stackTechPage === 0 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          🚀 Framework e Core
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              Next.js 14
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Framework React full-stack utilizzato per il rendering lato server (SSR), generazione statica (SSG) 
                              e routing ottimizzato. Next.js 14 offre App Router, Server Components e ottimizzazioni automatiche.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">App Router</span>
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Server Components</span>
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">API Routes</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                              React 18
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Libreria UI per la costruzione di interfacce utente moderne e reattive. Utilizzata con componenti funzionali 
                              e hooks per la gestione dello stato e degli effetti collaterali.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 1 - Linguaggi di Programmazione */}
                    {stackTechPage === 1 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          💻 Linguaggi di programmazione
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">TypeScript 5.3</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Linguaggio principale per lo sviluppo frontend e backend. TypeScript offre type safety, 
                              autocompletamento avanzato e migliore manutenibilità del codice.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Strict Mode</span>
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Type Inference</span>
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">ES2020</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">JavaScript (ES2020+)</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Utilizzato per funzionalità specifiche e compatibilità. Il codice è transpilato da TypeScript 
                              per garantire compatibilità con browser moderni.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 2 - Styling e UI */}
                    {stackTechPage === 2 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          🎨 Styling e UI
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tailwind CSS 3.3</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Framework CSS utility-first per la costruzione di interfacce responsive e moderne. 
                              Tailwind offre classi atomiche per styling rapido e consistente.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Utility Classes</span>
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Dark Mode</span>
                              <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Responsive Design</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">PostCSS & Autoprefixer</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              PostCSS per il processing CSS e Autoprefixer per l&apos;aggiunta automatica di vendor prefixes 
                              per compatibilità cross-browser.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 3 - State Management e Data Fetching */}
                    {stackTechPage === 3 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          📊 State Management e Data Fetching
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">TanStack Query (React Query) 5.90</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Libreria per la gestione di stato server, caching, sincronizzazione e aggiornamento di dati asincroni. 
                              Offre hooks per fetch, cache, pagination e real-time updates.
                            </p>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Caching</span>
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Auto Refetch</span>
                              <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Optimistic Updates</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Valtio 2.1</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Libreria per state management proxy-based. Utilizzata per gestire stato globale in modo reattivo 
                              e performante.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 4 - Visualizzazione Dati */}
                    {stackTechPage === 4 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          📈 Visualizzazione dati
                        </h2>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Recharts 3.3</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Libreria React per la creazione di grafici e visualizzazioni dati. Utilizzata per mostrare 
                            statistiche delle predizioni, quote in tempo reale e trend.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Responsive Charts</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Customizable</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 5 - Utilities e Development Tools */}
                    {stackTechPage === 5 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          🛠️ Utilities e Development Tools
                        </h2>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pino 10.1</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Logger veloce e strutturato per Node.js. Utilizzato per logging server-side con formato JSON 
                              e supporto per pretty printing in sviluppo.
                            </p>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">ESLint 9.0</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Linter per JavaScript e TypeScript per mantenere qualità e consistenza del codice. 
                              Configurato con eslint-config-next per best practices Next.js.
                            </p>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Node-fetch 3.3</h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Implementazione fetch per Node.js. Utilizzata per HTTP requests server-side e integrazione con API esterne.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pagina 6 - Architettura (ultima pagina) */}
                    {stackTechPage === 6 && (
                      <div className="mb-8 p-6 bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 rounded-lg border border-secondary/20 dark:border-secondary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏛️ Architettura di Bella Napoli
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Struttura della directory</h3>
                          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">
                              <code>{`app/                    # Next.js App Router
├── layout.tsx           # Root layout
├── page.tsx             # Home page
├── documentation/       # Documentazione
├── bellanapoli.prediction/  # Pagine prediction
└── api/                 # API routes

components/              # Componenti React riutilizzabili
├── Header.tsx
├── Footer.tsx
├── Web3Provider.tsx
└── ...

lib/                     # Utilities e helpers
├── contracts.ts         # Funzioni smart contracts
├── wagmi.ts             # Configurazione Wagmi
└── ...

hooks/                   # Custom React hooks
└── useContracts.ts

contracts/               # Smart contracts Solidity
└── BellaNapoliPredictionFactory.sol

public/                  # Asset statici
└── media/`}</code>
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Pattern</h3>
                          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                            <li><strong>Component-Based Architecture:</strong> UI costruita con componenti React riutilizzabili</li>
                            <li><strong>Server Components:</strong> utilizzo di Server Components di Next.js per performance ottimali</li>
                            <li><strong>API Routes:</strong> Endpoint API per operazioni server-side e integrazioni esterne</li>
                            <li><strong>Custom Hooks:</strong> logica riutilizzabile estratta in custom hooks</li>
                            <li><strong>Type Safety:</strong> TypeScript per type safety end-to-end</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Prediction RISOLTA) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Tutorial nel menu
                          if (!expandedSections.has('tutorial')) {
                            setExpandedSections(new Set([...expandedSections, 'tutorial']));
                          }
                          handleSectionChange('prediction-risolta');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Prediction RISOLTA
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Database) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Database
                      </span>
                      <button
                        onClick={() => {
                          handleSectionChange('database');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'database' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🗄️</span>
                  Database
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Bella Napoli utilizza Supabase come database PostgreSQL per la gestione dei dati dell&apos;applicazione. 
                    L&apos;integrazione combina la potenza di Supabase con un sistema di autenticazione personalizzato basato su wallet Web3.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setDatabasePage(Math.max(0, databasePage - 1))}
                      disabled={databasePage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((page) => (
                        <button
                          key={page}
                          onClick={() => setDatabasePage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            databasePage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setDatabasePage(Math.min(2, databasePage + 1))}
                      disabled={databasePage === 2}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Supabase come Database */}
                  {databasePage === 0 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🗄️ Supabase come Database
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            PostgreSQL
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Supabase fornisce un database PostgreSQL completamente gestito che ospita tutti i dati dell&apos;applicazione. 
                            Il database include tabelle per profili utenti, predizioni, scommesse e altre informazioni necessarie per il funzionamento della piattaforma.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">PostgreSQL 15</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Real-time</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Row Level Security</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Storage e File System
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Supabase Storage viene utilizzato per la gestione di file statici e asset dell&apos;applicazione, 
                            come avatar utente e immagini delle predizioni. Il sistema di storage è integrato con le politiche di sicurezza 
                            per garantire accesso controllato ai file.
                          </p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            API e Client SDK
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Il client Supabase JavaScript/TypeScript fornisce un&apos;interfaccia semplice e type-safe per interagire 
                            con il database. Le query vengono eseguite direttamente dal client utilizzando l&apos;API REST di Supabase, 
                            con supporto per filtri, ordinamento e paginazione.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 1 - Sistema Custom Auth */}
                  {databasePage === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 rounded-lg border border-secondary/20 dark:border-secondary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔐 Sistema Custom Auth
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Autenticazione basata su Wallet
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Invece di utilizzare il sistema di autenticazione nativo di Supabase, Bella Napoli implementa un sistema 
                            personalizzato basato su wallet Web3. Gli utenti si autenticano firmando un messaggio (formato EIP-4361) 
                            con il loro wallet crypto, dimostrando la proprietà dell&apos;indirizzo senza bisogno di password tradizionali.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">EIP-4361</span>
                            <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Wallet Signature</span>
                            <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Nonce</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Funzioni RPC personalizzate
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Per gestire l&apos;autenticazione custom, il database utilizza funzioni PostgreSQL eseguite con 
                            SECURITY DEFINER che bypassano le Row Level Security policies. Queste funzioni permettono di creare 
                            e aggiornare profili utente in modo sicuro senza utilizzare il sistema di autenticazione standard di Supabase.
                          </p>
                          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mt-3">
                            <p className="text-xs text-gray-400 font-mono mb-2">Esempio: upsert_profile()</p>
                            <p className="text-sm text-gray-300 font-mono">
                              Funzione che crea o aggiorna un profilo utente basato sull&apos;indirizzo wallet, 
                              gestendo la firma del messaggio e i dati del profilo in modo sicuro.
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Sicurezza e validazione
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Il sistema verifica la firma del messaggio per garantire che l&apos;utente possieda effettivamente 
                            il wallet utilizzato. Le funzioni RPC utilizzano SET search_path per prevenire attacchi di search_path hijacking, 
                            garantendo un ambiente sicuro per l&apos;esecuzione delle operazioni.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Integrazione e Pattern */}
                  {databasePage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔗 Integrazione e pattern
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Client singleton
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Il client Supabase viene inizializzato come singleton per evitare multiple istanze. La configurazione 
                            include gestione automatica della sessione, refresh token e disabilitazione del rilevamento della sessione nell&apos;URL.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Singleton Pattern</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Auto Refresh</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Session Persistence</span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Pattern di accesso ai dati
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Le query al database vengono eseguite attraverso il client Supabase utilizzando metodi type-safe. 
                            Le funzioni RPC personalizzate vengono chiamate per operazioni complesse che richiedono logica server-side, 
                            mentre le query standard vengono utilizzate per operazioni CRUD semplici.
                          </p>
                          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 mt-3">
                            <p className="text-xs text-gray-400 font-mono mb-2">Pattern di Query</p>
                            <ul className="text-sm text-gray-300 font-mono space-y-1 list-disc list-inside">
                              <li>Query standard per SELECT, INSERT, UPDATE semplici</li>
                              <li>Funzioni RPC per operazioni complesse e sicurezza</li>
                              <li>Row Level Security per protezione dati a livello di tabella</li>
                            </ul>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            Note sull&apos;architettura
                          </h3>
                          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-4 rounded">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Nota:</strong> l&apos;integrazione Supabase + Custom Auth permette di combinare i vantaggi 
                              di un database PostgreSQL moderno e scalabile con un sistema di autenticazione Web3 che si allinea 
                              perfettamente con la natura della piattaforma. Questo approccio offre maggiore controllo 
                              sul processo di autenticazione mantenendo la sicurezza e le performance del database.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Stack tecnologico) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Specifiche nel menu
                          if (!expandedSections.has('specifiche')) {
                            setExpandedSections(new Set([...expandedSections, 'specifiche']));
                          }
                          handleSectionChange('architettura-stack');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Stack tecnologico
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Web3) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Web3
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Specifiche nel menu
                          if (!expandedSections.has('specifiche')) {
                            setExpandedSections(new Set([...expandedSections, 'specifiche']));
                          }
                          handleSectionChange('web3');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'web3' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>⛓️</span>
                  Web3
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Bella Napoli utilizza un stack Web3 moderno per interagire con la blockchain BNB Chain. 
                    Questa sezione descrive le librerie e i protocolli utilizzati per la connessione wallet, 
                    la gestione delle transazioni e l&apos;interazione con i contracts.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setWeb3Page(Math.max(0, web3Page - 1))}
                      disabled={web3Page === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4].map((page) => (
                        <button
                          key={page}
                          onClick={() => setWeb3Page(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            web3Page === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setWeb3Page(Math.min(4, web3Page + 1))}
                      disabled={web3Page === 4}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - RainbowKit 2.2 */}
                  {web3Page === 0 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🌈 RainbowKit 2.2
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Libreria React per la connessione wallet con UI moderna e intuitiva. Supporta MetaMask, 
                          WalletConnect, Coinbase Wallet e altri wallet popolari.
                        </p>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Uso in Bella Napoli</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            RainbowKit è utilizzato per gestire la connessione wallet degli utenti. Fornisce un&apos;interfaccia 
                            user-friendly per selezionare e connettere il proprio wallet, con supporto per tutti i principali 
                            wallet desktop e mobili. Integrato con Wagmi per la gestione dello stato della connessione.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Wallet Connection</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Multi-Wallet Support</span>
                            <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Network Switching</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 1 - Wagmi 2.19 */}
                  {web3Page === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⚡ Wagmi 2.19
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          Libreria React hooks per interagire con Ethereum e reti compatibili. Fornisce hooks per 
                          leggere e scrivere dati on-chain, gestire transazioni e monitorare lo stato del wallet.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">React Hooks</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Transaction Management</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Multi-Chain</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Viem 2.38 */}
                  {web3Page === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔧 Viem 2.38
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          Libreria TypeScript per interagire con blockchain EVM. Utilizzata da Wagmi come core library 
                          per operazioni low-level e type safety avanzata.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Type Safety</span>
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">EVM Compatible</span>
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Low-Level API</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 3 - Ethers.js 6.15 */}
                  {web3Page === 3 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⛓️ Ethers.js 6.15
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          Libreria JavaScript per interagire con la blockchain Ethereum e reti compatibili. 
                          Utilizzata per operazioni avanzate con smart contracts e gestione wallet.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Smart Contracts</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Wallet Management</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">EVM Compatible</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 4 - WalletConnect */}
                  {web3Page === 4 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🔗 WalletConnect
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                          Protocollo per connettere wallet mobili e desktop. Supporta più wallet e reti blockchain 
                          tramite standard aperti.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Multi-Wallet</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Cross-Platform</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Open Standard</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Database) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Specifiche nel menu
                          if (!expandedSections.has('specifiche')) {
                            setExpandedSections(new Set([...expandedSections, 'specifiche']));
                          }
                          handleSectionChange('database');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Database
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (General) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        General
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('smart-contracts-general');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'smart-contracts' && (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>📜</span>
                  Smart Contracts
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    Seleziona una sottosezione dal menu per visualizzare le informazioni dettagliate sui smart contracts.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'smart-contracts-general' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>📋</span>
                  General
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Bella Napoli utilizza smart contract sicuri su BNB Chain per gestire tutte le operazioni in modo decentralizzato e trasparente.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setSmartContractsGeneralPage(Math.max(0, smartContractsGeneralPage - 1))}
                      disabled={smartContractsGeneralPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3].map((page) => (
                        <button
                          key={page}
                          onClick={() => setSmartContractsGeneralPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            smartContractsGeneralPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setSmartContractsGeneralPage(Math.min(3, smartContractsGeneralPage + 1))}
                      disabled={smartContractsGeneralPage === 3}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Architettura dei Contratti */}
                  {smartContractsGeneralPage === 0 && (
                    <>
                      <div className="mb-6 p-6 bg-gradient-to-r from-secondary/10 to-secondary/5 dark:from-secondary/20 dark:to-secondary/10 rounded-lg border border-secondary/20 dark:border-secondary/30">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                          🏗️ Architettura dei Contratti
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              Factory Contract
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              Il <strong>Factory Contract</strong> è il contratto principale che contiene tutta la logica di business, 
                              le regole di funzionamento e le funzioni di controllo e amministrazione. È il &quot;cuore&quot; del sistema: 
                              definisce come vengono create le pools, gestisce le operazioni amministrative (close, reopen, resolve, cancel) 
                              e mantiene un registro centralizzato di tutte le predictions create.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              Attraverso il Factory, l&apos;owner può creare nuove pools e gestire lo stato delle predictions esistenti.
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              PredictionPool Contracts
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                              I <strong>PredictionPool Contracts</strong> sono contratti istanziati dinamicamente dal Factory per ogni singola prediction. 
                              Ogni pool contiene i <strong>dati specifici</strong> di quella prediction e gestisce 
                              le operazioni utente come le scommesse e il claim dei premi.
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                              La logica principale e le funzioni di controllo restano nel Factory: i PredictionPool Contracts si limitano a memorizzare 
                              i dati della prediction e ad eseguire le operazioni delegate dal Factory. Questa separazione garantisce sicurezza, 
                              efficienza e facilità di gestione centralizzata.
                            </p>
                          </div>
                          
                        </div>
                      </div>
                      
                      <div className="mt-2 p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg inline-block">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong className="text-cyan-400">💡 In sintesi:</strong> il Factory è il &quot;direttore&quot; che decide le regole e controlla tutto, 
                          mentre ogni PredictionPool è un &quot;contenitore&quot; specifico per i dati e le operazioni di una singola prediction.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Pagina 1 - Hardhat */}
                  {smartContractsGeneralPage === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⚙️ Hardhat
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Framework di sviluppo per Ethereum e blockchain compatibili. Utilizzato per compilazione, testing, 
                          deployment e debugging degli smart contract. Hardhat offre un ambiente di sviluppo completo con 
                          supporto per script personalizzati, plugin e network locali.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Hardhat è utilizzato come ambiente di sviluppo completo per tutti gli smart contract di Bella Napoli. 
                          Permette di compilare, testare e deployare i contratti su BNB Chain Testnet. Il framework facilita 
                          la scrittura di test automatizzati per verificare la sicurezza e la correttezza della logica dei contratti, 
                          e gestisce la configurazione delle reti (testnet e mainnet) per deployment sicuri.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Compilation</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Testing</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Deployment</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Solidity */}
                  {smartContractsGeneralPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💎 Solidity
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Linguaggio di programmazione per smart contract su blockchain EVM-compatibili. 
                          Utilizzato per scrivere la logica on-chain di Bella Napoli.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Solidity è il linguaggio utilizzato per implementare tutta la logica on-chain di Bella Napoli. 
                          Tutti gli smart contract (Factory Contract e PredictionPool Contracts) sono scritti in Solidity 0.8.24, 
                          garantendo type safety e sicurezza. Il linguaggio permette di definire la struttura dati, le funzioni 
                          di business logic, i modifier per la sicurezza e gli event per il tracking delle operazioni.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Solidity 0.8.24</span>
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">EVM Compatible</span>
                          <span className="px-3 py-1 text-xs font-mono bg-secondary/10 text-secondary rounded">Type Safety</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 3 - OpenZeppelin */}
                  {smartContractsGeneralPage === 3 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🛡️ OpenZeppelin Contracts 4.9
                      </h2>
                      <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          Libreria di smart contract sicuri e testati. Utilizzata per implementazioni standard come 
                          Ownable, ReentrancyGuard e pattern di sicurezza comuni.
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                          OpenZeppelin Contracts è utilizzato per importare e utilizzare pattern di sicurezza standard e testati. 
                          I contratti di Bella Napoli ereditano da <strong>Ownable</strong> per gestire la proprietà e i permessi 
                          amministrativi, e utilizzano <strong>ReentrancyGuard</strong> per proteggere le funzioni critiche (come 
                          claim e transfer) da attacchi di reentrancy. Questa libreria garantisce che i contratti seguano best 
                          practices di sicurezza ampiamente testate e verificate dalla community.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Ownable</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">ReentrancyGuard</span>
                          <span className="px-3 py-1 text-xs font-mono bg-primary/10 text-primary rounded">Security Patterns</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Web3) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Specifiche nel menu
                          if (!expandedSections.has('specifiche')) {
                            setExpandedSections(new Set([...expandedSections, 'specifiche']));
                          }
                          handleSectionChange('web3');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Web3
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Factory Contract) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Factory Contract
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('factory-contract');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'factory-contract' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🏭</span>
                  Factory Contract
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Intro fissa */}
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Il Factory Contract è il contratto centrale che gestisce la creazione, il controllo e l&apos;amministrazione di tutte le pools di predictions su Bella Napoli.
                    Ogni pool viene istanziata come contratto separato (PredictionPool) con un indirizzo univoco, mentre il Factory mantiene la logica di business principale e le funzioni di governance.
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Di seguito verranno descritte in dettaglio tutte le funzioni del Factory Contract e il loro utilizzo.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setFactoryContractPage(Math.max(0, factoryContractPage - 1))}
                      disabled={factoryContractPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((page) => (
                        <button
                          key={page}
                          onClick={() => setFactoryContractPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            factoryContractPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setFactoryContractPage(Math.min(8, factoryContractPage + 1))}
                      disabled={factoryContractPage === 8}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Architettura */}
                  {factoryContractPage === 0 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                        🏗️ Architettura del Factory e dei PredictionPool Contracts
                      </h3>
                    <div className="flex flex-col items-center space-y-8">
                      {/* Factory Contract */}
                      <div className="relative">
                        <div className="bg-primary text-white px-8 py-5 rounded-xl shadow-xl font-semibold text-center min-w-[300px]">
                          <div className="text-2xl mb-2">🏭</div>
                          <div className="text-lg">Factory Contract</div>
                          <div className="text-xs font-normal mt-2 opacity-90 font-mono">BellaNapoliPredictionFactory</div>
                        </div>
                        {/* Frecce verso i pool */}
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                          <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      {/* Linea connettiva */}
                      <div className="w-0.5 h-4 bg-primary/30"></div>

                      {/* PredictionPool Contracts */}
                      <div className="flex flex-wrap justify-center gap-4">
                        <div className="bg-white dark:bg-gray-800 border-2 border-primary/40 px-5 py-4 rounded-lg shadow-md text-center min-w-[220px] hover:shadow-lg transition-shadow">
                          <div className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                            <span>📊</span>
                            <span>PredictionPool</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">0x1234...5678</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border-2 border-primary/40 px-5 py-4 rounded-lg shadow-md text-center min-w-[220px] hover:shadow-lg transition-shadow">
                          <div className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                            <span>📊</span>
                            <span>PredictionPool</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">0xabcd...ef01</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border-2 border-primary/40 px-5 py-4 rounded-lg shadow-md text-center min-w-[220px] hover:shadow-lg transition-shadow">
                          <div className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                            <span>📊</span>
                            <span>PredictionPool</span>
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">0x9876...5432</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 border-2 border-dashed border-primary/30 px-5 py-4 rounded-lg shadow-md text-center min-w-[220px] opacity-60">
                          <div className="text-base font-semibold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
                            <span>📊</span>
                            <span>...</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">Più pools</div>
                        </div>
                      </div>

                      {/* Legenda */}
                      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 max-w-2xl">
                        <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                          Il Factory Contract crea e gestisce dinamicamente i PredictionPool Contracts per ogni nuova prediction.
                          Ogni pool ha un <strong>indirizzo univoco</strong> e contiene i dati specifici della prediction.
                        </p>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Pagina 1 - Elenco Funzioni */}
                  {factoryContractPage === 1 && (
                    <div className="mb-8 p-6 bg-white dark:bg-dark-card rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        📋 Funzioni del Factory Contract
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">🎯</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Create Pool</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">⏸️</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Stop BET</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">▶️</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Resume BET</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">🔒</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Close Pool</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">🔓</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Open Pool</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">🏆</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Set WINNERS SI/NO</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">❌</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Cancel Pool</span>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-lg">💰</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">Recovery Funds</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Create Pool */}
                  {factoryContractPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🎯 Create Pool
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        Crea una nuova pool di prediction. Questa funzione può essere chiamata solo dall&apos;owner del Factory e genera un nuovo contratto PredictionPool con un indirizzo univoco.
                      </p>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100 font-mono">
                          <code>{`function createPool(
    string memory _title,
    string memory _description,
    string memory _category,
    uint256 _closingDate,
    uint256 _closingBid
) external onlyOwner returns (address poolAddress)`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Pagina 3 - Stop BET e Resume BET */}
                  {factoryContractPage === 3 && (
                    <>
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          ⏸️ Stop BET
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          Mette in pausa una pool senza chiuderla, sospendendo temporaneamente le scommesse. Utile per gestire situazioni critiche o problemi tecnici.
                        </p>
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-100 font-mono">
                            <code>{`function setPoolEmergencyStop(
    address _poolAddress,
    bool _stop
) external onlyOwner`}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          ▶️ Resume BET
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          Disattiva la pausa di una pool, permettendo nuovamente le scommesse dopo un&apos;interruzione temporanea.
                        </p>
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-100 font-mono">
                            <code>{`function setPoolEmergencyStop(
    address _poolAddress,
    bool _stop
) external onlyOwner`}</code>
                          </pre>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pagina 4 - Close Pool e Open Pool */}
                  {factoryContractPage === 4 && (
                    <>
                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          🔒 Close Pool
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          Chiude una pool esistente, impedendo nuove scommesse. La pool deve essere chiusa prima di poter assegnare SETWinners. 
                        </p>
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-100 font-mono">
                            <code>{`function closePool(address _poolAddress) external onlyOwner`}</code>
                          </pre>
                        </div>
                      </div>

                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          🔓 Open Pool
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                          Riapre una pool chiusa, permettendo nuovamente le scommesse.
                        </p>
                        <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                          <pre className="text-sm text-gray-100 font-mono">
                            <code>{`function reopenPool(address _poolAddress) external onlyOwner`}</code>
                          </pre>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pagina 5 - Set WINNERS SI/NO */}
                  {factoryContractPage === 5 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏆 Set WINNERS SI/NO
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        Imposta il vincitore della prediction (SI o NO). Permette ai vincitori di reclamare i premi.
                      </p>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100 font-mono">
                          <code>{`function setPoolWinner(address _poolAddress, bool _winner) external onlyOwner`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Pagina 6 - Cancel Pool */}
                  {factoryContractPage === 6 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ❌ Cancel Pool
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                        Cancella una pool di prediction. Quando una pool viene cancellata, tutti i partecipanti possono reclamare il rimborso completo della loro scommessa.
                      </p>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100 font-mono">
                          <code>{`function cancelPoolPrediction(
    address _poolAddress,
    string memory _reason
) external onlyOwner`}</code>
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Pagina 7 - Recovery Funds */}
                  {factoryContractPage === 7 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💰 Recovery Funds
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        Recupera i fondi non reclamati da una pool cancellata o risolta. Trasferisce tutti i fondi residui 
                        al fee wallet. Utile per gestire fondi non reclamati, polvere o eventuali errori tecnici.
                      </p>
                      <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto mb-4">
                        <pre className="text-sm text-gray-100 font-mono">
                          <code>{`function recoverCancelledPoolFunds(
    address _poolAddress
) external onlyOwner`}</code>
                        </pre>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-300"><strong>Parametri:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                          <li><code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">_poolAddress</code> - Indirizzo della pool</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-300 mt-3"><strong>Validazioni:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                          <li>La pool deve esistere</li>
                          <li>La pool deve essere cancellata o risolta (winnerSet = true)</li>
                        </ul>
                        <p className="text-gray-600 dark:text-gray-300 mt-3"><strong>Effetti:</strong></p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-300 ml-4">
                          <li>Trasferisce tutti i fondi residui al fee wallet</li>
                          <li>Chiama <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">emergencyRecoverFunds()</code> sul contratto PredictionPool</li>
                          <li>Emette evento <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">PoolFundsRecovered</code></li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Pagina 8 - Fees */}
                  {factoryContractPage === 8 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        💵 Commissioni (Fees)
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Percentuale delle Fees</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Le commissioni sono calcolate sul <strong>piatto totale</strong> (somma di tutte le scommesse YES e NO) 
                            e ammontano a <strong>1.5%</strong> del totale.
                          </p>
                          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
                            <pre className="text-sm text-gray-100 font-mono">
                              <code>{`FEE_PERCENTAGE = 150 basis points = 1.5%
BASIS_POINTS = 10000

totalFees = (totalPot * FEE_PERCENTAGE) / BASIS_POINTS
totalFees = (totalPot * 150) / 10000
totalFees = totalPot * 0.015`}</code>
                            </pre>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Calcolo delle Fees</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                            Le fee vengono calcolate e trasferite al fee wallet quando il primo vincitore reclama i premi. 
                            Le fee vengono prelevate dal piatto totale prima della distribuzione dei premi ai vincitori.
                          </p>
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                              <strong>Esempio:</strong> se il piatto totale è 1000 BNB, le fee sono 15 BNB (1.5%). 
                              Il net pot disponibile per i vincitori è 985 BNB.
                            </p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Fee Wallet</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">
                            Le commissioni vengono trasferite al fee wallet configurato.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (General) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('smart-contracts-general');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        General
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Factory: MATH) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Factory: MATH
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('factory-math');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'factory-math' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>📋</span>
                  Esempio di una prediction
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    Di seguito un esempio pratico con 5 giocatori che scommettono su una prediction per comprendere come funziona il calcolo dei premi e la distribuzione dei fondi.
                  </p>

                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setFactoryMathPage(Math.max(0, factoryMathPage - 1))}
                      disabled={factoryMathPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2].map((page) => (
                        <button
                          key={page}
                          onClick={() => setFactoryMathPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            factoryMathPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setFactoryMathPage(Math.min(2, factoryMathPage + 1))}
                      disabled={factoryMathPage === 2}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Scommesse dei Giocatori */}
                  {factoryMathPage === 0 && (
                    <>
                      {/* Scenario */}
                      <div className="mb-6 p-4 bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-700 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-200 dark:text-gray-300 mb-3">
                          📌 Scenario: &quot;Si scioglierà il sangue di San Gennaro?&quot;
                        </h3>
                        <p className="text-sm text-gray-200 dark:text-gray-300">
                          <strong className="text-cyan-400">Risultato finale:</strong> SI (Il sangue si è sciolto)
                        </p>
                      </div>

                      <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                        {/* Scommesse */}
                        <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          💰 Scommesse dei Giocatori
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:text-white">Giocatore</th>
                                <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">Scommessa</th>
                                <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:text-white">Importo (BNB)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="bg-green-50 dark:bg-green-900/20">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">Gennaro</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">SI</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">10 BNB</td>
                              </tr>
                              <tr className="bg-red-50 dark:bg-red-900/20">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">Pasquale</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">NO</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">5 BNB</td>
                              </tr>
                              <tr className="bg-green-50 dark:bg-green-900/20">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">Concetta</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">SI</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">20 BNB</td>
                              </tr>
                              <tr className="bg-red-50 dark:bg-red-900/20">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">Ciro</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold">NO</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">15 BNB</td>
                              </tr>
                              <tr className="bg-green-50 dark:bg-green-900/20">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white font-medium">Assunta</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold">SI</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">5 BNB</td>
                              </tr>
                            </tbody>
                            <tfoot>
                              <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white">TOTALE</td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white">
                                  <span className="text-green-600 dark:text-green-400">SI: 35 BNB</span> | <span className="text-red-600 dark:text-red-400">NO: 20 BNB</span>
                                </td>
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center text-sm text-gray-900 dark:text-white font-mono">55 BNB</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>
                    </>
                  )}

                  {/* Pagina 1 - Calcolo dei Premi */}
                  {factoryMathPage === 1 && (
                    <div className="mb-8 p-4 bg-transparent border border-cyan-400/30 dark:border-cyan-400/30 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🧮 Calcolo dei premi
                      </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Totale piatto (SI + NO):</span>
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">55 BNB</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Fee (1.5%):</span>
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">0.825 BNB</span>
                          </div>
                          <div className="flex justify-between items-center border-t border-gray-300 dark:border-gray-700 pt-2">
                            <span className="text-gray-600 dark:text-gray-300 font-semibold">Net Pot (per i vincitori):</span>
                            <span className="font-mono font-bold text-primary">54.175 BNB</span>
                          </div>
                          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded">
                            <p className="text-gray-600 dark:text-gray-300 mb-2">
                              <strong>Formula:</strong> ogni vincitore riceve proporzionalmente alla sua scommessa
                            </p>
                            <p className="text-gray-600 dark:text-gray-300 text-xs font-mono">
                              Vincita = (Sua scommessa / Totale SI) × Net Pot
                            </p>
                          </div>
                        </div>
                    </div>
                  )}

                  {/* Pagina 2 - Risultati Finali */}
                  {factoryMathPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                          🏆 Risultati finali
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Vincitori */}
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                              <span>✅</span> Vincitori (SI)
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Gennaro</span>
                                <span className="font-mono font-semibold text-green-700 dark:text-green-400">
                                  10 BNB → <span className="text-green-800 dark:text-green-300">15.48 BNB</span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Concetta</span>
                                <span className="font-mono font-semibold text-green-700 dark:text-green-400">
                                  20 BNB → <span className="text-green-800 dark:text-green-300">30.96 BNB</span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Assunta</span>
                                <span className="font-mono font-semibold text-green-700 dark:text-green-400">
                                  5 BNB → <span className="text-green-800 dark:text-green-300">7.74 BNB</span>
                                </span>
                              </div>
                              <div className="mt-3 pt-2 border-t border-green-300 dark:border-green-700">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-green-800 dark:text-green-300">Totale vincite:</span>
                                  <span className="font-mono font-bold text-green-800 dark:text-green-300">54.175 BNB</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Perdenti */}
                          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <h4 className="font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                              <span>❌</span> Perdenti (NO)
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Pasquale</span>
                                <span className="font-mono font-semibold text-red-700 dark:text-red-400">
                                  5 BNB → <span className="text-red-800 dark:text-red-300">0 BNB</span>
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-700 dark:text-gray-300">Ciro</span>
                                <span className="font-mono font-semibold text-red-700 dark:text-red-400">
                                  15 BNB → <span className="text-red-800 dark:text-red-300">0 BNB</span>
                                </span>
                              </div>
                              <div className="mt-3 pt-2 border-t border-red-300 dark:border-red-700">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-red-800 dark:text-red-300">Totale perdite:</span>
                                  <span className="font-mono font-bold text-red-800 dark:text-red-300">20 BNB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Note */}
                        <div className="mt-6 p-4 bg-slate-900 dark:bg-slate-900 border border-slate-700 dark:border-slate-700 rounded-lg">
                          <p className="text-sm text-gray-200 dark:text-gray-300">
                            <strong className="text-cyan-400">💡 Nota:</strong> i vincitori ricevono il loro investimento iniziale più la loro quota proporzionale del piatto dei perdenti (meno le fee). 
                            I perdenti perdono completamente la loro scommessa.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Factory Contract) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('factory-contract');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Factory Contract
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (PredictionPool Contracts) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        PredictionPool Contracts
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('prediction-pool-contract');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'prediction-pool-contract' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🤝</span>
                  PredictionPool Contracts
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setPredictionPoolContractPage(Math.max(0, predictionPoolContractPage - 1))}
                      disabled={predictionPoolContractPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1, 2, 3, 4, 5, 6].map((page) => (
                        <button
                          key={page}
                          onClick={() => setPredictionPoolContractPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            predictionPoolContractPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setPredictionPoolContractPage(Math.min(6, predictionPoolContractPage + 1))}
                      disabled={predictionPoolContractPage === 6}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Riassunto */}
                  {predictionPoolContractPage === 0 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Il <strong>PredictionPool Contract</strong> è un contratto creato dinamicamente dal Factory per ogni singola prediction. 
                        Ogni pool contiene i dati specifici della prediction e gestisce le operazioni degli utenti come le scommesse e il claim dei premi.
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Quando viene creata una nuova prediction, il Factory istanzia un nuovo PredictionPool Contract con i parametri configurati. 
                        Questi parametri definiscono le caratteristiche della prediction e ne determinano il comportamento.
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Di seguito vengono descritti tutti i parametri che vengono configurati nel contratto durante la creazione della pool.
                      </p>
                    </div>
                  )}

                  {/* Pagina 1 - Title */}
                  {predictionPoolContractPage === 1 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📝 Title
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        Il titolo della prediction è una stringa che descrive brevemente l&apos;evento su cui si sta scommettendo. 
                        Questo campo viene utilizzato per identificare e visualizzare la prediction nella piattaforma.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">string</span> title
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 2 - Description */}
                  {predictionPoolContractPage === 2 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📄 Description
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        La descrizione fornisce dettagli aggiuntivi sulla prediction. Questo campo permette di spiegare meglio 
                        l&apos;evento su cui si sta scommettendo, fornendo contesto e informazioni utili agli utenti.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">string</span> description
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 3 - Category */}
                  {predictionPoolContractPage === 3 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏷️ Category
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        La categoria permette di classificare e organizzare le predictions. Questo campo aiuta gli utenti 
                        a trovare facilmente le predictions di loro interesse filtrando per categoria.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">string</span> category
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 4 - ClosingDate */}
                  {predictionPoolContractPage === 4 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        📅 ClosingDate
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        La data di chiusura delle scommesse (closing date) determina fino a quando gli utenti possono piazzare scommesse 
                        sulla prediction. Dopo questa data, non sarà più possibile scommettere.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">uint256</span> closingDate
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 5 - ClosingBid */}
                  {predictionPoolContractPage === 5 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        ⏰ ClosingBid
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        La data di chiusura della prediction (closing bid) è la data in cui la prediction viene chiusa 
                        in attesa di annunciare i risultati.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">uint256</span> closingBid
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Pagina 6 - Factory Address */}
                  {predictionPoolContractPage === 6 && (
                    <div className="mb-8 p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg border border-primary/20 dark:border-primary/30">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        🏭 Factory Address
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                        L&apos;indirizzo del Factory Contract viene salvato nel PredictionPool per permettere la comunicazione 
                        tra i due contratti. La pool utilizza questo riferimento per delegare operazioni di controllo al Factory.
                      </p>
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">
                          <span className="text-primary">address</span> factory
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (Factory: MATH) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('factory-math');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Factory: MATH
                      </span>
                    </div>

                    {/* Freccia destra - Pagina successiva (Open Source su BSC) */}
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        Open Source su BSC
                      </span>
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('open-source-bsc');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina successiva"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'open-source-bsc' && (
              <div
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="mb-4">
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block text-center md:text-left">
                    DOCUMENTAZIONE
                  </span>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <span>🔓</span>
                  Open Source su BSC
                </h1>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  {/* Indicatore pagina - Frecce e Pallini */}
                  <div className="mb-6 flex items-center justify-center gap-3">
                    {/* Freccia sinistra - Precedente */}
                    <button
                      onClick={() => setOpenSourceBscPage(Math.max(0, openSourceBscPage - 1))}
                      disabled={openSourceBscPage === 0}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina precedente"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* Pallini */}
                    <div className="flex items-center gap-2">
                      {[0, 1].map((page) => (
                        <button
                          key={page}
                          onClick={() => setOpenSourceBscPage(page)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            openSourceBscPage === page
                              ? 'bg-primary w-8 dark:bg-primary'
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                          }`}
                          aria-label={`Vai alla pagina ${page + 1}`}
                        />
                      ))}
                    </div>

                    {/* Freccia destra - Successivo */}
                    <button
                      onClick={() => setOpenSourceBscPage(Math.min(1, openSourceBscPage + 1))}
                      disabled={openSourceBscPage === 1}
                      className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                      aria-label="Pagina successiva"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Pagina 0 - Spiegazione Certificazione */}
                  {openSourceBscPage === 0 && (
                    <div className="mb-8 p-6 bg-transparent rounded-lg border border-cyan-400/30 dark:border-cyan-400/30">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      ✅ Contratti verificati
                    </h2>
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        Tutti gli smart contract di Bella Napoli sono stati <strong>verificati su BSC (Binance Smart Chain)</strong>. 
                        Il codice sorgente è completamente <strong>open source</strong> e leggibile pubblicamente su BSCScan.
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        La verifica dei contratti garantisce che il codice eseguito on-chain corrisponda esattamente al codice sorgente pubblicato, 
                        permettendo a chiunque di ispezionare, auditare e comprendere la logica degli smart contract.
                      </p>
                      <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                          <strong>🔍 Trasparenza e Sicurezza:</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-green-700 dark:text-green-300">
                          <li>Codice sorgente completamente verificato e pubblico</li>
                          <li>Possibilità di auditare tutte le funzioni e la logica di business</li>
                          <li>Verifica della corrispondenza tra bytecode e sorgente</li>
                          <li>Massima trasparenza per gli utenti</li>
                        </ul>
                      </div>
                      <div className="mt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          🏭 Factory Contract
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                          Il Factory Contract è il contratto principale che gestisce la creazione e l'amministrazione di tutte le prediction pools. 
                          Puoi visualizzare il codice sorgente completo e verificato su BSCScan.
                        </p>
                        <a
                          href="https://testnet.bscscan.com/address/0x3C16d0e1aF0a290ad47ea35214D32c88F910b846"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Visualizza Factory Contract su BSCScan
                        </a>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Pagina 1 - Lista PredictionPool Contracts */}
                  {openSourceBscPage === 1 && (
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                        📋 Lista PredictionPool Contracts attivi
                      </h2>
                      {loadingPools ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400">Caricamento contratti...</p>
                        </div>
                      ) : poolContracts.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-600 dark:text-gray-400">Nessun contratto disponibile.</p>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {poolContracts
                              .slice(poolContractsPage * POOLS_PER_PAGE, (poolContractsPage + 1) * POOLS_PER_PAGE)
                              .map((pool) => (
                                <a
                                  key={pool.id}
                                  href={`https://testnet.bscscan.com/address/${pool.pool_address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 bg-transparent rounded-lg border border-cyan-400/30 dark:border-cyan-400/30 hover:border-cyan-400/50 dark:hover:border-cyan-400/50 transition-all"
                                >
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                                        {pool.title}
                                      </h3>
                                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1 truncate">
                                        {pool.pool_address}
                                      </p>
                                    </div>
                                    <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                </a>
                              ))}
                          </div>
                          
                          {/* Paginazione contratti */}
                          {Math.ceil(poolContracts.length / POOLS_PER_PAGE) > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-3">
                              {/* Freccia sinistra - Precedente */}
                              <button
                                onClick={() => setPoolContractsPage(Math.max(0, poolContractsPage - 1))}
                                disabled={poolContractsPage === 0}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Pagina precedente"
                              >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>

                              {/* Pallini */}
                              <div className="flex items-center gap-2">
                                {Array.from({ length: Math.ceil(poolContracts.length / POOLS_PER_PAGE) }).map((_, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setPoolContractsPage(index)}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                      poolContractsPage === index
                                        ? 'bg-primary w-8 dark:bg-primary'
                                        : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                                    }`}
                                    aria-label={`Vai alla pagina ${index + 1}`}
                                  />
                                ))}
                              </div>

                              {/* Freccia destra - Successivo */}
                              <button
                                onClick={() => setPoolContractsPage(Math.min(Math.ceil(poolContracts.length / POOLS_PER_PAGE) - 1, poolContractsPage + 1))}
                                disabled={poolContractsPage >= Math.ceil(poolContracts.length / POOLS_PER_PAGE) - 1}
                                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                                aria-label="Pagina successiva"
                              >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* Frecce di navigazione */}
                  <div className="mt-6 flex items-center justify-between">
                    {/* Freccia sinistra - Pagina precedente (PredictionPool Contracts) */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          // Espandi la sezione Smart Contracts nel menu
                          if (!expandedSections.has('smart-contracts')) {
                            setExpandedSections(new Set([...expandedSections, 'smart-contracts']));
                          }
                          handleSectionChange('prediction-pool-contract');
                          setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all hover:scale-110"
                        aria-label="Vai alla pagina precedente"
                      >
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium text-center break-words max-w-[120px]">
                        PredictionPool Contracts
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                  Vai alla dApp
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden flex flex-col items-start gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                  Vai alla dApp
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
