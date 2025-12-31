import React, { useState, useEffect, useRef } from 'react';
import { Plus, Download, Upload, FlaskConical, Sparkles, AlertTriangle, X } from 'lucide-react';
import { MainLayout } from './components/layout/MainLayout';
import { Sidebar } from './components/layout/Sidebar';
import { FileTree } from './components/explorer/FileTree';
import { Editor } from './components/editor/Editor';
import { CommandPalette } from './components/ui/CommandPalette';
import { TagList } from './components/explorer/TagList';
import { GraphView } from './components/graph/GraphView';
import { SocratesPanel } from './components/ai/SocratesPanel';
import { MorningFlow } from './components/ai/MorningFlow';
import { SmartCreateModal } from './components/ai/SmartCreateModal';
import { useVault } from './hooks/useVault';
import { useAI } from './hooks/useAI';
import { ExportService } from './services/exportService';

const App: React.FC = () => {
  const vault = useVault();
  const ai = useAI();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSmartCreateOpen, setIsSmartCreateOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{id: string, name: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') { e.preventDefault(); setIsCommandPaletteOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); setIsSmartCreateOpen(true); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'g') { e.preventDefault(); vault.setViewMode(prev => prev === 'graph' ? 'editor' : 'graph'); }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [vault.setViewMode]);

  const handleSmartCreate = async (thought: string) => {
    const newNote = vault.addEntity('file', null, "Анализ...", thought);
    await vault.executeSmartSave(newNote.id);
  };

  const handleMorningComplete = (reflection: string, analysis: any) => {
    const dateStr = new Date().toLocaleDateString('ru-RU');
    const noteContent = `# Рефлексия от ${dateStr}\n\n## Мои мысли:\n${reflection}\n\n## Анализ ИИ:\n${analysis.analysis}\n\n## План на день:\n${analysis.briefing}\n\n#журнал #рефлексия`;
    vault.addEntity('file', null, analysis.title || `Журнал: ${dateStr}`, noteContent);
    ai.completeReflection(reflection, analysis.briefing);
  };

  const attemptDelete = (id: string) => {
    const entity = vault.entities.find(e => e.id === id);
    if (!entity) return;
    
    const hasChildren = vault.entities.some(e => e.parentId === id);
    if (entity.type === 'folder' && hasChildren) {
      setDeleteConfirmation({id, name: entity.name});
    } else {
      vault.deleteEntity(id);
    }
  };

  return (
    <>
      {ai.aiState.morningFlowStep !== 'complete' && (
        <MorningFlow 
          step={ai.aiState.morningFlowStep as any}
          onComplete={handleMorningComplete}
          onFinish={ai.finishBriefing}
          currentBriefing={ai.currentBriefing}
        />
      )}

      <SmartCreateModal 
        isOpen={isSmartCreateOpen}
        onClose={() => setIsSmartCreateOpen(false)}
        onCreate={handleSmartCreate}
      />

      {deleteConfirmation && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-red-500/30 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Удалить папку?</h3>
            <p className="text-gray-500 text-sm text-center mb-8">
              Папка <span className="text-gray-300 font-bold">"{deleteConfirmation.name}"</span> не пуста. Все заметки внутри будут удалены безвозвратно.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDeleteConfirmation(null)}
                className="py-3 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl font-bold transition-all"
              >
                Отмена
              </button>
              <button 
                onClick={() => { vault.deleteEntity(deleteConfirmation.id); setDeleteConfirmation(null); }}
                className="py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/20"
              >
                Удалить всё
              </button>
            </div>
          </div>
        </div>
      )}

      <MainLayout
        sidebar={
          <Sidebar 
            onAddFile={() => setIsSmartCreateOpen(true)}
            onAddFolder={() => vault.addEntity('folder')}
            onDailyNote={vault.createDailyNote}
            searchQuery={vault.searchQuery}
            onSearchChange={vault.setSearchQuery}
          >
            <div className="px-4 py-2 mb-2 flex items-center justify-between border-b border-white/5 bg-black/10 group">
              <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">Архив</span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button onClick={() => { if(confirm("Загрузить тестовый мир?")) vault.loadTestWorld(); }} className="text-gray-600 hover:text-purple-400" title="Тестовый мир"><FlaskConical size={12}/></button>
                 <button onClick={() => ExportService.downloadVault(vault.entities)} className="text-gray-600 hover:text-gray-300"><Download size={12}/></button>
                 <button onClick={() => fileInputRef.current?.click()} className="text-gray-600 hover:text-gray-300"><Upload size={12}/></button>
              </div>
            </div>
            <FileTree 
              entities={vault.entities}
              filteredEntities={vault.filteredEntities}
              activeId={vault.activeId}
              onSelect={(id) => { vault.setActiveId(id); vault.setViewMode('editor'); }}
              onDelete={attemptDelete}
              onMove={vault.moveEntity}
              onRename={vault.renameEntity}
              expandedFolders={vault.expandedFolders}
              toggleFolder={vault.toggleFolder}
            />
            <TagList 
              tagsMap={vault.tagsMap} 
              selectedTag={vault.selectedTag} 
              onTagSelect={vault.setSelectedTag}
              onGarden={vault.gardenTags}
            />
            <input type="file" ref={fileInputRef} onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const data = await ExportService.importVault(file);
                if (confirm('Импортировать данные? Текущий архив будет заменен.')) vault.setEntities(data);
              }
            }} className="hidden" accept=".json" />
          </Sidebar>
        }
      >
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {vault.viewMode === 'graph' ? (
              <div className="flex-1 flex flex-col relative bg-[#0a0a0a]">
                <div className="absolute top-6 left-6 z-20">
                   <button 
                     onClick={() => vault.setViewMode('editor')}
                     className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold shadow-2xl transition-all active:scale-95 flex items-center gap-2"
                   >
                     <Plus size={14} className="rotate-45" /> Закрыть граф
                   </button>
                </div>
                <GraphView 
                  entities={vault.entities} 
                  activeId={vault.activeId} 
                  onNodeClick={(id) => { vault.setActiveId(id); vault.setViewMode('editor'); }} 
                />
              </div>
            ) : vault.activeEntity && vault.activeEntity.type === 'file' ? (
              <Editor 
                activeEntity={vault.activeEntity}
                entities={vault.entities}
                onUpdateName={vault.updateActiveName}
                onUpdateContent={vault.updateActiveContent}
                onNavigateByName={vault.openNoteByName}
                onNavigateById={vault.setActiveId}
                showBacklinks={vault.showBacklinks}
                onToggleBacklinks={() => vault.setShowBacklinks(!vault.showBacklinks)}
                canGoBack={vault.canGoBack}
                canGoForward={vault.canGoForward}
                onGoBack={vault.goBack}
                onGoForward={vault.goForward}
                onToggleStar={vault.toggleStar}
                viewMode={vault.viewMode}
                onSetViewMode={vault.setViewMode}
                onToggleSocrates={ai.toggleSocrates}
                isSocratesOpen={ai.aiState.isSocratesOpen}
                onSmartSave={vault.executeSmartSave}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-700 bg-[#0f0f0f]">
                <div className="p-8 bg-white/5 rounded-[40px] border border-white/5 mb-8 shadow-2xl">
                   <Sparkles size={120} strokeWidth={0.5} className="text-purple-500/20" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Ваш цифровой разум</h2>
                <p className="text-gray-500 mt-4 max-w-sm text-center leading-relaxed">
                  Создайте новую смарт-заметку или выберите существующую из архива слева.
                </p>
                <button 
                  onClick={() => setIsSmartCreateOpen(true)}
                  className="mt-10 px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl transition-all shadow-xl shadow-purple-900/30 font-bold flex items-center gap-3"
                >
                  <Plus size={20} /> Записать идею
                </button>
              </div>
            )}
          </div>

          {ai.aiState.isSocratesOpen && vault.activeEntity && (
            <SocratesPanel 
              noteContent={vault.activeEntity.content || ''}
              onClose={ai.toggleSocrates}
              history={ai.chatHistory}
              setHistory={ai.setChatHistory}
            />
          )}
        </div>
      </MainLayout>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        entities={vault.entities}
        onSelect={(id) => { vault.setActiveId(id); vault.setViewMode('editor'); }}
      />
    </>
  );
};

export default App;