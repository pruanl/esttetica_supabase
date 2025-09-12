import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { ProceduresService } from '../services/proceduresService'
import type { Procedure } from '../types/database'
import { ProcedureForm } from '../components/ProcedureForm'
import { useIsMobile } from '../hooks/use-mobile'

export function Procedures() {
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [filteredProcedures, setFilteredProcedures] = useState<Procedure[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)
  const isMobile = useIsMobile()

  useEffect(() => {
    loadProcedures()
    loadCategories()
  }, [])

  useEffect(() => {
    filterProcedures()
  }, [procedures, searchTerm, selectedCategory])

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

  const loadCategories = async () => {
    try {
      const data = await ProceduresService.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
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

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(procedure => procedure.category === selectedCategory)
    }

    setFilteredProcedures(filtered)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este procedimento?')) {
      try {
        await ProceduresService.delete(id)
        await loadProcedures()
      } catch (error) {
        console.error('Erro ao excluir procedimento:', error)
        alert('Erro ao excluir procedimento')
      }
    }
  }

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingProcedure(null)
    loadProcedures()
  }

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
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">Todas as categorias</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Lista de procedimentos */}
      {filteredProcedures.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum procedimento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro procedimento'}
              </p>
              {!searchTerm && selectedCategory === 'all' && (
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
                    {procedure.category && (
                      <Badge variant="secondary" className="mt-1">
                        {procedure.category}
                      </Badge>
                    )}
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
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(procedure.id)}
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
    </div>
  )
}