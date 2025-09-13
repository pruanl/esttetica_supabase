import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

import { ProceduresService } from '../services/proceduresService'
import type { Procedure } from '../types/database'
import { ProcedureForm } from '../components/ProcedureForm'
import { ConfirmationAlert } from '../components/ConfirmationAlert'
import { useIsMobile } from '../hooks/use-mobile'
import { toast } from 'sonner'

export function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [procedureToDelete, setProcedureToDelete] = useState<Procedure | null>(null);
  const [inUseAlertOpen, setInUseAlertOpen] = useState(false);
  const isMobile = useIsMobile()

  useEffect(() => {
    loadProcedures()
  }, [])

  useEffect(() => {
    filterProcedures()
  }, [procedures, searchTerm])

  const loadProcedures = async () => {
    try {
      setLoading(true)
      const data = await ProceduresService.getAll()
      setProcedures(data)
    } catch (error) {
      console.error('Erro ao carregar procedimentos:', error)
    } finally {
      setLoading(false)
    }
  }



  const filterProcedures = () => {
    let filtered = procedures

    if (searchTerm) {
      filtered = filtered.filter(procedure =>
        procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        procedure.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredProcedures(filtered)
  }

  const handleDelete = (procedure: Procedure) => {
    setProcedureToDelete(procedure);
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    if (!procedureToDelete) return;
    
    try {
      // Verificar se o procedimento está sendo usado em agendamentos
      const isUsed = await ProceduresService.isUsedInAppointments(procedureToDelete.id);
      
      if (isUsed) {
        // Fechar o modal de confirmação atual
        setDeleteConfirmationOpen(false);
        
        // Mostrar alerta informativo
        setInUseAlertOpen(true);
        return;
      }
      
      await ProceduresService.delete(procedureToDelete.id);
      await loadProcedures();
      setDeleteConfirmationOpen(false);
      setProcedureToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir procedimento:', error);
      toast.error('Erro ao excluir procedimento');
    }
  };

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProcedure(null)
    loadProcedures()
  }

  const cancelDelete = () => {
    setDeleteConfirmationOpen(false);
    setProcedureToDelete(null);
  };

  const closeInUseAlert = () => {
    setInUseAlertOpen(false)
    setProcedureToDelete(null)
  }

  const handleArchiveProcedure = async () => {
    if (!procedureToDelete) return

    try {
      await ProceduresService.archive(procedureToDelete.id)
      toast.success("Procedimento arquivado com sucesso.")
      loadProcedures()
      closeInUseAlert()
    } catch (error) {
      console.error('Erro ao arquivar procedimento:', error)
      toast.error("Erro ao arquivar procedimento. Tente novamente.")
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Carregando procedimentos...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Procedimentos</h1>
          <p className="text-muted-foreground">Gerencie seus procedimentos estéticos</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {isMobile ? 'Novo' : 'Novo Procedimento'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar procedimentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de procedimentos */}
      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum procedimento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro procedimento'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Procedimento
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProcedures.map((procedure) => (
            <Card key={procedure.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{procedure.name}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(procedure)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(procedure)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {procedure.description && (
                  <CardDescription className="mb-3">
                    {procedure.description}
                  </CardDescription>
                )}
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(procedure.price)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {procedure.duration_minutes} min
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal do formulário */}
      {showForm && (
        <ProcedureForm
          procedure={editingProcedure}
          onClose={handleFormClose}
        />
      )}

      {/* Modais de confirmação */}
      <ConfirmationAlert
        isOpen={deleteConfirmationOpen}
        title="Confirmar Exclusão"
        description={`Tem certeza que deseja excluir o procedimento "${procedureToDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        variant="destructive"
      />
      
      <ConfirmationAlert
          isOpen={inUseAlertOpen}
          title="Procedimento em uso"
          description="Este procedimento não pode ser excluído pois possui agendamentos vinculados. Deseja arquivá-lo? Procedimentos arquivados não aparecerão na lista ativa, mas podem ser restaurados posteriormente."
          onConfirm={handleArchiveProcedure}
          onCancel={closeInUseAlert}
          variant="default"
        />
    </div>
  )
}