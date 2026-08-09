import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileArchive, AlertTriangle, History, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useImportHistory } from '@/hooks/useImportHistory';
import {
  parseBestiaryZip,
  runBestiaryImport,
  type ParsedBatch,
  type ImportResult,
} from '@/lib/bestiaryImport';
import type { ExtendedMonster } from '@/types/dnd5e';

type ConflictMode = 'keep' | 'update' | 'ask';

interface BestiaryImportDialogProps {
  monsters: ExtendedMonster[];
  onImported: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Nueva',
  existing: 'Ya existe',
  updatable: 'Actualizable',
  error: 'Error',
};

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'default',
  existing: 'secondary',
  updatable: 'outline',
  error: 'destructive',
};

export const BestiaryImportDialog = ({ monsters, onImported }: BestiaryImportDialogProps) => {
  const { user, isGuest } = useAuth();
  const { history, logImport } = useImportHistory();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [batch, setBatch] = useState<ParsedBatch | null>(null);
  const [conflictMode, setConflictMode] = useState<ConflictMode>('keep');
  const [individualUpdates, setIndividualUpdates] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ImportResult | null>(null);

  const canImport = !!user && !isGuest;

  const reset = () => {
    setBatch(null);
    setResult(null);
    setProgress({ done: 0, total: 0 });
    setIndividualUpdates(new Set());
    setConflictMode('keep');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    setResult(null);
    try {
      const parsed = await parseBestiaryZip(file, monsters as unknown as Record<string, any>[]);
      setBatch(parsed);
      setIndividualUpdates(new Set());
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo leer el ZIP');
      setBatch(null);
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const updateKeys = useMemo(() => {
    if (!batch) return new Set<string>();
    if (conflictMode === 'update') {
      return new Set(batch.creatures.filter(c => c.existingId).map(c => c.key));
    }
    if (conflictMode === 'ask') return individualUpdates;
    return new Set<string>();
  }, [batch, conflictMode, individualUpdates]);

  const toggleIndividual = (key: string) => {
    setIndividualUpdates(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!batch || !user) return;
    setImporting(true);
    setProgress({ done: 0, total: batch.counts.total });
    try {
      const res = await runBestiaryImport({
        batch,
        userId: user.id,
        updateKeys,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setResult(res);
      await logImport({
        source: batch.source,
        file_name: batch.fileName,
        total: batch.counts.total,
        created_count: res.created,
        updated_count: res.updated,
        skipped_count: res.skipped,
        error_count: res.errors.length,
        errors: res.errors,
      });
      onImported();
      toast.success(`Importación completada: ${res.created} nuevas, ${res.updated} actualizadas`);
    } catch (err: any) {
      toast.error(err?.message || 'Error durante la importación');
    } finally {
      setImporting(false);
    }
  };

  const downloadErrors = (errors: { name: string; external_id: string; message: string }[], label: string) => {
    const blob = new Blob([JSON.stringify(errors, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores-importacion-${label}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!canImport) return null;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setOpen(true)}
      >
        <FileArchive className="w-4 h-4" />
        Importar criaturas
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (importing) return;
          setOpen(next);
          if (!next) reset();
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileArchive className="w-5 h-5" />
              Importar bestiario
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="import" className="flex-1 min-h-0 flex flex-col">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="history" className="gap-1">
                <History className="w-3.5 h-3.5" /> Historial
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="flex-1 min-h-0 flex flex-col gap-3 mt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />

              {!batch && !result && (
                <div className="border border-dashed rounded-lg p-8 text-center space-y-3">
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Selecciona un ZIP generado por el Conversor de Bestiario
                    <br />
                    (creatures.json + images/ + tokens/)
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={parsing} className="gap-2">
                    {parsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {parsing ? 'Analizando...' : 'Seleccionar ZIP'}
                  </Button>
                </div>
              )}

              {batch && !result && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                    <StatBox label="Del lote" value={batch.counts.total} />
                    <StatBox label="Nuevas" value={batch.counts.new} />
                    <StatBox label="Existentes" value={batch.counts.existing} />
                    <StatBox label="Actualizables" value={batch.counts.updatable} />
                    <StatBox label="Errores" value={batch.counts.errors} />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Criaturas ya existentes</Label>
                    <RadioGroup
                      value={conflictMode}
                      onValueChange={(v) => setConflictMode(v as ConflictMode)}
                      className="flex flex-wrap gap-4"
                      disabled={importing}
                    >
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="keep" /> Mantener las existentes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="update" /> Actualizar las existentes
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <RadioGroupItem value="ask" /> Preguntar individualmente
                      </label>
                    </RadioGroup>
                  </div>

                  <ScrollArea className="flex-1 min-h-[180px] border rounded-md">
                    <div className="divide-y">
                      {batch.creatures.map((c) => (
                        <div key={`${c.key}-${c.name}`} className="flex items-center gap-2 px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{c.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {c.source} · {c.external_id || 'sin id'}
                              {c.error ? ` · ${c.error}` : ''}
                            </p>
                          </div>
                          {c.status === 'updatable' && conflictMode === 'ask' && (
                            <Button
                              size="sm"
                              variant={individualUpdates.has(c.key) ? 'default' : 'outline'}
                              className="h-7 text-[11px]"
                              onClick={() => toggleIndividual(c.key)}
                            >
                              {individualUpdates.has(c.key) ? 'Actualizar' : 'Mantener actual'}
                            </Button>
                          )}
                          <Badge variant={STATUS_VARIANT[c.status]} className="text-[10px] shrink-0">
                            {STATUS_LABEL[c.status]}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {batch.counts.updatable > 0 && conflictMode === 'ask' && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Estas criaturas tienen una actualización disponible.
                    </p>
                  )}

                  {importing && (
                    <div className="space-y-1">
                      <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} />
                      <p className="text-xs text-center text-muted-foreground">
                        Importando... {progress.done} / {progress.total}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={reset} disabled={importing}>Cancelar</Button>
                    <Button onClick={handleConfirm} disabled={importing} className="gap-2">
                      {importing && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirmar importación
                    </Button>
                  </div>
                </>
              )}

              {result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    Importación finalizada
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <StatBox label="Importadas" value={result.created} />
                    <StatBox label="Actualizadas" value={result.updated} />
                    <StatBox label="Existentes" value={result.skipped} />
                    <StatBox label="Errores" value={result.errors.length} />
                  </div>
                  {result.errors.length > 0 && (
                    <>
                      <ScrollArea className="max-h-40 border rounded-md">
                        <div className="divide-y">
                          {result.errors.map((e, i) => (
                            <div key={i} className="px-3 py-2">
                              <p className="text-sm">{e.name}</p>
                              <p className="text-[11px] text-destructive">{e.message}</p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => downloadErrors(result.errors, batch?.fileName || 'lote')}
                      >
                        <Download className="w-4 h-4" /> Descargar informe de errores
                      </Button>
                    </>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={reset}>Importar otro lote</Button>
                    <Button onClick={() => { setOpen(false); reset(); }}>Cerrar</Button>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="flex-1 min-h-0 mt-3">
              <ScrollArea className="h-[50vh] pr-2">
                {history.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Todavía no hay importaciones</p>
                ) : (
                  <div className="space-y-2">
                    {history.map(h => (
                      <div key={h.id} className="border rounded-md p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">
                            {new Date(h.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric', month: 'long', year: 'numeric',
                            })}
                          </p>
                          <Badge variant="secondary" className="text-[10px]">{h.source}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {h.total} criaturas · {h.created_count} nuevas · {h.skipped_count} existentes · {h.updated_count} actualizadas · {h.error_count} errores
                        </p>
                        {h.error_count > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-[11px]"
                            onClick={() => downloadErrors(h.errors, h.id)}
                          >
                            <Download className="w-3.5 h-3.5" /> Informe de errores
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};

const StatBox = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-md border bg-muted/30 py-2">
    <p className="text-lg font-semibold leading-none">{value}</p>
    <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
  </div>
);
